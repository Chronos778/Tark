"""
Comprehensive RAG System Test Suite
Tests all components before optimization
"""

import os
import sys
import time
import asyncio
import requests
from typing import Dict, Any

# Add Tesseract to PATH for this session
tesseract_path = r"C:\Program Files\Tesseract-OCR"
if tesseract_path not in os.environ['PATH']:
    os.environ['PATH'] += os.pathsep + tesseract_path

print("="*80)
print("🧪 COMPREHENSIVE RAG SYSTEM TEST")
print("="*80)

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def test_result(name: str, success: bool, message: str = "", is_warning: bool = False):
    """Track and display test result"""
    if is_warning:
        test_results["warnings"].append((name, message))
        print(f"   ⚠️  {name}: {message}")
    elif success:
        test_results["passed"].append(name)
        print(f"   ✅ {name}")
        if message:
            print(f"      {message}")
    else:
        test_results["failed"].append((name, message))
        print(f"   ❌ {name}: {message}")

# ============================================================================
# TEST 1: Environment & Dependencies
# ============================================================================
print("\n📦 TEST 1: Environment & Dependencies")
print("-" * 80)

# Check Python version
try:
    python_version = sys.version.split()[0]
    test_result("Python Version", True, f"v{python_version}")
except Exception as e:
    test_result("Python Version", False, str(e))

# Check critical imports
dependencies = [
    "chromadb",
    "fastapi",
    "uvicorn",
    "pydantic",
    "requests",
    "fitz",  # PyMuPDF
    "pytesseract",
]

for dep in dependencies:
    try:
        __import__(dep)
        test_result(f"Import {dep}", True)
    except ImportError as e:
        test_result(f"Import {dep}", False, str(e))

# Check OpenRouter API Key
api_key = os.getenv("OPENROUTER_API_KEY")
if api_key:
    test_result("OpenRouter API Key", True, f"Found ({api_key[:10]}...)")
else:
    test_result("OpenRouter API Key", False, "Missing in .env file")

# ============================================================================
# TEST 2: Vector Database
# ============================================================================
print("\n💾 TEST 2: Vector Database")
print("-" * 80)

try:
    import chromadb
    from chromadb.utils import embedding_functions
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    chroma_path = os.path.join(base_dir, "chroma_db")
    
    if not os.path.exists(chroma_path):
        test_result("ChromaDB Directory", False, f"Path not found: {chroma_path}")
    else:
        test_result("ChromaDB Directory", True, f"Path: {chroma_path}")
        
        # Connect to DB
        start = time.time()
        db_client = chromadb.PersistentClient(path=chroma_path)
        connection_time = time.time() - start
        test_result("ChromaDB Connection", True, f"Connected in {connection_time:.2f}s")
        
        # Check collection
        try:
            ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            collection = db_client.get_collection(name="legal_knowledge", embedding_function=ef)
            doc_count = collection.count()
            
            if doc_count == 0:
                test_result("Vector Database Content", False, "Collection is empty!")
            elif doc_count < 100:
                test_result("Vector Database Content", True, f"{doc_count} documents", is_warning=True)
            else:
                test_result("Vector Database Content", True, f"{doc_count} documents")
            
            # Test query
            if doc_count > 0:
                start = time.time()
                results = collection.query(
                    query_texts=["What is Section 302 IPC?"],
                    n_results=3
                )
                query_time = time.time() - start
                test_result("Vector Search Performance", True, f"{query_time:.2f}s for 3 results")
                
        except Exception as e:
            test_result("Vector Database Collection", False, str(e))
        
except Exception as e:
    test_result("Vector Database Setup", False, str(e))

# ============================================================================
# TEST 3: RAG Engine Components
# ============================================================================
print("\n🧠 TEST 3: RAG Engine Components")
print("-" * 80)

try:
    from text_processor import TextProcessor
    processor = TextProcessor()
    test_result("TextProcessor Import", True)
    
    # Test language detection
    test_text = "This is a legal document about Section 302 IPC."
    lang = processor.detect_language(test_text)
    test_result("Language Detection", lang in ['en', 'hi', 'unknown'], f"Detected: {lang}")
    
    # Test text cleaning
    dirty = "This  is   a    test\\n\\n\\nwith   extra   spaces"
    clean = processor.clean_text(dirty)
    test_result("Text Cleaning", len(clean) < len(dirty), f"{len(dirty)} → {len(clean)} chars")
    
except Exception as e:
    test_result("TextProcessor", False, str(e))

try:
    from conversation_memory import ConversationMemory
    memory = ConversationMemory()
    test_result("ConversationMemory Import", True)
    
    # Test session management
    session_id = memory.create_session()
    test_result("Session Creation", session_id is not None, f"ID: {session_id[:12]}...")
    
    memory.add_message(session_id, "user", "Test question")
    memory.add_message(session_id, "assistant", "Test answer")
    history = memory.get_history(session_id)
    test_result("Message Storage", len(history) == 2, f"{len(history)} messages stored")
    
