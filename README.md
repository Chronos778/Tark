# Nyaya: AI-Powered Legal Research and Reasoning Engine

Democratizing Indian Legal Justice with Retrieval-Augmented Generation (RAG) and Domain-Adapted Intelligence.

Nyaya is an advanced, high-precision legal research platform engineered to assist legal practitioners, researchers, students, and citizens in navigating India's legal transition from the historic **Indian Penal Code (IPC, 1860)** to the **Bharatiya Nyaya Sanhita (BNS, 2023)**. The platform also includes key sections of the **Information Technology Act, 2000** (section-labelled via `scripts/label_it_act_sections.py`), plus key sections of the **Companies Act, 2013**, the **Consumer Protection Act, 2019** and the **Motor Vehicles Act, 1988** (partial coverage, loaded with `scripts/ingest_curated_acts.py`), plus about 1,100 **Supreme Court** judgments.

---

## System Architecture

Nyaya is built upon a resilient, three-tier distributed architecture engineered for low-latency reasoning and data security:

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Frontend                    │
│   (Vite + TypeScript + Tailwind CSS + Radix UI)        │
│   • Dark Mode UI  • Voice STT/TTS  • PDF Export        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Node.js API Gateway                   │
│   (Express + Rate Limiting + Proxy Middleware)         │
│   • AI Route Throttling  • Static Bundle Hosting       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Python RAG & AI Engine                 │
│   (FastAPI + ChromaDB + ONNX Embeddings / NIM)         │
│   • 12-Stage Text Cleaner  • OCR Pipeline              │
│   • Multi-Turn Session Memory  • Legal Draft Engine    │
└────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### 1. Intelligent Legal Research and Reasoning
- **Neutral Legal Analysis**: Deconstructs complex legal dilemmas into objective factual factors and statutory interpretations.
- **Balanced Arguments Mode**: Synthesizes structured arguments *For* and *Against* a given legal contention to support comprehensive trial preparation.
- **Citation-First Verification**: Every statute is cross-referenced with verified hyperlinks to primary sources including [IndiaCode.nic.in](https://www.indiacode.nic.in) and [ConstitutionOfIndia.net](https://www.constitutionofindia.net).
- **Landmark Case Laws**: Integrates Supreme Court judgments for rapid jurisprudence retrieval and contextual analysis.

### 2. Statutory Cross-Mapping (IPC to BNS)
- Real-time side-by-side comparative analysis of colonial provisions against newly enacted BNS sections.
- Categorizes legislative amendments into *Renumbered*, *Modified*, *New*, and *Removed* classifications, complete with penalty differential matrices.

### 3. Automated Legal Document Drafting
Template-driven, legally validated drafting in **formal English** or **Devanagari Hindi**:
- **Legal Notice** (Civil/Commercial breach)
- **Non-Disclosure Agreement (NDA)**
- **Rent Agreement (Kirayanama)**
- **Affidavit (Shapath Patra)**
- **Employment Agreement**
- **POSH Act Complaint** (Prevention of Sexual Harassment at Workplace)
- **RTI Application** (Right to Information Act, 2005)

### 4. Multi-Modal Document Summarizer
- Ingests native and scanned PDF petitions, First Information Reports (FIRs), or judicial orders.
- Executes a 12-stage text preprocessing and cleaning pipeline with Tesseract OCR fallback for scanned materials.
- Employs map-reduce summarization yielding an Executive Summary, Case Classification, Referenced Sections, Critical Observations, and Actionable Legal Implications.

### 5. Vernacular and Voice Accessibility
- **Bilingual Interface**: Full native support for English and Hindi (Devanagari input, processing, and translation).
- **Speech-to-Text (STT)**: Direct microphone dictation via the browser Web Speech API.
- **Text-to-Speech (TTS)**: Multi-voice read-aloud functionality with adjustable playback pacing.

---

## Technical Stack

| Subsystem | Technologies |
| :--- | :--- |
| **Frontend Client** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons, Framer Motion, jsPDF |
| **API Gateway** | Node.js, Express, `http-proxy-middleware`, `express-rate-limit` |
| **AI and RAG Service** | Python 3.10+, FastAPI, Uvicorn, ChromaDB, ONNX Runtime (`all-MiniLM-L6-v2`) |
| **Document Processing** | PyMuPDF (fitz), pypdf, Tesseract OCR, Poppler (`pdf2image`), BeautifulSoup4 |
| **LLM Execution** | Hosted APIs: Groq (preferred), NVIDIA NIM or OpenRouter. Without a key, only vector retrieval runs |

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+
- **Python**: 3.10 to 3.14 (Virtual environment recommended)
- *(Optional for scanned PDF OCR)*: [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) and [Poppler](https://github.com/oschwartz10612/poppler-windows/releases)

### 2. Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/satyam2006-cmd/Tark.git
   cd Tark   # the repository keeps its original name
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Set up Python Virtual Environment**:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\pip install -r rag_service\requirements.txt
   ```

### 3. Environment Configuration
Create a `.env` file in the project root:
```ini
# LLM key: at least one is needed for written answers (Groq is free: console.groq.com/keys)
GROQ_API_KEY=
NVIDIA_API_KEY=
OPENROUTER_API_KEY=

# Service Endpoints
RAG_SERVICE_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
PORT=3001
```

### 4. Running the Platform Locally

#### Terminal 1 — Start the RAG Microservice:
```powershell
cd rag_service
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

#### Terminal 2 — Start the Frontend Application:
```powershell
npm run dev
```

The web client will be available at `http://localhost:8080` and the interactive API documentation will be accessible at `http://localhost:8000/docs`.

---

## Running the Automated Tests

```bash
npm test                                                       # frontend unit tests (PDF export)
npx tsc --noEmit -p tsconfig.app.json                          # type check
npm run lint
.venv\Scripts\python.exe -m unittest discover -s rag_service\tests -p "test_unit_*.py"   # backend logic, offline
.venv\Scripts\python.exe rag_service\tests\eval_retrieval.py                           # retrieval quality, no LLM
```

The retrieval check asks 38 legal questions and verifies the correct statute section is among the passages given to
the model. CI (`.github/workflows/ci.yml`) runs all of the above. See `INSTALLATION_GUIDE.md` for full setup.

---

## Project Structure

```
Tark/
├── datasets resources/       # IPC, BNS, and IT Act raw corpora and reference CSVs
├── deployment/               # Containerization and orchestration specifications
├── public/                   # Static assets, branding, and diagrams
├── rag_service/              # Core Python RAG microservice
│   ├── data/                 # Indexed statutory mappings and Supreme Court dataset
│   ├── chroma_db/            # Local vector database store
│   ├── conversation_memory.py# Multi-turn session context reformulation
│   ├── main.py               # FastAPI endpoints and route handlers
│   ├── rag_engine.py         # Vector retrieval, prompt synthesis, and drafting
│   └── text_processor.py     # 12-stage text cleaning and OCR pipeline
├── scripts/                  # Data preparation, ETL, and vector ingestion tools
├── server/                   # Node.js API Gateway and security middleware
├── src/                      # React 18 application source code
│   ├── components/           # Modular UI and presentation components
│   ├── pages/                # Chat, Compare, Draft, Summarize, and Auth views
│   └── lib/                  # Client-side API connectors and utility functions
└── tests/                    # End-to-end integration and verification suites
```

---

## License
This project is licensed under the MIT License.
