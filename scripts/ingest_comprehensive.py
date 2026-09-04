"""
Ingest comprehensive multi-domain legal acts into ChromaDB
Final ingestion with 59 additional sections
"""

import json
import os
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

BASE_DIR = "d:/HACATHONS/RUBIX TSEC/legal-compass-ai-main"
DATA_DIR = os.path.join(BASE_DIR, "rag_service/data")
CHROMA_DIR = os.path.join(BASE_DIR, "rag_service/chroma_db")

def ingest_comprehensive_acts():
    """Ingest comprehensive multi-domain acts into vector database"""
    
    print("\n" + "="*70)
    print("🚀 FINAL INGESTION: Comprehensive Multi-Domain Legal Acts")
    print("="*70 + "\n")
    
    # 1. Load the comprehensive dataset
    dataset_file = os.path.join(DATA_DIR, "comprehensive_multi_domain.json")
    with open(dataset_file, 'r', encoding='utf-8') as f:
        sections = json.load(f)
    
    print(f"📖 Loaded {len(sections)} sections from comprehensive dataset")
    
    # 2. Initialize ChromaDB
    print("🔌 Connecting to ChromaDB...")
    client = chromadb.PersistentClient(
        path=CHROMA_DIR,
        settings=Settings(anonymized_telemetry=False)
   )
    
    collection = client.get_or_create_collection(
        name="legal_knowledge",
        metadata={"description": "Comprehensive legal knowledge base - multi-domain"}
    )
    
    print(f"✅ Connected to collection: {collection.name}")
    print(f"📊 Current documents in DB: {collection.count()}")
    
    # 3. Prepare documents for ingestion
    documents = []
    metadatas = []
    ids = []
    
    for idx, section in enumerate(sections):
        # Create rich semantic text for better retrieval
        semantic_text = (
            f"{section['act']} - {section['section']}: {section['title']}. "
            f"{section['description']} "
            f"Domain: {section['domain']}"
        )
        
        documents.append(semantic_text)
        metadatas.append({
            "type": "statute",
            "act": section['act'],
            "section_number": section['section'],
            "title": section['title'],
            "domain": section['domain'],
            "description": section['description'][:200]  # Limit for metadata
        })
        ids.append(f"comprehensive_{idx}")
    
    # 4. Upsert to ChromaDB
    print(f"\n💾 Ingesting {len(documents)} documents into vector database...")
    print("   This may take a moment...")
    
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    final_count = collection.count()
    added_count = len(documents)
    previous_count = final_count - added_count
    
    print(f"\n✅ Successfully ingested {added_count} new documents!")
    print(f"📊 Vector DB Statistics:")
    print(f"   Previous: {previous_count} documents")
    print(f"   Added: +{added_count} documents")
    print(f"   Total: {final_count} documents")
    
    # 5. Domain breakdown
    print("\n📋 Coverage by Legal Domain:")
    domain_stats = {}
    for meta in metadatas:
        domain = meta['domain']
        domain_stats[domain] = domain_stats.get(domain, 0) + 1
    
    for domain, count in sorted(domain_stats.items()):
        print(f"   ✓ {domain}: {count} sections")
    
    # 6. Test queries
    print("\n🔍 Testing Multi-Domain Queries:\n")
    
    test_queries = [
        ("What is the punishment for fraud in companies?", "Companies Act"),
        ("What are consumer rights for defective products?", "Consumer Protection"),
        ("What is the penalty for drunk driving?", "Motor Vehicles Act")
    ]
    
    for query, expected_act in test_queries:
        print(f"Q: {query}")
        results = collection.query(
            query_texts=[query],
            n_results=2
        )
        
        if results['metadatas'] and len(results['metadatas'][0]) > 0:
            top_result = results['metadatas'][0][0]
            print(f"   ✓ Found: {top_result.get('section_number', 'N/A')} - {top_result.get('title', 'N/A')}")
            print(f"   ✓ Act: {top_result.get('act', 'N/A')}\n")
        else:
            print("   ⚠️ No results found\n")
    
    print("="*70)
    print("✅ COMPREHENSIVE MULTI-DOMAIN DATASET READY FOR HACKATHON!")
    print("="*70)
    
    return final_count

if __name__ == "__main__":
    try:
        total_docs = ingest_comprehensive_acts()
        print(f"\n🎯 Final Count: {total_docs} documents ready for queries!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
