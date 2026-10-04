"""
Retrieval quality check: for each question, is the correct section among the passages
we would hand to the model?  Compares plain vector search with the keyword re-ranker.

Run from the project root:
  .venv\\Scripts\\python.exe rag_service\\tests\\eval_retrieval.py
"""
import pathlib
import sys

import chromadb
from chromadb.utils import embedding_functions

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from rerank import select_context  # noqa: E402

# (question, law, section) - the section a correct answer must be grounded in
CASES = [
    ("What is the punishment for murder under BNS?", "BNS", "103"),
    ("punishment for theft", "BNS", "303"),
    ("punishment for cheating under BNS", "BNS", "318"),
    ("What is the punishment for rape?", "BNS", "64"),
    ("Is defamation a criminal offence?", "BNS", "356"),
    ("What replaced sedition 124A in BNS?", "BNS", "152"),
    ("punishment for dacoity", "BNS", "310"),
    ("what is robbery under BNS", "BNS", "309"),
    ("what is extortion", "BNS", "308"),
    ("criminal breach of trust punishment", "BNS", "316"),
    ("culpable homicide not amounting to murder", "BNS", "100"),
    ("dowry death punishment", "BNS", "80"),
    ("stalking law in India", "BNS", "78"),
    ("what is unlawful assembly", "BNS", "189"),
    ("rioting punishment", "BNS", "191"),
    ("attempt to murder", "BNS", "109"),
    ("kidnapping punishment", "BNS", "137"),
    ("forgery punishment", "BNS", "336"),
    ("What is IPC section 302?", "IPC", "302"),
    ("explain section 376 IPC", "IPC", "376"),
    ("punishment for cheating under the IPC", "IPC", "420"),
    ("cruelty by husband or his relatives under IPC", "IPC", "498A"),
    ("dowry death under the Indian Penal Code", "IPC", "304B"),
    ("outraging the modesty of a woman IPC", "IPC", "354"),
    ("IPC punishment for theft", "IPC", "379"),
    ("punishment for hacking a computer system", "IT Act", "66"),
    ("identity theft by electronic means", "IT Act", "66C"),
    ("penalty for damage to a computer system without permission", "IT Act", "43"),
    ("violation of privacy by capturing images", "IT Act", "66E"),
    ("government power to block websites", "IT Act", "69A"),
    ("punishment for publishing obscene material online", "IT Act", "67"),
    ("cyber terrorism punishment", "IT Act", "66F"),
    ("legal recognition of electronic records", "IT Act", "4"),
    ("How do I file a consumer complaint for a defective product?", "Consumer Protection Act", None),
    ("what is product liability under consumer law", "Consumer Protection Act", None),
    ("who is a director of a company", "Companies Act", None),
    ("penalty for driving without a licence", "Motor Vehicles Act", None),
    ("drunk driving punishment", "Motor Vehicles Act", None),
]


def meta_section(meta):
    v = meta.get("section") or meta.get("bns_section") or meta.get("ipc_section") or ""
    return str(v).replace("Section", "").strip()


def hit(selected, law, section):
    if law.startswith("text:"):
        needle = law[5:]
        return any(needle in doc.lower() for doc, _meta, _s in selected)
    for _doc, meta, _s in selected:
        m_law = meta.get("law") or ""
        if m_law != law:
            continue
        if section is None or meta_section(meta).lower() == section.lower():
            return True
    return False


def main():
    col = chromadb.PersistentClient(path=str(ROOT / "chroma_db")).get_collection(
        "legal_knowledge", embedding_function=embedding_functions.DefaultEmbeddingFunction()
    )
    score = {False: 0, True: 0}
    print(f"{'question':64} {'vector':>7} {'rerank':>7}")
    for q, law, sec in CASES:
        r = col.query(query_texts=[q], n_results=30, include=["documents", "metadatas", "distances"])
        row = []
        for use in (False, True):
            sel = select_context(q, r["documents"][0], r["metadatas"][0], r["distances"][0], use_rerank=use)
            ok = hit(sel, law, sec)
            score[use] += ok
            row.append("ok" if ok else "MISS")
        print(f"{q[:64]:64} {row[0]:>7} {row[1]:>7}")
    n = len(CASES)
    print(f"\nvector only: {score[False]}/{n}   with rerank: {score[True]}/{n}")
    # Fail CI if retrieval quality regresses
    sys.exit(0 if score[True] >= 0.9 * n else 1)


if __name__ == "__main__":
    main()
