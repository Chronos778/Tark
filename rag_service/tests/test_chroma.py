import chromadb
import os
import time

print("Testing ChromaDB connection...")
start = time.time()
try:
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
    client = chromadb.PersistentClient(path=path)
    print(f"Client created ({time.time() - start:.2f}s)")
    
    coll = client.get_collection("legal_knowledge")
    print(f"Collection retrieved. Count: {coll.count()}")
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
