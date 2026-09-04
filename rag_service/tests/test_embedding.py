import time
print("Testing Embedding Function...")
start = time.time()
try:
    from chromadb.utils import embedding_functions
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    print(f"Embedding Function created ({time.time() - start:.2f}s)")
    
    emb = ef(["test"])
    print("Embedding generated")
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
