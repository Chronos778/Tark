# Nyaya: Installation Guide

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.10 – 3.14**
- A free **Groq API key** (https://console.groq.com/keys) for written answers
- A **Supabase** project (https://supabase.com) for sign-in and the consultation form
- *Optional, for scanned-PDF OCR:* [Tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and [Poppler](https://github.com/oschwartz10612/poppler-windows/releases) on your `PATH`

## 1. Install

```bash
npm install
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r rag_service\requirements.txt   # Windows
# source .venv/bin/activate && pip install -r rag_service/requirements.txt   # macOS / Linux
```

> A `.venv` folder copied from another computer will not work. Delete it and create a fresh one as above.

## 2. Configure

Copy `.env.example` to `.env` and fill it in:

| Variable | Purpose |
| :--- | :--- |
| `GROQ_API_KEY` | LLM for answers, drafts and summaries. Without it only retrieval runs |
| `GROQ_API_KEYS` | Optional extra keys, comma-separated, tried when one is rate limited |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase values |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Server-side only: the backend stores contact messages with them. Never expose the secret key to the browser |
| `CONTACT_NOTIFY_TO`, `SMTP_*` | Optional email alert for new contact messages |
| `VITE_API_URL` | Backend URL, default `http://localhost:8000` |

Keep `.env` out of version control (it is already in `.gitignore`).

## 3. Set up Supabase

1. **Authentication → Providers → Email:** keep *Confirm email* on.
2. **Authentication → URL Configuration:** add these redirect URLs (and your production URLs later):
   `http://localhost:8080`, `http://localhost:8080/login`, `http://localhost:8080/reset-password`
3. **SQL Editor:** run [`supabase/contact_messages.sql`](supabase/contact_messages.sql) once. It creates the table behind the Contact form and locks it so only the backend can write to it.
4. *(Optional)* Email alerts for new contact messages: set `CONTACT_NOTIFY_TO` and the `SMTP_*` variables in `.env` (for Gmail, create an App Password). Without them messages are still saved; you read them in **Table Editor → contact_messages**.

## 4. Load the knowledge base

The repository ships with a populated `rag_service/chroma_db`. To rebuild or extend it, **stop the backend first**, then:

```bash
.venv\Scripts\python.exe scripts\ingest_curated_acts.py      # Companies, Consumer Protection, Motor Vehicles, IT Act
.venv\Scripts\python.exe scripts\ingest_ipc_sections.py      # full IPC
.venv\Scripts\python.exe scripts\label_it_act_sections.py --apply   # section-label the IT Act text
```

Each script is safe to re-run.

## 5. Run

```bash
npm run dev:all
```

This starts the frontend on http://localhost:8080 and the RAG service on http://localhost:8000 (API docs at `/docs`). To run them separately: `npm run dev:client` and `npm run dev:rag`.

## 6. Check it works

```bash
npm test                                                       # frontend unit tests
npx tsc --noEmit -p tsconfig.app.json                          # type check
npm run lint
.venv\Scripts\python.exe -m unittest discover -s rag_service\tests -p "test_unit_*.py"
.venv\Scripts\python.exe rag_service\tests\eval_retrieval.py   # retrieval quality, no LLM needed
```

## Deploying

See [`render.yaml`](render.yaml) (Render blueprint) or `deployment/docker-compose.yml` for a local container run. The Node gateway serves the built frontend, proxies `/api/v1` to the RAG service and rate-limits the AI routes.
