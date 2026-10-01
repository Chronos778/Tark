# ⚖️ Tark: AI-Powered Legal Research & Reasoning Engine

**Democratizing Indian Legal Justice with Retrieval-Augmented Generation (RAG) & Multi-Model Intelligence.**

Tark is an advanced, high-precision legal research platform designed to help legal practitioners, law students, and citizens navigate India's legal transition from the historic **Indian Penal Code (IPC, 1860)** to the **Bharatiya Nyaya Sanhita (BNS, 2023)**, as well as cyber laws (**IT Act, 2000**), corporate regulations (**Companies Act, 2013**), consumer rights (**Consumer Protection Act, 2019**), and landmark **Supreme Court precedents**.

---

## 🏗️ System Architecture

Tark is built on a resilient, 3-tier distributed architecture designed for low-latency reasoning and strict data privacy:

```
┌────────────────────────────────────────────────────────┐
│                   React 18 Frontend                    │
│   (Vite + TypeScript + Tailwind CSS + Radix UI)       │
│   • Dark Mode UI  • Voice STT/TTS  • PDF Export        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Node.js API Gateway                  │
│   (Express + Rate Limiting + Proxy Middleware)         │
│   • AI Route Throttling  • Static Bundle Hosting       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Python RAG & AI Engine                 │
│   (FastAPI + ChromaDB + Sentence Transformers / NIM)   │
│   • 12-Stage Text Cleaner  • OCR & Poppler Pipeline   │
│   • Multi-Turn Session Memory  • Legal Draft Engine   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. ⚖️ Intelligent Legal Research & Reasoning
- **Neutral Legal Analysis**: Evaluates complex legal dilemmas into objective factual factors and statutory interpretations.
- **Balanced Arguments Mode**: Instantly generates strategic arguments *For* and *Against* a legal contention.
- **Citation-First Verification**: Every statute is cross-referenced with direct links to [IndiaCode.nic.in](https://www.indiacode.nic.in) and [ConstitutionOfIndia.net](https://www.constitutionofindia.net).
- **Landmark Case Laws**: Integrates Supreme Court judgments for instant jurisprudence retrieval.

### 2. 🔄 Statutory Cross-Mapping (IPC ↔ BNS)
- Real-time side-by-side comparative analysis of old colonial sections against new BNS provisions.
- Categorizes legislative changes into *Renumbered*, *Modified*, *New*, and *Removed* with penalty difference matrices.

### 3. 📄 Automated Legal Document Drafting
Template-driven, legally structured drafting in **formal English** or **Devanagari Hindi**:
- **Legal Notice** (Civil/Commercial breach)
- **Non-Disclosure Agreement (NDA)**
- **Rent Agreement (Kirayanama)**
- **Affidavit (Shapath Patra)**
- **Employment Agreement**
- **POSH Act Complaint** (Prevention of Sexual Harassment at Workplace)
- **RTI Application** (Right to Information Act, 2005)

### 4. 📑 Multi-Modal Document Summarizer
- Upload digital or scanned PDF petitions, FIRs, or court orders.
- 12-stage text cleaning pipeline with Tesseract OCR fallback.
- Map-reduce summarization producing Executive Summary, Case Classification, Referenced Sections, Critical Observations, and Legal Implications.

### 5. 🎙️ Vernacular & Voice Intelligence
- **Bilingual Interface**: Native support for English and Hindi (Devanagari input and translation).
- **Speech-to-Text (STT)**: Direct microphone input via Web Speech API.
- **Text-to-Speech (TTS)**: Multi-voice read-aloud functionality with pace control.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide Icons, Framer Motion, jsPDF |
| **Gateway** | Node.js, Express, `http-proxy-middleware`, `express-rate-limit` |
| **AI / RAG Service** | Python 3.10+, FastAPI, Uvicorn, ChromaDB, Sentence Transformers |
| **Document Processing** | PyMuPDF (fitz), pypdf, Tesseract OCR, Poppler (`pdf2image`), BeautifulSoup4 |
| **Models Supported** | Llama 3.1 (70B & 8B), Qwen 2.5, Mistral 7B via NVIDIA NIM, OpenRouter, or local Ollama |

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+
- **Python**: 3.10 to 3.12 recommended
- *(Optional for OCR)*: [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) and [Poppler](https://github.com/oschwartz10612/poppler-windows/releases)

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

3. **Install Python dependencies**:
   ```bash
   cd rag_service
   pip install -r requirements.txt
   cd ..
   ```

### 3. Environment Configuration
Copy `.env.example` to `.env` and add your API credentials:
```bash
cp .env.example .env
```
Inside `.env`:
```ini
NVIDIA_API_KEY=your_nvidia_api_key_here
# OR
OPENROUTER_API_KEY=your_openrouter_api_key_here

RAG_SERVICE_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
PORT=3001
```

### 4. Running the Platform Locally
Start all three tiers (Client, Gateway, RAG Service) concurrently:
```bash
npm run dev:all
```
- **Web Application**: `http://localhost:5173`
- **API Gateway**: `http://localhost:3001`
- **FastAPI RAG Docs**: `http://localhost:8000/docs`

---

## 🧪 Running the Test Suite

Run the end-to-end automated validation suite:
```bash
python tests/test_all_features.py
```
This tests:
1. Vector DB & Knowledge Base Connectivity
2. Criminal Law Retrieval (BNS Section 103)
3. Cyber Law Retrieval (IT Act 2000)
4. Citation Integrity & URL Verification
5. Balanced Arguments & Neutral Analysis
6. Legal Drafting Engine
7. Document Summarization Pipeline

---

## 📂 Project Structure

```
Tark/
├── datasets resources/       # IPC, BNS, and IT Act raw corpora & CSVs
├── deployment/               # Dockerfiles & docker-compose configurations
├── public/                   # 3D assets, icons, and diagrams
├── rag_service/              # Core Python RAG & AI microservice
│   ├── data/                 # Indexed JSON mappings & Supreme Court dataset
│   ├── conversation_memory.py# Session memory & context query reformulation
│   ├── main.py               # FastAPI application endpoints
│   ├── rag_engine.py         # Vector search, prompt synthesis, drafting
│   └── text_processor.py     # 12-stage text cleaning & OCR pipeline
├── scripts/                  # Data preparation, ETL, and vector ingestion
├── server/                   # Node.js API Gateway & Rate Limiter
├── src/                      # React 18 frontend source code
│   ├── components/           # Reusable UI & presentation components
│   ├── pages/                # Chat, Compare, Draft, Summarize, Auth
│   └── lib/                  # API clients and utilities
└── tests/                    # End-to-end integration test suites
```

---

## 📜 License
This project is licensed under the MIT License.
