
import os
import json
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
import requests
from typing import List

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "rag_service", "data")
CHROMA_DB_PATH = os.path.join(BASE_DIR, "rag_service", "chroma_db")

# Load .env
load_dotenv(os.path.join(BASE_DIR, ".env"))

class NvidiaEmbeddingFunction(chromadb.EmbeddingFunction):
    def __init__(self, api_key):
        self.api_key = api_key
        self.url = "https://integrate.api.nvidia.com/v1/embeddings"
    
    def __call__(self, input: List[str]) -> List[List[float]]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        data = {"input": input, "model": "nvidia/nv-embedqa-e5-v5", "input_type": "query", "encoding_format": "float"}
        response = requests.post(self.url, headers=headers, json=data)
        if response.status_code != 200:
            raise Exception(f"NVIDIA Embedding Error: {response.text}")
        return [item["embedding"] for item in response.json()["data"]]

def ingest_vector_db():
    print(f"🚀 Starting Vector DB Ingestion into {CHROMA_DB_PATH}...")
    
    # 1. Initialize ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    
    nvidia_api_key = os.getenv("NVIDIA_API_KEY")
    if nvidia_api_key:
        print("🔑 Found NVIDIA_API_KEY. Using NVIDIA Cloud Embeddings (nv-embedqa-e5-v5)...")
        ef = NvidiaEmbeddingFunction(nvidia_api_key)
        collection_name = "legal_knowledge_v2"
    else:
        print("ℹ️ Using local SentenceTransformer embeddings...")
        try:
            ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        except Exception:
            ef = embedding_functions.DefaultEmbeddingFunction()
        collection_name = "legal_knowledge"
        
    # Get or create collection
    collection = client.get_or_create_collection(name=collection_name, embedding_function=ef)
    print(f"✅ ChromaDB Collection '{collection_name}' ready.")
    
    documents = []
    metadatas = []
    ids = []
    
    # 2. Process Statutes (IPC/BNS)
    statute_map_path = os.path.join(DATA_DIR, "ipc_bns_mapping.json")
    if os.path.exists(statute_map_path):
        with open(statute_map_path, 'r', encoding='utf-8') as f:
            statutes = json.load(f)
            print(f"📄 Processing {len(statutes)} statutes...")
            
            for item in statutes:
                # Construct Rich Semantic Text
                bns_text = item.get("text_bns", "")
                ipc_text = item.get("text_ipc", "") or ""
                topic = item.get("topic", "")

                # BNS document (kept separate for citation accuracy)
                bns_doc = f"Statute: Bharatiya Nyaya Sanhita (BNS) Section {item['bns']}. Topic: {topic}. Description: {bns_text}"
                documents.append(bns_doc)
                metadatas.append({
                    "type": "statute",
                    "source": "Bharatiya Nyaya Sanhita, 2023",
                    "law": "BNS",
                    "bns_section": item.get("bns", ""),
                    "topic": topic
                })
                ids.append(f"statute_bns_{item['bns']}")

                # IPC document (only if mapping exists)
                if item.get("ipc"):
                    ipc_doc = f"Statute: Indian Penal Code (IPC) Section {item['ipc']}. Topic: {topic}. Description: {ipc_text}"
                    documents.append(ipc_doc)
                    metadatas.append({
                        "type": "statute",
                        "source": "Indian Penal Code, 1860",
                        "law": "IPC",
                        "ipc_section": item.get("ipc", ""),
                        "topic": topic
                    })
                    ids.append(f"statute_ipc_{item['ipc']}")
    
    # 3. Process Judgments (Golden Dataset)
    golden_path = os.path.join(DATA_DIR, "golden_dataset.json")
    if os.path.exists(golden_path):
        with open(golden_path, 'r', encoding='utf-8') as f:
            judgments = json.load(f)
            print(f"⚖️ Processing {len(judgments)} judgments...")
            
            for idx, topic_item in enumerate(judgments):
                # The 'golden_dataset' is grouped by TOPIC, containing a list of 'case_laws'
                topic_keywords = ", ".join(topic_item.get("keywords", []))
                case_laws = topic_item.get("case_laws", [])

                for case in case_laws:
                    title = case.get("title", "Unknown Case")
                    summary = case.get("summary", "")
                    
                    # Create a rich vector document
                    doc_text = f"Case Judgment: {title}. Topic Keywords: {topic_keywords}. Legal Summary: {summary}"
                    
                    documents.append(doc_text)
                    metadatas.append({
                        "type": "judgment",
                        "source": "Supreme Court",
                        "title": title,
                        "case_id": title.replace(" ", "_")[:20], # Simple ID generation
                        "keywords": topic_keywords
                    })
                    ids.append(f"judgment_{len(ids)}") # Unique incrementing ID

    # 4. Process IT Act (Raw Text)
    it_act_path = os.path.join(BASE_DIR, "datasets resources", "it.txt")
    if os.path.exists(it_act_path):
        print(f"📡 Processing IT Act from {it_act_path}...")
        with open(it_act_path, 'r', encoding='utf-8') as f:
            text = f.read()
            
            # Simple chunking for IT Act
            chunk_size = 1000
            overlap = 200
            
            for i in range(0, len(text), chunk_size - overlap):
                chunk = text[i:i + chunk_size]
                if len(chunk) < 50: continue
                
                doc_text = f"Statute: Information Technology Act, 2000. Text: {chunk}"
                
                documents.append(doc_text)
                metadatas.append({
                    "type": "statute",
                    "source": "IT Act 2000",
                    "topic": "Cyber Law"
                })
                ids.append(f"it_act_{i}")
        print(f"✅ Added {len(ids) - len(judgments) if 'judgments' in locals() else 'many'} IT Act chunks.")

    # 5. Upsert to Chroma
    if documents:
        print(f"💾 Upserting {len(documents)} documents to Vector DB... (This may take a moment)")
        # Batching is better for large datasets, but 1500 is ok for one shot here
        collection.upsert(documents=documents, metadatas=metadatas, ids=ids)
        print("🎉 Success! Vector DB populated.")
    else:
        print("⚠️ No documents found to ingest.")

if __name__ == "__main__":
    ingest_vector_db()
