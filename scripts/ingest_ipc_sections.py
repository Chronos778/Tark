"""
Load the full IPC (444 sections) from "datasets resources/ipc_sections.csv" into the vector DB.

Only 6 IPC sections were indexed before, so questions about most IPC sections got thin answers.
Each entry gets law/ipc_section/topic metadata like the BNS entries, so the re-ranker and the
explicit "section 420 IPC" lookup work for them too.

Safe to re-run: ids are deterministic and sections already in the DB are skipped.
Stop the RAG server first (it holds the DB), then from the project root:
  .venv\\Scripts\\python.exe scripts\\ingest_ipc_sections.py
"""
import csv
import pathlib
import re

import chromadb
from chromadb.utils import embedding_functions

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "datasets resources" / "ipc_sections.csv"
CHROMA = ROOT / "rag_service" / "chroma_db"


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def main():
    client = chromadb.PersistentClient(path=str(CHROMA))
    col = client.get_collection("legal_knowledge", embedding_function=embedding_functions.DefaultEmbeddingFunction())

    present = {m.get("ipc_section") for m in col.get(where={"law": "IPC"}, include=["metadatas"])["metadatas"]}

    ids, docs, metas = [], [], []
    seen = set()
    with open(CSV_PATH, encoding="utf-8", errors="replace", newline="") as fh:
        for row in csv.DictReader(fh):
            number = re.sub(r"^IPC_", "", clean(row.get("Section", "")))
            if not number or number in present or number in seen:
                continue  # already indexed, or a duplicate row in the CSV
            seen.add(number)
            offense = clean(row.get("Offense", ""))
            punishment = clean(row.get("Punishment", ""))
            description = clean(re.sub(r"^Description of IPC Section [^\r\n]*[\r\n]+", "", row.get("Description", "")))
            topic = offense[:160] or f"IPC Section {number}"
            ids.append(f"ipc::{number.lower()}")
            docs.append(
                f"Statute: Indian Penal Code (IPC) Section {number}. Topic: {topic}. "
                f"Punishment: {punishment or 'Not specified'}. Description: {description[:2500]}"
            )
            metas.append(
                {
                    "type": "statute",
                    "law": "IPC",
                    "source": "Indian Penal Code, 1860",
                    "topic": topic,
                    "ipc_section": number,
                    "section": number,
                    "domain": "Criminal Law",
                }
            )

    have = set(col.get(ids=ids)["ids"]) if ids else set()
    keep = [i for i, _id in enumerate(ids) if _id not in have]
    if not keep:
        print("Nothing to add; the IPC is already loaded.")
        return
    col.add(ids=[ids[i] for i in keep], documents=[docs[i] for i in keep], metadatas=[metas[i] for i in keep])
    print(f"Added {len(keep)} IPC sections. Collection now has {col.count()} documents.")


if __name__ == "__main__":
    main()
