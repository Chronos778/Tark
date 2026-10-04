"""
Load the curated multi-domain sections (IT Act, Companies Act, Consumer Protection Act,
Motor Vehicles Act) into the engine's ChromaDB collection with proper law/section metadata.

Safe to re-run: ids are deterministic and existing ids are skipped.
Run from the project root:  .venv\\Scripts\\python.exe scripts\\ingest_curated_acts.py
"""
import json
import pathlib
import re

import chromadb
from chromadb.utils import embedding_functions

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "rag_service" / "data"
CHROMA = ROOT / "rag_service" / "chroma_db"

# Short law names, matching how the engine labels BNS / IPC (used for citations and URLs)
LAW_NAMES = {
    "IT Act 2000": "IT Act",
    "Companies Act 2013": "Companies Act",
    "Consumer Protection Act 2019": "Consumer Protection Act",
    "Motor Vehicles Act 1988": "Motor Vehicles Act",
}
DOMAINS = {
    "IT Act": "Cyber Law",
    "Companies Act": "Corporate Law",
    "Consumer Protection Act": "Consumer Law",
    "Motor Vehicles Act": "Transport Law",
}


def load_sections():
    seen, out = set(), []
    # comprehensive first so its (richer) entries win on duplicates
    for name in ("comprehensive_multi_domain.json", "multi_domain_acts.json"):
        for row in json.loads((DATA / name).read_text(encoding="utf-8")):
            act = row["act"]
            number = re.sub(r"^Section\s+", "", str(row["section"]).strip(), flags=re.I)
            key = (act, number)
            if key in seen:
                continue
            seen.add(key)
            out.append({**row, "number": number})
    return out


def main():
    client = chromadb.PersistentClient(path=str(CHROMA))
    col = client.get_or_create_collection(
        name="legal_knowledge", embedding_function=embedding_functions.DefaultEmbeddingFunction()
    )
    sections = load_sections()

    ids, docs, metas = [], [], []
    for s in sections:
        law = LAW_NAMES.get(s["act"], s["act"])
        text = re.sub(r"\s+", " ", s["description"]).strip()
        ids.append("curated::" + re.sub(r"[^a-z0-9]+", "_", f"{law}_{s['number']}".lower()))
        docs.append(f"Statute: {s['act']} Section {s['number']}. Topic: {s['title']}. Description: {text}")
        metas.append(
            {
                "type": "statute",
                "law": law,
                "source": s["act"],
                "topic": s["title"],
                "section": s["number"],
                "domain": DOMAINS.get(law, "General"),
            }
        )

    existing = set(col.get(ids=ids)["ids"])
    new = [i for i, _id in enumerate(ids) if _id not in existing]
    if not new:
        print("Nothing to add; all curated sections are already loaded.")
        return
    col.add(
        ids=[ids[i] for i in new],
        documents=[docs[i] for i in new],
        metadatas=[metas[i] for i in new],
    )
    print(f"Added {len(new)} sections ({len(existing)} already present). Collection now has {col.count()} documents.")


if __name__ == "__main__":
    main()