except Exception as e:
    test_result("ConversationMemory", False, str(e))

try:
    from rag_engine import RAGEngine
    engine = RAGEngine()
    test_result("RAG Engine Import", True)
    test_result("RAG Integration", 
                engine.text_processor is not None and engine.conversation_memory is not None)
    
except Exception as e:
    test_result("RAG Engine", False, str(e))

# ============================================================================
# TEST 4: Backend Server
# ============================================================================
print("\n🌐 TEST 4: Backend Server")
print("-" * 80)

backend_url = "http://localhost:8000"

try:
    # Test health endpoint
    response = requests.get(f"{backend_url}/health", timeout=5)
    if response.status_code == 200:
        test_result("Backend Health Check", True, "Server is running")
    else:
        test_result("Backend Health Check", False, f"Status: {response.status_code}")
except requests.exceptions.ConnectionError:
    test_result("Backend Health Check", False, "Server not running. Start with: uvicorn main:app --reload --port 8000")
except Exception as e:
    test_result("Backend Health Check", False, str(e))

# ============================================================================
# TEST 5: Query Performance Test
# ============================================================================
print("\n⚡ TEST 5: Query Performance (Simulated)")
print("-" * 80)

test_queries = [
    ("simple", "Hi, how are you?"),
    ("simple", "What can you do?"),
    ("legal", "What is Section 302 IPC?"),
    ("legal", "Explain bail provisions in BNS"),
    ("legal", "Difference between IPC and BNS"),
]

print("📝 Query Classification Tests:")
for query_type, query in test_queries:
    print(f"   • \"{query}\"")
    print(f"     Expected: {query_type} query")

# ============================================================================
# TEST 6: End-to-End Test (if server is running)
# ============================================================================
print("\n🔄 TEST 6: End-to-End Query Test")
print("-" * 80)

if "Backend Health Check" in test_results["passed"]:
    try:
        # Test simple query
        test_query = "What is Section 302 IPC?"
        print(f"\\nTesting query: '{test_query}'")
        
        start = time.time()
        response = requests.post(
            f"{backend_url}/query",
            json={
                "query": test_query,
                "language": "en",
                "domain": "all",
                "arguments_mode": False,
                "analysis_mode": False
            },
            timeout=30
        )
        response_time = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            has_answer = "answer" in data and len(data["answer"]) > 0
            has_citations = "citations" in data
            
            test_result("Query Execution", has_answer, f"Response time: {response_time:.2f}s")
            
            if response_time > 15:
                test_result("Response Time", False, f"{response_time:.2f}s (OVER 15s limit!)")
            elif response_time > 10:
                test_result("Response Time", True, f"{response_time:.2f}s (close to limit)", is_warning=True)
            else:
                test_result("Response Time", True, f"{response_time:.2f}s")
            
            test_result("Response Structure", has_citations, 
                       f"Answer: {len(data.get('answer', ''))} chars, Citations: {len(data.get('citations', []))}")
            
            # Print sample response
            print("\\n   Sample Response:")
            answer_preview = data.get("answer", "")[:200]
            print(f"   {answer_preview}...")
            
        else:
            test_result("Query Execution", False, f"Status: {response.status_code}")
            
    except requests.exceptions.Timeout:
        test_result("Query Execution", False, "Request timed out (>30s)")
    except Exception as e:
        test_result("Query Execution", False, str(e))
else:
    print("⏭️  Skipping (backend not running)")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "="*80)
print("📊 TEST SUMMARY")
print("="*80)

total_tests = len(test_results["passed"]) + len(test_results["failed"]) + len(test_results["warnings"])
passed = len(test_results["passed"])
failed = len(test_results["failed"])
warnings = len(test_results["warnings"])

print(f"\n✅ Passed: {passed}/{total_tests}")
print(f"❌ Failed: {failed}/{total_tests}")
print(f"⚠️  Warnings: {warnings}/{total_tests}")

if failed > 0:
    print("\n🔴 FAILED TESTS:")
    for name, message in test_results["failed"]:
        print(f"   • {name}: {message}")

if warnings > 0:
    print("\n🟡 WARNINGS:")
    for name, message in test_results["warnings"]:
        print(f"   • {name}: {message}")

print("\n" + "="*80)
if failed == 0:
    print("✅ SYSTEM READY FOR OPTIMIZATION")
    print("\n📝 Recommendations:")
    print("   1. Implement query classification (simple vs legal)")
    print("   2. Add timeout protection (10-12s)")
    print("   3. Optimize vector search (reduce n_results)")
    print("   4. Add session ID to frontend")
else:
    print("❌ SYSTEM NEEDS FIXES BEFORE OPTIMIZATION")
    print("\n📝 Required Actions:")
    for name, message in test_results["failed"]:
        print(f"   • Fix: {name}")

print("="*80)
