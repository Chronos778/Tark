"""
Test script to verify all enhanced RAG dependencies are installed correctly
"""

import sys

def test_imports():
    """Test all required imports for enhanced RAG features"""
    print("="*60)
    print("Testing Enhanced RAG Dependencies")
    print("="*60 + "\n")
    
    all_ok = True
    
    # Core dependencies
    print("📦 Core Dependencies:")
    try:
        import chromadb
        print("  ✓ ChromaDB installed")
    except ImportError:
        print("  ✗ ChromaDB not found - pip install chromadb")
        all_ok = False
    
    try:
        from sentence_transformers import SentenceTransformer
        print("  ✓ Sentence Transformers installed")
    except ImportError:
        print("  ✗ Sentence Transformers not found - pip install sentence-transformers")
        all_ok = False
    
    # Enhanced PDF processing
    print("\n📄 PDF Processing:")
    try:
        import fitz  # PyMuPDF
        print("  ✓ PyMuPDF (fitz) installed")
    except ImportError:
        print("  ✗ PyMuPDF not found - pip install pymupdf")
        all_ok = False
    
    try:
        import pdfplumber
        print("  ✓ pdfplumber installed")
    except ImportError:
        print("  ✗ pdfplumber not found - pip install pdfplumber")
        all_ok = False
    
    # OCR support
    print("\n🔍 OCR Support:")
    try:
        import pytesseract
        print("  ✓ Pytesseract installed")
        try:
            version = pytesseract.get_tesseract_version()
            print(f"    Tesseract version: {version}")
        except Exception as e:
            print(f"    ⚠️  Tesseract binary not found or not in PATH: {e}")
            print("    Install from: https://github.com/UB-Mannheim/tesseract/wiki")
            all_ok = False
    except ImportError:
        print("  ✗ Pytesseract not found - pip install pytesseract")
        all_ok = False
    
    try:
        from pdf2image import convert_from_bytes
        print("  ✓ pdf2image installed")
        # Test if poppler is available
        try:
            import subprocess
            result = subprocess.run(['pdftoppm', '-v'], capture_output=True, text=True)
            print("    Poppler utilities found")
        except FileNotFoundError:
            print("    ⚠️  Poppler utilities not found")
            print("    Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases")
            print("    macOS: brew install poppler")
            print("    Linux: sudo apt-get install poppler-utils")
            all_ok = False
    except ImportError:
        print("  ✗ pdf2image not found - pip install pdf2image")
        all_ok = False
    
    # Language detection
    print("\n🌐 Language Detection:")
    try:
        from lingua import LanguageDetectorBuilder, Language
        print("  ✓ Lingua language detector installed")
        detector = LanguageDetectorBuilder.from_languages(
            Language.ENGLISH, Language.HINDI
        ).build()
        print("    English and Hindi support configured")
    except ImportError:
        print("  ✗ Lingua not found - pip install lingua-language-detector")
        all_ok = False
    
    # Web scraping (optional)
    print("\n🕷️  Web Scraping (Optional):")
    try:
        import cloudscraper
        print("  ✓ CloudScraper installed")
    except ImportError:
        print("  ⚠️  CloudScraper not found (optional) - pip install cloudscraper")
    
    try:
        from bs4 import BeautifulSoup
        print("  ✓ BeautifulSoup4 installed")
    except ImportError:
        print("  ⚠️  BeautifulSoup4 not found (optional) - pip install beautifulsoup4")
    
    # LangChain (optional but recommended)
    print("\n🔗 LangChain (Optional):")
    try:
        import langchain
        print("  ✓ LangChain installed")
    except ImportError:
        print("  ⚠️  LangChain not found (optional) - pip install langchain")
    
    try:
        import langchain_community
        print("  ✓ LangChain Community installed")
    except ImportError:
        print("  ⚠️  LangChain Community not found (optional) - pip install langchain-community")
    
    # FastAPI
    print("\n🚀 API Framework:")
    try:
        import fastapi
        print("  ✓ FastAPI installed")
    except ImportError:
        print("  ✗ FastAPI not found - pip install fastapi")
        all_ok = False
    
    try:
        import uvicorn
        print("  ✓ Uvicorn installed")
    except ImportError:
        print("  ✗ Uvicorn not found - pip install uvicorn")
        all_ok = False
    
    # Summary
    print("\n" + "="*60)
    if all_ok:
        print("✅ All required dependencies are installed!")
        print("You can now run the enhanced RAG service.")
    else:
        print("❌ Some required dependencies are missing.")
        print("Please install the missing packages and try again.")
    print("="*60)
    
    return all_ok

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
