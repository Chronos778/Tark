
import os
import chromadb
from chromadb.utils import embedding_functions

# Config
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_DB_PATH = os.path.join(BASE_DIR, "rag_service", "chroma_db")

print(f"--- Testing RAG Retrieval from {CHROMA_DB_PATH} ---")

try:
    # 1. Connect to DB
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_collection(name="legal_knowledge", embedding_function=ef)
    
    print(f"✅ Collection found with {collection.count()} documents.")
    
    # 2. Test Query (Judgment)
    query = "Bachan Singh vs State of Punjab"
    print(f"\n🔍 Querying: '{query}'")
    
    results = collection.query(
        query_texts=[query],
        n_results=3,
        include=["documents", "metadatas", "distances"]
    )
    
    docs = results['documents'][0]
    metas = results['metadatas'][0]
    dists = results['distances'][0]
    
    print(f"\nFound {len(docs)} results:\n")
    for i, doc in enumerate(docs):
        meta = metas[i]
        dist = dists[i]
        print(f"Result {i+1} (Distance: {dist:.4f}):")
        print(f"  Source: {meta.get('source')}")
        print(f"  Section: {meta.get('bns_section', 'N/A')} (IPC: {meta.get('ipc_section', 'N/A')})")
        print(f"  Content: {doc[:150]}...") # Truncate for display
        print("-" * 50)

except Exception as e:
    print(f"❌ Error: {e}")
