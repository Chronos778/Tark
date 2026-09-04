"""
Ingest multi-domain legal acts into ChromaDB vector database
Adds IT Act, Companies Act, Consumer Protection Act, Motor Vehicles Act
"""

import json
import os
import sys
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

BASE_DIR = "d:/HACATHONS/RUBIX TSEC/legal-compass-ai-main"
DATA_DIR = os.path.join(BASE_DIR, "rag_service/data")
CHROMA_DIR = os.path.join(BASE_DIR, "rag_service/chroma_db")

def ingest_multi_domain_acts():
    """Ingest multi-domain acts into vector database"""
    
    print("🚀 Ingesting Multi-Domain Legal Acts into Vector DB\n")
    
    # 1. Load the dataset
    dataset_file = os.path.join(DATA_DIR, "multi_domain_acts.json")
    with open(dataset_file, 'r', encoding='utf-8') as f:
        sections = json.load(f)
    
    print(f"📖 Loaded {len(sections)} sections from multi-domain dataset")
    
    # 2. Initialize ChromaDB
    print("🔌 Connecting to ChromaDB...")
    client = chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(anonymized_telemetry=False)
    )
    
    collection = client.get_or_create_collection(
        name="legal_knowledge",
        metadata={"description": "Legal knowledge base with multi-domain acts"}
    )
    
    print(f"✅ Connected to collection: {collection.name}")
    print(f"📊 Current documents in DB: {collection.count()}")
    
    # 3. Prepare documents for ingestion
    documents = []
    metadatas = []
    ids = []
    
    for idx, section in enumerate(sections):
        # Create semantic text for better retrieval
        semantic_text = f"{section['act']} {section['section']}: {section['title']}. {section['description']}"
        
        documents.append(semantic_text)
        metadatas.append({
            "type": "statute",
            "act": section['act'],
            "section": section['section'],
            "title": section['title'],
            "domain": get_domain(section['act'])
        })
        ids.append(f"multi_domain_{idx}")
    
    # 4. Upsert to ChromaDB
    print("\n💾 Ingesting documents into vector database...")
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"✅ Successfully ingested {len(documents)} documents!")
    print(f"📊 Total documents in DB now: {collection.count()}")
    
    # 5. Test query
    print("\n🔍 Testing query: 'What is the punishment for cyber terrorism?'")
    results = collection.query(
        query_texts=["What is the punishment for cyber terrorism?"],
        n_results=3
    )
    
    print("\n📋 Top 3 Results:")
    for i, (doc, meta) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
        print(f"\n{i+1}. {meta['section']} - {meta['title']}")
        print(f"   Act: {meta['act']}")
        print(f"   Domain: {meta['domain']}")
        print(f"   Preview: {doc[:150]}...")
    
    print("\n✅ Multi-domain dataset successfully populated!")

def get_domain(act_name):
    """Map act to domain"""
    if "IPC" in act_name or "BNS" in act_name:
        return "Criminal Law"
    elif "IT Act" in act_name or "Information Technology" in act_name:
        return "IT & Cyber Law"
    elif "Companies Act" in act_name:
        return "Corporate Law"
    elif "Consumer Protection" in act_name:
        return "Consumer Law"
    elif "Motor Vehicles" in act_name:
        return "Transport Law"
    else:
        return "General Law"

if __name__ == "__main__":
    try:
        ingest_multi_domain_acts()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
