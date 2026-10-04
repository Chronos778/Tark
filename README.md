# Nyaya: AI-Powered Legal Research and Reasoning Engine

Democratizing Indian Legal Justice with Retrieval-Augmented Generation (RAG) and Domain-Adapted Intelligence.

Nyaya is an advanced, high-precision legal research platform engineered to assist legal practitioners, researchers, students, and citizens in navigating India's legal transition from the historic **Indian Penal Code (IPC, 1860)** to the **Bharatiya Nyaya Sanhita (BNS, 2023)**. The platform also includes key sections of the **Information Technology Act, 2000**, the **Companies Act, 2013**, the **Consumer Protection Act, 2019**, and the **Motor Vehicles Act, 1988**, along with over 1,100 curated **Supreme Court** judgments.

---

## System Architecture

Nyaya is built upon a resilient, three-tier distributed architecture engineered for low-latency reasoning and data security:

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Frontend                    │
│   (Vite + TypeScript + Tailwind CSS + Radix UI)        │
│   • Dark Mode UI  • Voice STT/TTS  • PDF Export        │
│   • Live EN/HI Translation  • Bilingual Audio Playback │
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
│   (FastAPI Lifespan + ChromaDB + ONNX Embeddings)      │
│   • 12-Stage Text Cleaner  • OCR Pipeline              │
│   • Multi-Turn Session Memory  • Legal Draft Engine    │
│   • Self-Healing Vector Auto-Seeder  • /translate API  │
└────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### 1. Intelligent Legal Research and Reasoning
- **Neutral Legal Analysis**: Deconstructs complex legal dilemmas into objective factual factors and statutory interpretations.
- **Balanced Arguments Mode**: Synthesizes structured arguments *For* and *Against* a given legal contention to support comprehensive trial preparation.
- **Citation-First Verification**: Every statute is cross-referenced with verified hyperlinks to primary sources including [IndiaCode.nic.in](https://www.indiacode.nic.in) and [IndianKanoon.org](https://indiankanoon.org).
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

### 5. Vernacular Translation and Voice Accessibility
- **Bidirectional Legal Translation (`/translate`)**: High-fidelity translation between English and Hindi, strictly preserving Markdown structures, lists, and comparative tables.
- **Seamless Language Toggle**: Toggling between **EN** and **HI** in the navigation bar or chat toolbar automatically translates visible conversation messages and forces future responses to follow the selected language.
- **Per-Message Translation Button**: Every assistant card features an instant *Translate* button with response caching.
- **Bilingual Speech Synthesis (TTS)**: Context-aware text-to-speech selecting natural `hi-IN` voices for Hindi and `en-IN` voices for English.
- **Speech-to-Text (STT)**: Direct microphone dictation via the browser Web Speech API.

---

## Technical Stack

| Subsystem | Technologies |
| :--- | :--- |
| **Frontend Client** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons, Framer Motion, jsPDF |
| **API Gateway** | Node.js, Express, `http-proxy-middleware`, `express-rate-limit` |
| **AI and RAG Service** | Python 3.10+, FastAPI (Lifespan), Uvicorn, ChromaDB, ONNX Runtime (`all-MiniLM-L6-v2`) |
| **Authentication & DB** | Supabase (Authentication, Session Management, Secure Contact Messages) |
| **Document Processing** | PyMuPDF (fitz), pypdf, Tesseract OCR, Poppler (`pdf2image`), BeautifulSoup4 |
| **LLM Execution** | Hosted APIs: Groq (preferred, fast LLaMA 3.3 70B & 8B), NVIDIA NIM, or OpenRouter |

---

## API Endpoints

The FastAPI backend exposes the following REST endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check |
| `POST` | `/query` | Semantic RAG legal search with citations and precedents |
| `POST` | `/translate` | High-fidelity legal translation between English and Hindi |
| `POST` | `/draft` | Template-driven legal document generation |
| `POST` | `/compare` | Side-by-side legal clause and statute comparison |
| `POST` | `/summarize` | Multi-modal PDF/text document summarization |
| `POST` | `/contact` | Honeypot-protected, rate-limited contact form submission |

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+
- **Python**: 3.10 to 3.14 (Virtual environment recommended)
- **Groq API Key**: Free API key from [console.groq.com/keys](https://console.groq.com/keys)
- **Supabase Project**: Free project from [supabase.com](https://supabase.com)
- *(Optional for scanned PDF OCR)*: [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) and [Poppler](https://github.com/oschwartz10612/poppler-windows/releases) on system `PATH`

### 2. Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/satyam2006-cmd/Tark.git
   cd Tark
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Set up Python Virtual Environment**:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\pip install -r rag_service\requirements.txt   # Windows
   # source .venv/bin/activate && pip install -r rag_service/requirements.txt   # Linux / macOS
   ```

### 3. Environment Configuration
Create a `.env` file in the project root:
```ini
# LLM API Keys (Groq is preferred and free: console.groq.com/keys)
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_API_KEYS=   # Optional extra keys, comma-separated, for automatic rotation

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_service_role_secret_key_here

# Service URLs
RAG_SERVICE_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
PORT=3001
ALLOWED_ORIGINS=
```

### 4. Running the Platform Locally

Run both the frontend client and the RAG backend concurrently with a single command:

```bash
npm run dev:all
```

- **Frontend Client**: Accessible at [http://localhost:8080](http://localhost:8080)
- **FastAPI RAG Backend**: Accessible at [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: Accessible at [http://localhost:8000/docs](http://localhost:8000/docs)

*(Alternatively, you can run them in separate terminals with `npm run dev:client` and `npm run dev:rag`.)*

---

## Production Deployment

### Option A: Render Blueprint (Recommended)
The repository includes a ready-to-use [`render.yaml`](render.yaml) blueprint:
1. Connect your repository to [Render.com](https://render.com).
2. Render automatically spins up two Docker services:
   - **`nyaya-rag`**: Python container running the FastAPI service on port 8000 with the bundled vector database.
   - **`nyaya-gateway`**: Node.js container serving the built frontend and proxying `/api/v1` with rate limiting.
3. Configure your `GROQ_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in the Render dashboard.

### Option B: Docker Compose (VPS / Self-Hosted)
Deploy the full stack on any Linux VPS or server using Docker Compose:
```bash
docker compose -f deployment/docker-compose.yml --env-file .env up --build
```

### Option C: Vercel (Frontend) + Render / Railway (Backend)
- Deploy [`rag_service/`](rag_service) as a Python web service using [`deployment/Dockerfile.rag`](deployment/Dockerfile.rag).
- Deploy the frontend to Vercel with:
  - `VITE_API_URL=https://your-rag-backend.onrender.com`
  - `VITE_SUPABASE_URL=https://your-project.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

> [!NOTE]
> In your Supabase Dashboard under **Authentication → URL Configuration**, add your production URL (e.g. `https://your-domain.com/login`) to the allowed **Redirect URLs**.

---

## Running the Automated Tests & CI/CD

Run the comprehensive test suite locally:

```bash
npm test                                                       # Frontend unit tests
npx tsc --noEmit -p tsconfig.app.json                          # TypeScript type checking
npm run lint                                                   # ESLint verification
npm run build                                                  # Production build verification
.venv\Scripts\python.exe -m unittest discover -s rag_service\tests -p "test_unit_*.py"   # Backend unit tests
.venv\Scripts\python.exe rag_service\tests\eval_retrieval.py                           # 38-query retrieval quality benchmark
```

The GitHub Actions CI pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) automatically executes all frontend and backend tests on every commit and pull request.

---

## Project Structure

```
Tark/
├── .github/workflows/        # Automated CI/CD pipeline (lint, test, build, eval)
├── datasets resources/       # IPC, BNS, and IT Act raw corpora and reference CSVs
├── deployment/               # Dockerfiles and Docker Compose orchestration
│   ├── Dockerfile.gateway    # Production Node.js gateway and frontend image
│   ├── Dockerfile.rag        # Production Python FastAPI and OCR image
│   └── docker-compose.yml    # Full-stack local container composition
├── public/                   # Static assets, branding, and diagrams
├── rag_service/              # Core Python RAG microservice
│   ├── chroma_db/            # Bundled persistent vector database (2,200+ statutes & cases)
│   ├── data/                 # Statutory cross-mappings and golden datasets
│   ├── contact.py            # Secure contact form handler with Supabase & SMTP
│   ├── conversation_memory.py# Multi-turn conversational session context
│   ├── main.py               # FastAPI endpoints, CORS, and lifespan management
│   ├── rag_engine.py         # Vector retrieval, LLM prompt synthesis, and drafting
│   ├── rerank.py             # Keyword-boosted semantic re-ranker
│   └── text_processor.py     # 12-stage text cleaning and OCR pipeline
├── scripts/                  # Data preparation, ETL, and vector ingestion tools
├── server/                   # Node.js API Gateway with express-rate-limit
├── src/                      # React 18 frontend source code
│   ├── components/           # UI components (Header, Badges, Modals, Forms)
│   ├── pages/                # ChatPage, ComparisonPage, DraftingPage, SummarizePage, Auth
│   ├── hooks/                # useLanguage, useSession custom React hooks
│   └── lib/                  # API client, PDF export generator, Supabase client
└── tests/                    # End-to-end integration and verification suites
```

---

## License
This project is licensed under the MIT License.
