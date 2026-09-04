# RAG Enhancement Installation Guide

## Prerequisites

Before installing the enhanced RAG features, ensure you have:

1. **Python 3.9+** installed
2. **Node.js 18+** installed
3. **Git** installed

## Step 1: Install Python Dependencies

Navigate to the RAG service directory and install the new dependencies:

```bash
cd rag_service
pip install -r requirements.txt
```

### Expected New Packages:
- `pytesseract` - OCR support
- `lingua-language-detector` - Language detection
- `pymupdf` - Enhanced PDF processing
- `pdf2image` - PDF to image conversion for OCR
- `cloudscraper` - Web scraping (optional)
- `beautifulsoup4` - HTML parsing (optional)
- `langchain` - RAG orchestration
- `langchain-community` - Community integrations

## Step 2: Install Tesseract OCR (Required for Scanned PDFs)

### Windows:
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (recommended path: `C:\Program Files\Tesseract-OCR`)
3. Add Tesseract to your PATH:
   - Open System Properties > Environment Variables
   - Add `C:\Program Files\Tesseract-OCR` to PATH
4. Verify installation:
   ```bash
   tesseract --version
   ```

### macOS:
```bash
brew install tesseract
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-hin  # For Hindi support
```

## Step 3: Install Poppler (Required for pdf2image)

### Windows:
1. Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases
2. Extract to `C:\Program Files\poppler`
3. Add `C:\Program Files\poppler\Library\bin` to PATH

### macOS:
```bash
brew install poppler
```

### Linux:
```bash
sudo apt-get install poppler-utils
```

## Step 4: Verify Installation

Create a test script to verify all dependencies:

```python
# test_dependencies.py
import sys

def test_imports():
    try:
        import fitz
        print("✓ PyMuPDF (fitz) installed")
    except ImportError:
        print("✗ PyMuPDF not found")
    
    try:
        import pytesseract
        print("✓ Pytesseract installed")
        # Test Tesseract binary
        version = pytesseract.get_tesseract_version()
        print(f"  Tesseract version: {version}")
    except Exception as e:
        print(f"✗ Pytesseract error: {e}")
    
    try:
        from lingua import LanguageDetectorBuilder
        print("✓ Lingua language detector installed")
    except ImportError:
        print("✗ Lingua not found")
    
    try:
        from pdf2image import convert_from_bytes
        print("✓ pdf2image installed")
    except ImportError:
        print("✗ pdf2image not found")
    
    try:
        import chromadb
        print("✓ ChromaDB installed")
    except ImportError:
        print("✗ ChromaDB not found")
    
    print("\n" + "="*50)
    print("Dependency check complete!")

if __name__ == "__main__":
    test_imports()
```

Run the test:
```bash
cd rag_service
python test_dependencies.py
```

## Step 5: Test the Enhanced Features

### Test 1: Enhanced PDF Processing

```bash
# Start the RAG service
cd rag_service
uvicorn main:app --reload --port 8000
```

In another terminal, test with curl:
```bash
# Test summarize endpoint with a PDF
curl -X POST "http://localhost:8000/summarize" \
  -F "file=@path/to/your/document.pdf"
```

### Test 2: Conversation Memory

```bash
# Create a session
curl -X POST "http://localhost:8000/session/create"
# Response: {"session_id": "abc-123", "status": "created"}

# Query with session
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the punishment for murder under BNS?",
    "session_id": "abc-123"
  }'

# Follow-up query (will use context)
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What about attempt to murder?",
    "session_id": "abc-123"
  }'

# Get conversation history
curl "http://localhost:8000/session/abc-123/history"

# Clear session
curl -X POST "http://localhost:8000/session/clear?session_id=abc-123"
```

## Step 6: Frontend Integration

The frontend components are already created. To use conversation memory in your app:

1. Import the ConversationContext component:
```typescript
import { ConversationContext } from '@/components/ConversationContext';
```

2. Add session state to your ChatPage:
```typescript
const [sessionId, setSessionId] = useState<string | null>(null);
const [messageCount, setMessageCount] = useState(0);

// Create session on mount
useEffect(() => {
  fetch('http://localhost:8000/session/create', { method: 'POST' })
    .then(res => res.json())
    .then(data => setSessionId(data.session_id));
}, []);

// Include session_id in queries
const handleQuery = async (query: string) => {
  const response = await fetch('http://localhost:8000/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      session_id: sessionId,
      // ... other params
    })
  });
  setMessageCount(prev => prev + 1);
};

// Clear conversation
const handleClearConversation = async () => {
  if (sessionId) {
    await fetch(`http://localhost:8000/session/clear?session_id=${sessionId}`, {
      method: 'POST'
    });
    setMessageCount(0);
  }
};
```

3. Add the ConversationContext component to your UI:
```tsx
<ConversationContext
  sessionId={sessionId}
  messageCount={messageCount}
  onClearConversation={handleClearConversation}
  showContext={true}
/>
```

## Troubleshooting

### Issue: "Tesseract not found"
**Solution:** Ensure Tesseract is installed and added to PATH. Restart your terminal/IDE after installation.

### Issue: "pdf2image: Unable to get page count"
**Solution:** Install Poppler and ensure it's in your PATH.

### Issue: "Lingua language detector not working"
**Solution:** This is optional. The system will fall back to English if Lingua is not available.

### Issue: "ChromaDB collection not found"
**Solution:** Run the vector ingestion script first:
```bash
cd rag_service
python scripts/ingest_vector.py
```

### Issue: "Memory error during PDF processing"
**Solution:** Reduce `max_ocr_pages` parameter in text_processor.py (default is 100).

## Next Steps

1. **Re-ingest your documents** to take advantage of enhanced metadata extraction
2. **Test conversation memory** with follow-up questions
3. **Monitor performance** - OCR processing may take longer for scanned documents
4. **Optional:** Implement the web scraping pipeline to expand your legal corpus

## Performance Notes

- **Native PDF extraction:** ~1-2 seconds per document
- **OCR processing:** ~5-10 seconds per page (depends on image quality)
- **Language detection:** ~100ms per document
- **Vector search (10 results):** ~100-200ms
- **Conversation memory:** Negligible overhead (<10ms)

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all dependencies are installed correctly
3. Ensure your `.env` file has the required API keys
4. Test with a simple PDF first before complex documents
