"""
Add section-labelled IT Act 2000 entries to the vector DB.

The Act was originally indexed as 155 raw 800-character chunks with no section metadata, so
answers about e.g. hacking could not cite "Section 66". This script stitches the chunks back
into the full text (the chunk id is its character offset), cuts it at the section headings,
and adds one labelled entry per section that is not already present as a curated entry.

Run from the project root (stop the RAG server first, it holds the DB):
  .venv\\Scripts\\python.exe scripts\\label_it_act_sections.py            # dry run, prints a report
  .venv\\Scripts\\python.exe scripts\\label_it_act_sections.py --apply    # write to the DB

Re-running is safe: existing ids are skipped.
"""
import pathlib
import re
import sys

import chromadb
from chromadb.utils import embedding_functions

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROMA = ROOT / "rag_service" / "chroma_db"
PREFIX = "Statute: Information Technology Act, 2000. Text: "

# "66. Computer related offences.—If any person ..."  The em/en dash after the title marks a real heading.
# The source text is messy: footnote digits and "[" can sit between the number and the title, titles can
# wrap across lines, and the dash may be an en dash.
HEADING = re.compile(
    r"(?<![\w.])(\d{1,2}[A-Z]{0,2})\.\s*(?:\d{1,2}\s*)?\[?\s*([A-Z][^—–]{2,260}?)\.?\]?\s?[—–]"
)
ANOTHER_HEADING = re.compile(r"\s\d{1,2}[A-Z]{0,2}\.\s")

# Notes that matter for anyone relying on the text
NOTES = {
    "66A": (
        "[NOTE: Section 66A was struck down as unconstitutional by the Supreme Court of India in "
        "Shreya Singhal v. Union of India (2015) and is no longer enforceable.]"
    ),
}


def stitch(col) -> str:
    got = col.get(where={"source": "IT Act 2000"}, include=["documents", "metadatas"])
    pieces = {}
    for _id, doc, meta in zip(got["ids"], got["documents"], got["metadatas"]):
        if "section" in meta or not _id.startswith("it_act_"):
            continue  # curated entries are handled separately
        pieces[int(_id.rsplit("_", 1)[1])] = doc[len(PREFIX):] if doc.startswith(PREFIX) else doc
    total = max(o + len(t) for o, t in pieces.items())
    buf = [" "] * total
    for offset, text in pieces.items():
        buf[offset:offset + len(text)] = text
    return "".join(buf)


def sec_key(label: str):
    m = re.match(r"(\d+)([A-Z]*)", label)
    return int(m.group(1)), m.group(2)


FOOTNOTE = re.compile(
    r"\b\d{1,2}\.\s+(?:Subs|Ins|Omitted|Added|Rep|Re-numbered|Renumbered|The words?|The figures?|The brackets?|"
    r"The expression|Clauses?|Sub-section)\b.{0,500}?\(w\.e\.f\.[^)]*\)\.?",
    re.S,
)
TRAILING_CHAPTER = re.compile(r"\s*CHAPTER [IVXL]+[A-Z0-9 ,\-&]*$")


def clean_body(raw: str) -> str:
    body = FOOTNOTE.sub(" ", raw)
    body = re.sub(r"\s+", " ", body).strip()
    return TRAILING_CHAPTER.sub("", body).strip()


def split_sections(text: str):
    """Return [(label, title, body)], one per section, in document order."""
    cands = []
    for m in HEADING.finditer(text):
        label = m.group(1)
        title = re.sub(r"\s+", " ", m.group(2).replace("]", "").replace("[", "")).strip(" .")
        title = re.sub(r"\s\d{1,2}(?=\s)", "", title)  # drop stray footnote numbers
        if not (1 <= sec_key(label)[0] <= 94) or ANOTHER_HEADING.search(" " + title) or len(title) > 200:
            continue
        cands.append([label, title, m.start(), m.end(), 0])
    for i, c in enumerate(cands):
        stop = cands[i + 1][2] if i + 1 < len(cands) else len(text)
        c[4] = len(text[c[3]:stop])
    best = {}
    for c in cands:  # the table of contents repeats headings with little text after them; keep the fullest
        if c[0] not in best or c[4] > best[c[0]][4]:
            best[c[0]] = c
    kept = sorted(best.values(), key=lambda c: c[2])
    out, last = [], (0, "")
    for i, (label, title, _start, end, _n) in enumerate(kept):
        key = sec_key(label)
        if key <= last:
            continue
        last = key
        stop = kept[i + 1][2] if i + 1 < len(kept) else len(text)
        out.append((label, title, clean_body(text[end:stop])))
    return out


def main(apply: bool):
    client = chromadb.PersistentClient(path=str(CHROMA))
    col = client.get_collection("legal_knowledge", embedding_function=embedding_functions.DefaultEmbeddingFunction())
    text = stitch(col)
    sections = split_sections(text)
    curated = {m["section"] for m in col.get(where={"law": "IT Act"}, include=["metadatas"])["metadatas"]}

    print(f"Reconstructed {len(text):,} characters; found {len(sections)} section headings.")
    new = [(l, t, b) for l, t, b in sections if l not in curated]
    print(f"{len(curated)} sections already curated; {len(new)} to add.\n")
    for label, title, body in sections:
        mark = "  (curated)" if label in curated else ""
        print(f"  {label:>5}  {title[:62]:62} {len(body):>5} chars{mark}")

    if not apply:
        print("\nDry run only. Re-run with --apply to write.")
        return

    ids, docs, metas = [], [], []
    for label, title, body in new:
        note = NOTES.get(label, "")
        content = f"{note} {body}".strip()[:3500]
        ids.append(f"itact::{label.lower()}")
        docs.append(f"Statute: Information Technology Act 2000 Section {label}. Topic: {title}. Description: {content}")
        metas.append({
            "type": "statute", "law": "IT Act", "source": "IT Act 2000",
            "topic": title, "section": label, "domain": "Cyber Law",
        })
    have = set(col.get(ids=ids)["ids"]) if ids else set()
    keep = [i for i, _id in enumerate(ids) if _id not in have]
    if keep:
        col.add(ids=[ids[i] for i in keep], documents=[docs[i] for i in keep], metadatas=[metas[i] for i in keep])
    print(f"\nAdded {len(keep)} labelled sections. Collection now has {col.count()} documents.")


if __name__ == "__main__":
    main("--apply" in sys.argv)
