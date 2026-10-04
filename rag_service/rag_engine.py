
import os
import sys

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import json
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
import requests
import io
import time
import pathlib
from dotenv import load_dotenv
from text_processor import TextProcessor
from conversation_memory import ConversationMemory
from rerank import select_context, keywords

# Ensure root .env is loaded if not already present
_base_path = pathlib.Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=_base_path / ".env")

def is_valid_key(k: str | None) -> bool:
    return bool(k and not k.startswith("your_") and len(k.strip()) > 15)

class RAGEngine:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY")
        nvidia_key = os.getenv("NVIDIA_API_KEY")
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        
        self.groq_api_key = groq_key if is_valid_key(groq_key) else None
        extra = [k.strip() for k in os.getenv("GROQ_API_KEYS", "").split(",")]
        self.groq_keys = [k for k in dict.fromkeys([self.groq_api_key, *extra]) if is_valid_key(k)]
        if self.groq_keys and not self.groq_api_key:
            self.groq_api_key = self.groq_keys[0]
        self._groq_next = 0
        self.nvidia_api_key = nvidia_key if is_valid_key(nvidia_key) else None
        self.openrouter_api_key = openrouter_key if is_valid_key(openrouter_key) else None
        
        # Priority: Groq -> NVIDIA NIM -> OpenRouter
        self.api_key = self.groq_api_key or self.nvidia_api_key or self.openrouter_api_key
        self.provider = (
            "groq" if self.groq_api_key
            else "nvidia" if self.nvidia_api_key
            else "openrouter" if self.openrouter_api_key
            else None
        )

        # Model mapping
        if self.provider == "groq":
            self.model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
            self.model_legal = os.getenv("GROQ_MODEL_LEGAL", "openai/gpt-oss-120b")
            self.model_simple = os.getenv("GROQ_MODEL_SIMPLE", "openai/gpt-oss-20b")
            print(f"[RAGEngine] Using Groq API. Models: {self.model_name}")
        elif self.provider == "nvidia":
            self.model_name = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")
            self.model_legal = os.getenv("NVIDIA_MODEL_LEGAL", "meta/llama-3.1-70b-instruct")
            self.model_simple = os.getenv("NVIDIA_MODEL_SIMPLE", "meta/llama-3.1-8b-instruct")
            print(f"[RAGEngine] Using NVIDIA NIM API. Models: {self.model_name}")
        elif self.provider == "openrouter":
            self.model_name = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct")
            self.model_legal = os.getenv("OPENROUTER_MODEL_LEGAL", "nvidia/nemotron-orchestrator-8b")
            self.model_simple = os.getenv("OPENROUTER_MODEL_SIMPLE", "mistralai/mistral-7b-instruct")
            print(f"[RAGEngine] Using OpenRouter API. Models: {self.model_name}")
        else:
            self.model_name = None
            self.model_legal = None
            self.model_simple = None
            print("[RAGEngine] ℹ️ Running in Local / Offline Mode (Fast Vector RAG & Rules Active).")

        if not self.api_key:
            print("[RAGEngine] ⚠️ Warning: No API Key found (Groq, NVIDIA or OpenRouter). LLM features disabled.")

        # Initialize Enhanced Text Processor
        self.text_processor = TextProcessor()
        
        # Initialize Conversation Memory
        self.conversation_memory = ConversationMemory()
        # Simple in-memory response cache
        self._cache: Dict[str, Dict[str, Any]] = {}

        # Initialize ChromaDB Client
        base_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_path = os.path.join(base_dir, "chroma_db")
        
        class NvidiaEmbeddingFunction(chromadb.EmbeddingFunction):
            def __init__(self, api_key):
                self.api_key = api_key
                self.url = "https://integrate.api.nvidia.com/v1/embeddings"
            
            def __call__(self, input: List[str]) -> List[List[float]]:
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                data = {"input": input, "model": "baai/bge-m3", "input_type": "query", "encoding_format": "float"}
                response = requests.post(self.url, headers=headers, json=data)
                if response.status_code != 200:
                    raise Exception(f"NVIDIA Embedding Error: {response.text}")
                return [item["embedding"] for item in response.json()["data"]]

        try:
            self.db_client = chromadb.PersistentClient(path=chroma_path)
            
            if self.nvidia_api_key:
                try:
                    self.ef = NvidiaEmbeddingFunction(self.nvidia_api_key)
                    collection_name = "legal_knowledge_v2"
                except Exception:
                    self.ef = embedding_functions.DefaultEmbeddingFunction()
                    collection_name = "legal_knowledge"
            else:
                self.ef = embedding_functions.DefaultEmbeddingFunction()
                collection_name = "legal_knowledge"
                
            self.collection = self.db_client.get_or_create_collection(name=collection_name, embedding_function=self.ef)
            print(f"[RAGEngine] Connected to Vector DB [{collection_name}]. ({self.collection.count()} docs)")
            
            if self.collection.count() == 0:
                print("[RAGEngine] Empty collection detected. Auto-seeding bundled legal statutes...", flush=True)
                self._seed_default_data()
            
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector DB Connection Error: {e}")
             self.collection = None

    def _seed_default_data(self):
        """Auto-seed basic legal statutes if the database is empty on deployment."""
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            data_dir = os.path.join(base_dir, "data")
            mapping_file = os.path.join(data_dir, "ipc_bns_mapping.json")
            if os.path.exists(mapping_file) and self.collection:
                with open(mapping_file, "r", encoding="utf-8") as f:
                    statutes = json.load(f)
                docs, metas, ids = [], [], []
                for s in statutes:
                    bns_num = str(s.get("bns", "")).strip()
                    ipc_num = str(s.get("ipc", "")).strip()
                    topic = s.get("topic", "")
                    bns_text = s.get("text_bns", "")
                    ipc_text = s.get("text_ipc", "")
                    if bns_num:
                        docs.append(f"Statute: Bharatiya Nyaya Sanhita (BNS) Section {bns_num}. Topic: {topic}. Description: {bns_text}")
                        metas.append({"type": "statute", "source": "Bharatiya Nyaya Sanhita, 2023", "law": "BNS", "bns_section": bns_num, "topic": topic})
                        ids.append(f"bns::{bns_num}")
                    if ipc_num:
                        docs.append(f"Statute: Indian Penal Code (IPC) Section {ipc_num}. Topic: {topic}. Description: {ipc_text}")
                        metas.append({"type": "statute", "source": "Indian Penal Code, 1860", "law": "IPC", "ipc_section": ipc_num, "topic": topic})
                        ids.append(f"ipc::{ipc_num}")
                if docs:
                    for i in range(0, len(docs), 250):
                        self.collection.add(
                            documents=docs[i:i+250],
                            metadatas=metas[i:i+250],
                            ids=ids[i:i+250]
                        )
                print(f"[RAGEngine] Auto-seeded {len(docs)} statutes into collection.", flush=True)
        except Exception as e:
            print(f"[RAGEngine] Auto-seed warning: {e}", flush=True)

    _FOLLOWUP_LEADS = (
        "and ", "but ", "also ", "then ", "so ", "what if", "what about", "how about", "why", "how so",
        "can it", "does it", "is it", "will it", "would it", "what happens", "and if", "in that case",
    )
    _FOLLOWUP_WORDS = {"it", "this", "that", "they", "them", "those", "these", "he", "she", "its", "their", "same"}

    def _looks_like_followup(self, query: str) -> bool:
        words = re.findall(r"[a-zA-Z']+", query.lower())
        if not words or len(words) > 14:
            return False
        q = query.lower().strip()
        return q.startswith(self._FOLLOWUP_LEADS) or any(w in self._FOLLOWUP_WORDS for w in words)

    def _rewrite_followup(self, session_id: Optional[str], query: str, history: Optional[List[Dict[str, Any]]] = None) -> str:
        """Turn a short follow-up ("and if it is only an attempt?") into a standalone question."""
        history_list = []
        if history:
            history_list = [m for m in history if m.get("content") and m.get("role") in ("user", "assistant")]
        elif session_id:
            history_list = list(self.conversation_memory.get_history(session_id, max_messages=6))

        # The server stores the current question before calling the engine; ignore that copy
        if history_list and history_list[-1].get("role") == "user" and history_list[-1].get("content") == query:
            history_list = history_list[:-1]
        if not history_list or not self.api_key or not self._looks_like_followup(query):
            return query

        last_user = next((m["content"] for m in reversed(history_list) if m["role"] == "user"), "")
        last_answer = next((m["content"] for m in reversed(history_list) if m["role"] == "assistant"), "")
        prompt = (
            "Rewrite the user's latest question as one standalone question that makes sense without the "
            "conversation. Keep Indian legal terms and section numbers. If it is already standalone, return it "
            "unchanged. Output ONLY the question.\r\n\r\n"
            f"Previous question: {last_user[:300]}\r\n"
            f"Previous answer (excerpt): {last_answer[:400]}\r\n"
            f"Latest question: {query}"
        )
        try:
            rewritten = self._call_llm(
                [{"role": "user", "content": prompt}], max_tokens=80, timeout=20, model_override=self.model_simple
            ).strip().strip('"').strip()
        except Exception as e:
            print(f"[RAGEngine] Follow-up rewrite failed: {e}")
            return query
        if not rewritten or len(rewritten) > 300 or rewritten.lower().startswith("error"):
            return query
        return rewritten

    _SECTION_REF = re.compile(
        r"(?:section|sec\.?|s\.|धारा)\s*(\d{1,3}[A-Za-z]{0,2})\b|\b(\d{1,3}[A-Za-z]{0,2})\s+(?:of\s+(?:the\s+)?)?(?:ipc|bns|it act)\b"
        r"|\b(?:ipc|bns|it act)\s+(?:section\s*)?(\d{1,3}[A-Za-z]{0,2})\b",
        re.IGNORECASE,
    )
    _LAW_WORDS = {"bns": "BNS", "ipc": "IPC", "it act": "IT Act"}

    def _explicit_section_hits(self, query: str, limit: int = 4):
        """Passages for sections the user named explicitly, looked up by metadata."""
        if not self.collection:
            return []
        q = query.lower()
        numbers = {(m.group(1) or m.group(2) or m.group(3)).upper() for m in self._SECTION_REF.finditer(query)}
        if not numbers:
            return []
        laws = [name for word, name in self._LAW_WORDS.items() if re.search(rf"\b{re.escape(word)}\b", q)]
        hits = []
        for number in sorted(numbers)[:3]:
            for key in ("section", "bns_section", "ipc_section"):
                try:
                    got = self.collection.get(where={key: number}, include=["documents", "metadatas"], limit=limit)
                except Exception:
                    continue
                for doc, meta in zip(got["documents"], got["metadatas"]):
                    if not laws or meta.get("law") in laws:
                        hits.append((doc, meta))
        return hits[: limit * 2]

    @staticmethod
    def _trim_runaway(text: str, max_chars: int = 7000) -> str:
        """Drop immediately repeated lines and cap length, in case the model loops."""
        delim = "\r\n" if "\r\n" in text else "\n"
        out = []
        for line in text.splitlines():
            if out and line.strip() and line.strip() == out[-1].strip():
                continue
            out.append(line)
        trimmed = delim.join(out)
        return trimmed if len(trimmed) <= max_chars else trimmed[:max_chars].rsplit(delim, 1)[0]

    def _classify_query(self, query: str) -> str:
        """Classify query as 'simple' or 'legal' for optimization."""
        query_lower = query.lower()
        
        # Simple greetings/basic questions that don't need RAG. Match whole words/phrases only
        # ("hi" must not fire on "Sanhita", "this" or "which") and only for short messages.
        simple_patterns = [
            'hello', 'hi', 'hey', 'thanks', 'thank you',
            'what is your name', 'who are you', 'what can you do',
            'help', 'how to use', 'what are you'
        ]
        legal_words = ('section', 'ipc', 'bns', 'law', 'legal', 'penalty', 'punishment', 'act', 'case',
                       'judgment', 'court', 'crime', 'offence', 'offense', 'murder', 'theft')
        short = len(query_lower.split()) <= 8
        has_legal = any(re.search(rf"\b{w}\b", query_lower) for w in legal_words)
        if short and not has_legal and any(re.search(rf"\b{re.escape(p)}\b", query_lower) for p in simple_patterns):
            return 'simple'

        # Legal queries need full RAG pipeline
        legal_patterns = [
            'section', 'ipc', 'bns', 'law', 'legal', 'penalty', 'punishment',
            'act', 'case', 'judgment', 'court', 'crime', 'offence', 'right'
        ]
        
        if any(pattern in query_lower for pattern in legal_patterns):
            return 'legal'
        
        # Default to legal for safety
        return 'legal'
    
    def _generate_statute_url(self, law: str, section: str) -> Optional[str]:
        """Generate IndiaCode.nic.in URL for Indian statutes."""
        if not law or not section:
            return None
        
        # Extract section number (handle formats like "Section 109", "109", etc.)
        section_num = re.search(r'\d+', str(section))
        if not section_num:
            return None
        section_num = section_num.group()
        
        law_lower = law.lower()
        
        # Map common law names to IndiaCode URLs
        url_mappings = {
            'ipc': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN_5_23_00037_186045_1523266765688&sectionId=22343&sectionno={section_num}',
            'indian penal code': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN_5_23_00037_186045_1523266765688&sectionId=22343&sectionno={section_num}',
            'bns': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN____00023_00000____00000_____&sectionId=&sectionno={section_num}',
            'bharatiya nyaya sanhita': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN____00023_00000____00000_____&sectionId=&sectionno={section_num}',
            'it act': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN_45_76_00001_200021_1517807326986&sectionId=1643&sectionno={section_num}',
            'information technology act': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN_45_76_00001_200021_1517807326986&sectionId=1643&sectionno={section_num}',
            'crpc': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN_5_23_00006_197301_1517807320906&sectionId=1826&sectionno={section_num}',
            'code of criminal procedure': f'https://www.indiacode.nic.in/show-data?actid=AC_CEN_5_23_00006_197301_1517807320906&sectionId=1826&sectionno={section_num}',
        }
        
        for key, url in url_mappings.items():
            if key in law_lower:
                return url
        
        # Fallback: general IndiaCode search
        return f'https://www.indiacode.nic.in/search?keyword={law.replace(" ", "+")}+section+{section_num}'
    
    
    def _call_llm(self, messages: List[Dict], max_tokens: int = 1500, timeout: int = 30, model_override: Optional[str] = None, _retried: bool = False) -> str:
        """Helper to call LLM API with timeout."""
        if not self.api_key:
            raise Exception("API Key missing")

        if self.provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        elif self.provider == "nvidia":
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        else:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
                "X-Title": "Nyaya",
                "Content-Type": "application/json"
            }

        data = {
            "model": model_override or self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": max_tokens
        }
        # Groq's free tier caps each model at ~8k tokens/minute. Every model has its own bucket,
        # so on a 429 (or an empty reply) fall through to the next model instead of failing.
        if self.provider == "groq":
            primary = data["model"]
            fallbacks = [m for m in os.getenv(
                "GROQ_FALLBACK_MODELS", "openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b"
            ).split(",") if m and m != primary]
            candidates = [primary] + fallbacks
        else:
            candidates = [data["model"]]

        # Build (model, key) attempts: all keys for a model before moving to the next model.
        attempts = []
        for model in candidates:
            if self.provider == "groq" and len(self.groq_keys) > 1:
                start = self._groq_next % len(self.groq_keys)
                for i in range(len(self.groq_keys)):
                    attempts.append((model, self.groq_keys[(start + i) % len(self.groq_keys)]))
            else:
                attempts.append((model, self.api_key))
        if self.provider == "groq":
            self._groq_next += 1  # spread load across keys

        last_error = "unknown error"
        for attempt, (model, key) in enumerate(attempts):
            payload = dict(data, model=model)
            if self.provider == "groq":
                headers = dict(headers, Authorization=f"Bearer {key}")
                if model.startswith("openai/gpt-oss"):
                    # gpt-oss reasons before answering; keep that short and leave room for the answer
                    payload["reasoning_effort"] = "low"
                    payload["max_tokens"] = max_tokens + 800
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=timeout)
            except requests.exceptions.Timeout:
                print(f"[RAGEngine] Request timeout after {timeout}s on {model}")
                last_error = f"Response took too long (>{timeout}s). The LLM service may be busy. Please try again."
                continue
            except Exception as e:
                print(f"[RAGEngine] Request failed: {e}")
                raise e

            if response.status_code == 429:
                print(f"[RAGEngine] {model} rate limited (key ...{key[-4:]}), trying next")
                last_error = f"API Error 429: {response.text[:200]}"
                continue
            if response.status_code != 200:
                print(f"[RAGEngine] API Error Body: {response.text}")
                raise Exception(f"API Error {response.status_code}: {response.text}")

            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message'].get('content', '')
                if content:
                    return content
                print(f"[RAGEngine] Empty content from {model}, trying next model")
                last_error = "Received empty content from LLM."
                continue
            raise Exception(f"Unexpected response format: {result}")

        if last_error.startswith("API Error 429") and not _retried:
            # Every model/key was rate limited; per-minute limits clear quickly, so wait once and retry
            print("[RAGEngine] All models rate limited; waiting 6s before one retry")
            time.sleep(6)
            return self._call_llm(messages, max_tokens, timeout, model_override, _retried=True)
        raise Exception(last_error)

    def _clean_text(self, text: str) -> str:
        """Cleans extracted text by normalizing whitespace."""
        return re.sub(r'\s+', ' ', text).strip()

    def _chunk_text(self, text: str, chunk_size: int = 6000) -> List[str]:
        """Splits text into chunks of approx chunk_size characters (roughly 1500 tokens)."""
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks

    async def summarize(self, file_content: bytes, filename: str) -> str:
        """
        Advanced Summarization Pipeline: Extract -> Clean -> Chunk -> Summarize Parts -> Combine.
        Uses enhanced text processor with multi-modal extraction and 12-stage cleaning.
        """
        print(f"[RAGEngine] Processing file: {filename} ({len(file_content)} bytes)")
        
        full_text = ""
        extraction_method = "unknown"
        
        try:
            # 1. Extract Text (Enhanced with multi-modal support)
            if filename.lower().endswith(".pdf"):
                full_text, extraction_method = self.text_processor.extract_text_from_pdf(
                    file_content, filename, max_ocr_pages=100
                )
                
                if extraction_method == "failed":
                    return full_text  # Error message
            else:
                full_text = file_content.decode("utf-8", errors="ignore")
                extraction_method = "text"

            if not full_text.strip():
                return "Error: Could not extract text from document."

            # 2. Clean with 12-stage pipeline
            cleaned_text = self.text_processor.clean_text(full_text)
            print(f"[RAGEngine] Extracted {len(cleaned_text)} characters using {extraction_method}.")
            
            # 3. Detect language
            detected_lang = self.text_processor.detect_language(cleaned_text)
            print(f"[RAGEngine] Detected language: {detected_lang}")

            # 3. Chunk
            chunks = self._chunk_text(cleaned_text, chunk_size=6000)
            print(f"[RAGEngine] Created {len(chunks)} chunks.")

            if not self.api_key:
                return f"LLM not configured. Extracted {len(cleaned_text)} chars. Start: {cleaned_text[:500]}..."

            # 4. Summarize Chunks
            chunk_summaries = []
            
            # SAFEGUARD: Limit chunks to avoid timeouts (Max 4 chunks)
            max_chunks = min(4, len(chunks))
            for i, chunk in enumerate(chunks[:max_chunks]):
                print(f"[RAGEngine] Summarizing chunk {i+1}/{max_chunks}...")
                prompt = (
                    "You are a legal AI assistant.\r\n"
                    "Summarize the following legal text with:\r\n"
                    "- Key facts\r\n"
                    "- Legal issues\r\n"
                    "- Sections / Acts mentioned (ONLY if explicitly present)\r\n"
                    "- Court observations (if any)\r\n\r\n"
                    "Rules:\r\n"
                    "- Do NOT infer missing sections\r\n"
                    "- Do NOT hallucinate citations\r\n"
                    "- Use neutral legal language\r\n"
                    "- Bullet points preferred\r\n\r\n"
                    f"Text:\r\n{chunk}"
                )
                try:
                    summary = self._call_llm([{"role": "user", "content": prompt}], max_tokens=600)
                    chunk_summaries.append(summary)
                except Exception as e:
                    print(f"[RAGEngine] Chunk {i+1} failed: {e}")
            
            if not chunk_summaries:
                return "Error: Failed to generate any summaries."

            # 5. Combine -> Final Structured Summary
            print("[RAGEngine] Generating Final Structured Summary...")
            combined_text = "\r\n\r\n".join(chunk_summaries)
            
            final_system_prompt = (
                "You are an expert Legal Architect AI. "
                "Using the provided summaries of a legal document, create a single, Master Structured Summary. "
                "Format strictly in Markdown with the following sections:\r\n"
                "### Executive Summary\r\n(A concise overview)\r\n\r\n"
                "### Case Classification\r\n"
                "- Nature: Criminal / Civil / Constitutional / Administrative\r\n"
                "- Cyber Law Applicable: Yes / No\r\n"
                "- Era: Pre-IT Act / Post-IT Act\r\n\r\n"
                "### Key Legal Sections Referenced\r\n(List specific Acts and Sections)\r\n\r\n"
                "### Critical Observations & Findings\r\n(Key points, obligations, facts)\r\n\r\n"
                "### Citations & Case Law\r\n(If any mentioned)\r\n\r\n"
                "### Legal Implications\r\n(What this means for the parties)"
            )

            final_summary = self._call_llm([
                {"role": "system", "content": final_system_prompt},
                {"role": "user", "content": f"Summaries:\r\n{combined_text}"}
            ], max_tokens=1500)

            return final_summary

        except Exception as e:
            print(f"[RAGEngine] Summarization Pipeline Error: {e}")
            return f"Failed to summarize document: {str(e)}"

    async def compare_clauses(self, text1: str, text2: str) -> dict:
        """
        Compares two legal clauses and returns a structured JSON analysis.
        """
        if not self.api_key:
            return {"error": "API Key missing"}

        system_prompt = (
            "You are an expert Legal Analyst specializing in Indian Law (IPC vs BNS). "
            "Compare the two provided legal clauses deeply. "
            "You MUST return the result in valid JSON format with the following structure:\r\n"
            "{\r\n"
            '  "change_type": "Renumbered / Modified / New / Removed",\r\n'
            '  "legal_impact": "A concise summary of the legal impact...",\r\n'
            '  "penalty_difference": "No substantive change / Increased / Decreased",\r\n'
            '  "key_changes": ["Bullet point 1", "Bullet point 2"],\r\n'
            '  "verdict": "Minor procedural change" (or "Major substantive change")\r\n'
            "}\r\n"
            "Do not include any Markdown formatting (like ```json). Just the raw JSON string."
        )

        user_query = f"Clause A (Old/IPC): {text1}\r\n\r\nClause B (New/BNS): {text2}"

        try:
            response_text = self._call_llm([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ])
            
            # Clean up potential markdown code blocks if the LLM ignores instructions
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            
            import json
            try:
                # Attempt to parse JSON (handling potential trailing commas)
                cleaned_text = re.sub(r',\s*}', '}', cleaned_text)
                analysis_json = json.loads(cleaned_text)
                return analysis_json
            except json.JSONDecodeError:
                print(f"[RAGEngine] JSON Parse Error. Raw: {cleaned_text}")
                # Fallback to simple text if JSON fails
                return {
                    "change_type": "Analysis Generated",
                    "legal_impact": cleaned_text,
                    "penalty_difference": "See analysis",
                    "key_changes": ["Could not parse structured data"],
                    "verdict": "See details"
                }

        except Exception as e:
            print(f"[RAGEngine] Compare Error: {e}")
            return {"error": str(e)}

    async def query(self, query: str, language: str = "en", arguments_mode: bool = False, analysis_mode: bool = False, session_id: Optional[str] = None, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Semantic Search + LLM Generation with Multi-Turn Conversation Memory.
        
        Args:
            query: User's question
            language: 'en' or 'hi'
            arguments_mode: Generate balanced arguments
            analysis_mode: Generate neutral analysis
            session_id: Optional session ID for conversation memory
            history: Optional list of previous conversation messages [{"role": "user"|"assistant", "content": "..."}]
        """
        # Normalize prior conversation history
        conv_history: List[Dict[str, str]] = []
        if history:
            conv_history = [
                {"role": m.get("role", "user"), "content": str(m.get("content", ""))}
                for m in history
                if m.get("content") and m.get("role") in ("user", "assistant")
            ]
        elif session_id:
            conv_history = [
                {"role": m.get("role", "user"), "content": str(m.get("content", ""))}
                for m in self.conversation_memory.get_history(session_id, max_messages=8)
                if m.get("content") and m.get("role") in ("user", "assistant")
            ]

        # Ignore if the last history entry is duplicate of the current question
        if conv_history and conv_history[-1]["role"] == "user" and conv_history[-1]["content"] == query:
            conv_history = conv_history[:-1]

        # Handle conversation memory and query reformulation
        original_query = query
        if conv_history:
            # SAFEGUARD: Do not reformulate very long queries (e.g. pasted text)
            if len(query) < 300:
                query = self._rewrite_followup(session_id, query, history=conv_history)
                if query != original_query:
                    print(f"[RAGEngine] Query reformulated: '{original_query}' -> '{query}'")
        
        # Safe print for Windows consoles (handles Hindi chars)
        safe_query = query.encode('ascii', 'replace').decode('ascii')
        print(f"[RAGEngine] Semantic Query: {safe_query} (Lang: {language}, Prior Turns: {len(conv_history)})")

        LONG_TRIGGERS = ["explain", "detail", "elaborate", "analysis", "ingredients"]
        is_long = any(t in query.lower() for t in LONG_TRIGGERS)

        # 0. Smart Routing: rule-based first, LLM as optional fallback
        # If in an active conversation with prior turns, treat follow-ups as legal context instead of fresh greetings
        query_type = "legal" if conv_history else self._classify_query(query)
        if query_type == 'simple':
            # Use lightweight model for general chat
            try:
                greeting_prompt = (
                    "You are LegalAi. Answer the user's general question or greeting briefly and politely."
                )
                routing_response = self._call_llm([
                    {"role": "system", "content": greeting_prompt},
                    {"role": "user", "content": query}
                ], max_tokens=200, model_override=self.model_simple).strip()
                if routing_response:
                    print(f"[RAGEngine] Rule router DIRECT ANSWER: {routing_response[:50]}...")
                    return {
                        "answer": routing_response,
                        "citations": [],
                        "related_judgments": [],
                        "neutral_analysis": None,
                        "arguments": None
                    }
            except Exception as e:
                print(f"[RAGEngine] Simple route error: {e}. Proceeding with search.")
        else:
            # Optional LLM router as fallback when ambiguous
            try:
                router_prompt = (
                    "You are a Router. Classify the user input.\r\n"
                    "- If it is a greeting, general chat, or a question NOT about Indian Law, answer it directly and politely. DO NOT say 'I am a router'. Act as LegalAi.\r\n"
                    "- If it is a specific legal question, OR a request for 'details', 'explanation', 'elaboration', or a follow-up to a previous topic, reply ONLY with the word 'SEARCH'.\r\n"
                    "- If the input is ambiguous, reply 'SEARCH'.\r\n"
                    f"- User Language: {language}\r\n"
                    "User Input: " + query
                )
                routing_response = self._call_llm([{"role": "user", "content": router_prompt}], max_tokens=150, model_override=self.model_simple).strip()
                if "SEARCH" not in routing_response and len(routing_response) > 5:
                    print(f"[RAGEngine] LLM router DIRECT ANSWER: {routing_response[:50]}...")
                    return {
                        "answer": routing_response,
                        "citations": [],
                        "related_judgments": [],
                        "neutral_analysis": None,
                        "arguments": None
                    }
                print(f"[RAGEngine] Router chose SEARCH.")
            except Exception as e:
                print(f"[RAGEngine] Router Error: {e}. Falling back to Search.")

        
        context_text = ""
        citations = []
        related_judgments = []
        
        # 0.5 Cross-Lingual Search Optimization
        # If language is Hindi, translate query to English for better Vector Search recall
        search_query = query
        if language == 'hi':
            try:
                print(f"[RAGEngine] Translating query to English for Search...")
                translation_prompt = f"Translate the following Hindi legal query to precise English legal terms for a database search. Output ONLY the English translation.\r\nHindi: {query}"
                translated_query = self._call_llm([{"role": "user", "content": translation_prompt}], max_tokens=100).strip()
                safe_translated = translated_query.encode('ascii', 'replace').decode('ascii')
                safe_original = query.encode('ascii', 'replace').decode('ascii')
                print(f"[RAGEngine] Translated: '{safe_original}' -> '{safe_translated}'")
                search_query = translated_query
            except Exception as e:
                print(f"[RAGEngine] Translation failed: {e}. Using original query.")

        # 1. Retrieve from Vector DB
        try:
            print(f"[RAGEngine] Starting Vector Search for '{search_query}'...", flush=True)
            
            search_cache_key = f"search::{search_query}"
            results = self._cache.get(search_cache_key)
            if results is not None:
                print(f"[RAGEngine] Using Cached Search Results.")
            elif self.collection:
                # Pull a wide candidate pool; the keyword re-ranker picks the best passages from it
                results = self.collection.query(
                    query_texts=[search_query], # Use the (potentially) translated query
                    n_results=30,
                    include=["documents", "metadatas", "distances"]
                )
                self._cache[search_cache_key] = results
                print(f"[RAGEngine] Vector Search Complete. Found: {len(results['documents'][0])} docs", flush=True)

            if results is not None:
                docs = list(results['documents'][0])
                metas = list(results['metadatas'][0])
                dists = list(results['distances'][0])
                # If the question names a section ("section 66A"), fetch it directly so semantic
                # search cannot miss it
                for doc, meta in self._explicit_section_hits(search_query):
                    if doc not in docs:
                        docs.append(doc)
                        metas.append(meta)
                        dists.append(0.9)
                selected = select_context(search_query, docs, metas, dists)
                # Relevance gating: verify that retrieved chunks genuinely match the subject matter
                q_kws = keywords(search_query)
                relevant_selected = []
                for doc, meta, score in selected:
                    text_lower = doc.lower()
                    topic_lower = str(meta.get('topic', '')).lower()
                    sec = str(meta.get('section') or meta.get('bns_section') or meta.get('ipc_section') or '').lower()
                    has_kw = any(k in text_lower or k in topic_lower or (sec and k in sec) for k in q_kws)
                    # Keep if distance is close (<= 1.15) OR if keywords match with distance (<= 1.25)
                    if score <= 1.15 or (has_kw and score <= 1.25):
                        relevant_selected.append((doc, meta, score))

                if relevant_selected:
                    for doc, meta, _score in relevant_selected:
                        snippet = doc[:1000]
                        src = meta.get('source', 'Unknown')
                        law = meta.get('law')
                        section = meta.get('section') or meta.get('bns_section') or meta.get('ipc_section')
                        context_text += f"---\r\nSource: {src}\r\nContent: {snippet}\r\n"
                        
                        if meta.get("type") == "statute":
                             # Generate URL if not in metadata
                             citation_url = meta.get("url") or self._generate_statute_url(law, section)
                             citations.append({
                                 "source": (law or "Statute"),
                                 "section": f"Section {section}" if section else None,
                                 "url": citation_url,
                                 "text": snippet[:200] + "..."
                             })
                        elif meta.get("type") == "judgment":
                             title = meta.get("title", "Unknown Case")
                             if title and title != "Unknown Case":
                                 citations.append({
                                     "source": "Supreme Court Judgment", 
                                     "section": title, 
                                     "text": snippet[:200] + "..."
                                 })
                                 related_judgments.append({
                                     "title": title,
                                     "summary": snippet[:200] + "...",
                                     "case_id": meta.get("case_id", "")
                                 })
                else:
                    context_text = "No directly relevant statutory excerpts found in local database."
            else:
                context_text = "Database not available. Answer generically."
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector Search Error: {e}")
             context_text = "Search unavailable."

        # 2. Generate Answer with LLM
        answer = "I apologize, but I cannot generate an answer at this moment."
        neutral_analysis = None
        arguments = None
        
        print(f"[RAGEngine] Preparing LLM request...", flush=True)
        if self.api_key:
            system_prompt = (
                "You are Nyaya, an authoritative and thorough Indian legal research assistant.\r\n\r\n"
                "Abbreviations: IPC = Indian Penal Code, 1860. BNS = Bharatiya Nyaya Sanhita, 2023 (replaced the IPC). BNSS = Bharatiya Nagarik Suraksha Sanhita, 2023. IT Act = Information Technology Act, 2000.\r\n\r\n"
                "RULES:\r\n"
                "1. Ground statutory citations in the Context provided whenever relevant excerpts are present. Quote or closely paraphrase provisions and name their section numbers and Acts.\r\n"
                "2. If local database excerpts do not cover the specific subject (such as tenancy/rent agreements under the Transfer of Property Act 1882 & Registration Act 1908, consumer protection, family law, contract law, or civil procedure), synthesize established Indian statutory law, landmark principles, and standard procedural requirements to provide an authoritative, detailed, and practically useful legal answer. Never refuse to answer or give a blank response simply because a statute is not present in the local database excerpts.\r\n"
                "3. Do not invent nonexistent section numbers or fake case names. Only cite genuine Indian statutes and established landmark jurisprudence.\r\n"
                "4. Be structured, objective, and clear. Do not give informal personal advice.\r\n"
                "5. STRUCTURE: Direct Answer; Key Provisions / Legal Framework (governing Acts, sections, essentials, clauses); Formalities & Procedural Requirements / Outcome; Relevant Acts & Sources.\r\n"
                "6. If using a Markdown table, ensure valid GitHub Flavored Markdown with every row on its own line separated by standard newlines (never merge rows with || on a single line).\r\n\r\n"
                "DISCLAIMER: For informational purposes only. Not legal advice."
            )
            if language == "hi":
                system_prompt += (
                    "\r\n\r\nCRITICAL LANGUAGE MANDATE:\r\n"
                    "- The user has selected Hindi. You MUST generate the ENTIRE response in Hindi using the Devanagari script (हिन्दी).\r\n"
                    "- Even if the user prompt is written in English or Latin script, your response MUST be in Hindi.\r\n"
                    "- Use Devanagari script for all explanations, analyses, and section headings (e.g. 'सीधा उत्तर', 'मुख्य कानूनी प्रावधान एवं रूपरेखा', 'अनिवार्य तत्व एवं प्रक्रिया', 'संबंधित अधिनियम एवं स्रोत').\r\n"
                    "- Act names can be mentioned with their standard Hindi and English names (e.g., भारतीय न्याय संहिता, 2023 / BNS; संपत्ति अंतरण अधिनियम, 1882 / Transfer of Property Act).\r\n"
                    "- Do NOT output the main explanation in English."
                )
            elif language == "en":
                system_prompt += (
                    "\r\n\r\nCRITICAL LANGUAGE MANDATE:\r\n"
                    "- The user has selected English. You MUST generate the ENTIRE response strictly in English.\r\n"
                    "- Even if the user prompt is written in Hindi/Devanagari, or previous conversation history contains Hindi, your response MUST be in English.\r\n"
                    "- Use English for all explanations, analyses, and section headings (e.g., 'Direct Answer', 'Key Provisions / Legal Framework', 'Formalities & Procedural Requirements', 'Relevant Acts & Sources').\r\n"
                    "- Do NOT output the explanation in Hindi or Devanagari script."
                )

            if is_long:
                system_prompt += (
                    "\r\n\r\nLONG-FORM REQUEST:\r\n"
                    "- Provide a detailed explanation with additional context when possible."
                )

            if analysis_mode:
                system_prompt += (
                    "\r\n[NEUTRAL ANALYSIS REQUESTED]\r\n"
                    "You must also provide a Neutral Analysis section at the end.\r\n"
                    "Strictly use this format:\r\n"
                    "[FACTORS]\r\n- Factor 1\r\n- Factor 2\r\n[/FACTORS]\r\n"
                    "[INTERPRETATIONS]\r\n- Interpretation 1\r\n- Interpretation 2\r\n[/INTERPRETATIONS]"
                )
            
            if arguments_mode:
                system_prompt += (
                    "\r\n[ARGUMENTS REQUESTED]\r\n"
                    "You must also provide Balanced Arguments at the end.\r\n"
                    "Strictly use this format:\r\n"
                    "[FOR]\r\n- Argument For 1\r\n- Argument For 2\r\n[/FOR]\r\n"
                    "[AGAINST]\r\n- Argument Against 1\r\n- Argument Against 2\r\n[/AGAINST]"
                )

            user_query = f"Context:\r\n{context_text}\r\n\r\nQuery: {query}\r\n"
            if language == "hi":
                user_query += "\r\n\r\n(REMINDER: The user selected Hindi mode. You MUST respond strictly in Hindi / Devanagari script.)"
            elif language == "en":
                user_query += "\r\n\r\n(REMINDER: The user selected English mode. You MUST respond strictly in English.)"
            
            # Append instructions to User Prompt for Recency Bias
            if analysis_mode:
                user_query += (
                    "\r\n\r\nIMPORTANT: You MUST also provide a Neutral Analysis at the very end.\r\n"
                    "Use this EXACT format:\r\n"
                    "[FACTORS]\r\n- Factor 1\r\n- Factor 2\r\n[/FACTORS]\r\n"
                    "[INTERPRETATIONS]\r\n- Interpretation 1\r\n- Interpretation 2\r\n[/INTERPRETATIONS]"
                )

            if arguments_mode:
                 user_query += (
                    "\r\n\r\nIMPORTANT: You MUST also provide Balanced Arguments at the very end.\r\n"
                    "Use this EXACT format:\r\n"
                    "[FOR]\r\n- Argument For 1\r\n[/FOR]\r\n"
                    "[AGAINST]\r\n- Argument Against 1\r\n[/AGAINST]"
                )

            try:
                print(f"[RAGEngine] Calling LLM now...", flush=True)
                # Check cache (keyed by query + language + top sources + prior context)
                if conv_history:
                    last_q = conv_history[-1].get("content", "")[:40]
                    cache_key = f"{language}|{last_q}|{query.strip()}|{','.join([c.get('source','') for c in citations[:2]])}"
                else:
                    cache_key = f"{language}|{query.strip()}|{','.join([c.get('source','') for c in citations[:2]])}"

                if cache_key in self._cache:
                    cached = self._cache[cache_key]
                    return {
                        "answer": cached.get("answer", ""),
                        "citations": citations[:3],
                        "related_judgments": related_judgments[:3],
                        "neutral_analysis": cached.get("neutral_analysis"),
                        "arguments": cached.get("arguments")
                    }

                max_tokens = 2000 if is_long else 1500
                llm_messages = [{"role": "system", "content": system_prompt}]

                # Include up to the last 6 turns of conversation history so the LLM remembers previous context
                if conv_history:
                    for turn in conv_history[-6:]:
                        role = turn.get("role", "user")
                        content = turn.get("content", "")
                        # Trim long assistant responses to keep prompt lean and prevent token overflow
                        if role == "assistant" and len(content) > 1000:
                            content = content[:1000] + "..."
                        llm_messages.append({"role": role, "content": content})

                # Append the current user query with retrieved legal context
                llm_messages.append({"role": "user", "content": user_query})

                raw_answer = self._call_llm(
                    llm_messages,
                    max_tokens=max_tokens,
                    model_override=self.model_legal
                )
                print(f"[RAGEngine] LLM returned response.", flush=True)
                try:
                    print(f"\r\n[DEBUG] Raw LLM Answer:\r\n{raw_answer.encode('utf-8', 'replace').decode('utf-8')}\r\n[DEBUG] End Raw Answer\r\n", flush=True)
                except Exception:
                     print(f"\r\n[DEBUG] Raw LLM Answer: (encoding error)\r\n[DEBUG] End Raw Answer\r\n", flush=True)
                
                def extract_tag(text, start_tag, end_tag):
                    # Try exact tag first
                    pattern = f"{re.escape(start_tag)}\\s*(.*?)\\s*{re.escape(end_tag)}"
                    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                    
                    if not match and "ARGUMENTS" in start_tag:
                         # Fallback for "ARGUMENTS FOR" variations
                         alt_start = start_tag.replace("FOR", "ARGUMENTS FOR").replace("AGAINST", "ARGUMENTS AGAINST")
                         pattern = f"{re.escape(alt_start)}\\s*(.*?)\\s*{re.escape(end_tag)}"
                         match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

                    if match:
                        content = match.group(1).strip()
                        return [item.strip("- *").strip() for item in content.split("\r\n") if item.strip()]
                    return []

                if analysis_mode:
                    factors = extract_tag(raw_answer, "[FACTORS]", "[/FACTORS]")
                    interpretations = extract_tag(raw_answer, "[INTERPRETATIONS]", "[/INTERPRETATIONS]")
                    if factors or interpretations:
                        neutral_analysis = {"factors": factors or ["Analysis pending"], "interpretations": interpretations or ["Further research required"]}
                
                if arguments_mode:
                    for_args = extract_tag(raw_answer, "[FOR]", "[/FOR]")
                    against_args = extract_tag(raw_answer, "[AGAINST]", "[/AGAINST]")
                    if for_args or against_args:
                        arguments = {"for": for_args or ["N/A"], "against": against_args or ["N/A"]}

                # Remove the special sections from the main answer to avoid duplication
                # Expanded regex to catch variations like [ARGUMENTS FOR]
                answer = re.sub(r'\[/?(FACTORS|INTERPRETATIONS|FOR|AGAINST|ARGUMENTS FOR|ARGUMENTS AGAINST)\]', '', raw_answer, flags=re.IGNORECASE).strip()
                
                # Robust approach: Split by the first occurrence of any special tag
                # Added NEUTRAL ANALYSIS and BALANCED ARGUMENTS which the LLM was using
                split_patterns = ["[FACTORS]", "[INTERPRETATIONS]", "[FOR]", "[AGAINST]", "[ARGUMENTS FOR]", "[ARGUMENTS AGAINST]", "[NEUTRAL ANALYSIS]", "[BALANCED ARGUMENTS]"]
                for p in split_patterns:
                    # Case insensitive check for splitting
                    idx = answer.upper().find(p)
                    if idx != -1:
                        answer = answer[:idx].strip()

                # Cleanup
                # Fix collapsed table rows where '|' of previous row touches '|' of next row without newline
                answer = re.sub(r'\|{2,}', '|\r\n|', answer)
                # Ensure a blank line before any table if preceded by normal text
                answer = re.sub(r'([^\r\n])\r\n(\| ?[^\r\n]+\| *\r\n\| *[-:| ]+ *\|)', r'\1\r\n\r\n\2', answer)
                answer = re.sub(r'\r\n{3,}', '\r\n\r\n', answer).strip()
                # Cache the structured result
                self._cache[cache_key] = {
                    "answer": answer,
                    "arguments": arguments,
                    "neutral_analysis": neutral_analysis
                }
                
            except Exception as e:
                print(f"[RAGEngine] LLM Error: {e}")
                answer = f"Error: {str(e)}"

        # POST-PROCESSING: Extract statute references from answer and add citations if missing
        if answer and not citations:
            # Extract statute references like "Section 120 IPC", "Article 370", "Section 66A IT Act"
            statute_patterns = [
                r'Section\s+(\d+[A-Z]*)\s+(?:of\s+)?(?:the\s+)?(IPC|Indian Penal Code|BNS|Bharatiya Nyaya Sanhita|IT Act|Information Technology Act|CrPC|Code of Criminal Procedure)',
                r'Article\s+(\d+[A-Z]*)\s+(?:of\s+)?(?:the\s+)?Constitution',
                r'(IPC|BNS)\s+Section\s+(\d+[A-Z]*)',
            ]
            
            for pattern in statute_patterns:
                matches = re.finditer(pattern, answer, re.IGNORECASE)
                for match in matches:
                    if 'Article' in match.group(0):
                        section_num = match.group(1)
                        law_name = "Constitution of India"
                        url = f"https://www.constitutionofindia.net/constitution_of_india/part{section_num[0] if section_num[0].isdigit() else '1'}/articles/Article%20{section_num}"
                    elif len(match.groups()) >= 2:
                        section_num = match.group(1)
                        law_name = match.group(2)
                        url = self._generate_statute_url(law_name, section_num)
                    else:
                        continue
                    
                    # Add citation if not already present
                    if not any(c.get('section', '').endswith(section_num) for c in citations):
                        citations.append({
                            "source": law_name,
                            "section": f"Section {section_num}" if 'Section' in match.group(0) else f"Article {section_num}",
                            "url": url,
                            "text": f"Referenced in response"
                        })

        return {
            "answer": answer,
            "citations": citations[:3],
            "related_judgments": related_judgments[:3], 
            "arguments": arguments,
            "neutral_analysis": neutral_analysis,
            "disclaimer": "AI-generated response. For informational purposes only. Consult a qualified lawyer."
        }

    def generate_draft(self, draft_type: str, details: str, language: str = 'en') -> str:
        """
        Generates a formal legal draft based on the user's details.
        """
        templates = {
            "legal_notice": "## LEGAL NOTICE\r\nThrough Registered Post / Speed Post / Email\r\nDate: [Date]\r\n\r\nTo,\r\n[Recipient Name]\r\n[Recipient Address]\r\n\r\n### Subject:\r\nLegal Notice under [Applicable Law] regarding [Issue Brief]\r\n\r\nSir/Madam,\r\n\r\nUnder instructions and on behalf of my client [Sender Name], residing at [Sender Address], I hereby serve upon you the present legal notice as follows:\r\n\r\n1. Facts of the Case\r\nThat my client [Brief Background].\r\nThat despite requests, you have [Breach Description].\r\n\r\n2. Legal Provisions\r\nYour actions amount to violation of:\r\n- [Section Name] of [Act Name]\r\n- Other applicable provisions of law\r\n\r\n3. Cause of Action\r\nThat the cause of action arose on [Date] and continues to subsist.\r\n\r\n4. Demand\r\nYou are hereby called upon to:\r\n- [Specific Demand]\r\nwithin [Time Limit] days from receipt of this notice.\r\n\r\n5. Consequences\r\nFailing compliance, my client shall initiate legal proceedings at your risk.\r\n\r\nYours faithfully,\r\n[Advocate Name]\r\nAdvocate for [Sender Name]",
            
            "nda": "## NON-DISCLOSURE AGREEMENT (NDA)\r\n\r\nThis Agreement is entered into on [Date] between:\r\n\r\nParty A: [Party A Name], at [Address A]\r\nParty B: [Party B Name], at [Address B]\r\n\r\n1. Purpose\r\nThe parties wish to exchange confidential information for [Purpose].\r\n\r\n2. Definition of Confidential Information\r\n'Confidential Information' includes all written, oral, electronic information disclosed.\r\n\r\n3. Obligations\r\nThe Receiving Party shall:\r\n- Not disclose confidential information to third parties\r\n- Use the information solely for the stated purpose\r\n\r\n4. Exclusions\r\nInformation publicly available or required by law is excluded.\r\n\r\n5. Term\r\nValid for [Duration] years.\r\n\r\n6. Governing Law\r\nGoverned by laws of India.\r\n\r\n7. Jurisdiction\r\nCourts at [City] shall have exclusive jurisdiction.\r\n\r\nIN WITNESS WHEREOF, the parties have signed.\r\n\r\nParty A Signature: __________\r\nParty B Signature: __________",
            
            "rent_agreement": "## RENT AGREEMENT\r\n\r\nThis Agreement is made on [Date] between:\r\n\r\nLandlord: [Landlord Name]\r\nTenant: [Tenant Name]\r\n\r\n1. Property\r\nThe Landlord lets out the premises located at [Property Address].\r\n\r\n2. Rent\r\nMonthly rent shall be Rs. [Rent Amount], payable on or before [Due Date].\r\n\r\n3. Security Deposit\r\nTenant shall pay Rs. [Security Deposit] as refundable security deposit.\r\n\r\n4. Term\r\nValid for [Duration] months.\r\n\r\n5. Maintenance\r\nTenant shall maintain the premises and not sublet without permission.\r\n\r\n6. Termination\r\nEither party may terminate with [Notice Period] days notice.\r\n\r\nSigned on [Date].\r\n\r\nLandlord Signature: _______\r\nTenant Signature: _______",
            
            "affidavit": "## AFFIDAVIT\r\n\r\nI, [Deponent Name], aged [Age], residing at [Address], do hereby solemnly affirm:\r\n\r\n1. That I am the deponent herein and competent to swear this affidavit.\r\n2. That [Statement of Facts].\r\n3. That the statements made herein are true to my knowledge.\r\n\r\nVerified at [Place] on [Date].\r\n\r\nDEPONENT SIGNATURE\r\n\r\nSolemnly affirmed before me on [Date].\r\n\r\nNotary / Oath Commissioner",
            
            "employment_contract": "## EMPLOYMENT AGREEMENT\r\n\r\nThis Agreement is entered on [Date] between:\r\n\r\nEmployer: [Company Name]\r\nEmployee: [Employee Name]\r\n\r\n1. Designation\r\nEmployee shall serve as [Designation].\r\n\r\n2. Duties\r\nEmployee shall perform duties assigned from time to time.\r\n\r\n3. Salary\r\nMonthly remuneration shall be Rs. [Salary].\r\n\r\n4. Confidentiality\r\nEmployee shall maintain confidentiality during and after employment.\r\n\r\n5. Termination\r\nEither party may terminate with [Notice Period] days notice.\r\n\r\nSigned:\r\n\r\nEmployer: _______\r\nEmployee: _______",
            
            "posh_complaint": "## COMPLAINT UNDER POSH ACT, 2013\r\n\r\nTo,\r\nThe Internal Complaints Committee\r\n[Organization Name]\r\n\r\nSubject: Complaint under Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013\r\n\r\n1. Complainant Details\r\nName: [Complainant Name]\r\nDesignation: [Designation]\r\nDepartment: [Department]\r\n\r\n2. Respondent Details\r\nName: [Respondent Name]\r\nDesignation: [Respondent Designation]\r\nRelationship with Complainant: [Relationship]\r\n\r\n3. Incident Details\r\nDate of Incident: [Date]\r\nPlace of Incident: [Place]\r\nDescription of Incident:\r\n[Detailed Description of Harassment]\r\n\r\n4. Impact\r\nThe incident has created a hostile work environment and affected my dignity/work performance.\r\n\r\n5. Witnesses (if any)\r\n[List of Witnesses]\r\n\r\n6. Evidence (if any)\r\n[List of Evidence]\r\n\r\n7. Relief Sought\r\nI requested the ICC to conduct an inquiry into this matter and take appropriate action against the respondent under the POSH Act.\r\n\r\nI hereby declare that the information provided above is true and correct to the best of my knowledge.\r\n\r\nSignature: ______\r\nDate: ______",
            
            "rti_application": "## APPLICATION UNDER RTI ACT, 2005\r\n\r\nTo,\r\nThe Public Information Officer\r\n[Department Name]\r\n\r\nSubject: Information under RTI Act, 2005\r\n\r\nSir/Madam,\r\n\r\nKindly provide the following information regarding [Subject Matter]:\r\n\r\n1. [Question 1]\r\n2. [Question 2]\r\n\r\nI have enclosed the application fee of Rs. 10.\r\n\r\nAddress for correspondence: [Address]\r\n\r\nDate: [Date]\r\nApplicant Signature: _______"
        }

        template = templates.get(draft_type, "Generate a formal legal document for the user.")

        system_prompt = (
            "You are an Indian Legal Drafting Assistant. YOUR GOAL is to fill the provided template accurately.\r\n\r\n"
            f"TEMPLATE STRUCTURE (Reference Only):\r\n{template}\r\n\r\n"
            "CRITICAL RULES:\r\n"
            "1. NO MARKDOWN BOLDING: Do NOT use **bold** or *italic* syntax. Use plain text.\r\n"
            "2. ADAPTIVE LENGTH: If user provides detailed input, EXPAND the draft. Add extra paragraphs/points to cover all user details. Do NOT truncate user info to fit the template.\r\n"
            "3. REPLACE PLACEHOLDERS: Replace [Name], [Date] with actual info. Infer missing info reasonably.\r\n"
            "4. OUTPUT: Return ONLY the filled document content.\r\n"
            "5. DISCLAIMER: Add a standard disclaimer at the very bottom.\r\n\r\n"
        )

        if language == 'hi':
            system_prompt += (
                "CRITICAL HINDI RULES:\r\n"
                "1. TRANSLATE THE ENTIRE DOCUMENT TO HINDI (Devanagari).\r\n"
                "2. USE CORRECT LEGAL TERMINOLOGY (Glossary below):\r\n"
                "   - 'Legal Notice' -> 'विधिक सूचना' (Vidhik Suchna)\r\n"
                "   - 'Demand' -> 'मांग' (Maang) or 'अपेक्षा' (Apeksha)\r\n"
                "   - 'Cause of Action' -> 'वाद का कारण' (Vaad ka Kaaran)\r\n"
                "   - 'Rent Agreement' -> 'किरायानामा' (Kirayanama)\r\n"
                "   - 'Affidavit' -> 'शपथ पत्र' (Shapath Patra)\r\n"
                "3. Translate Headers properly (e.g., '1. Purpose' -> '1. उद्देश्य').\r\n"
                "4. ONLY keep specific Act Names/Section Numbers in English (e.g., 'Section 420 IPC').\r\n"
                "5. Do NOT use Hinglish. Ensure full grammatical correctness.\r\n"
            )
        else:
            system_prompt += "Respond in formal English."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Details for draft:\r\n{details}"}
        ]

        try:
            # Using model_simple (Mistral) for better reliability during demo
            draft = self._call_llm(messages, max_tokens=1500, model_override=self.model_simple)
            return self._trim_runaway(draft)
        except Exception as e:
            print(f"[RAGEngine] Drafting failed: {e}")
            return f"Error: Could not generate draft. Reason: {str(e)}"

    def translate_text(self, text: str, target_language: str = "en") -> str:
        """Translate legal text between English and Hindi, preserving formatting and legal fidelity."""
        if not text or not text.strip():
            return ""
        target_name = "English" if target_language == "en" else "Hindi (Devanagari script)"
        prompt = (
            f"You are an expert Indian legal translator.\n"
            f"Translate the following Indian legal text accurately and faithfully into {target_name}.\n"
            f"RULES:\n"
            f"1. Preserve all Markdown elements: headings (#, ##, ###), bold text, bullet points, numbers, and especially table syntax (| col | col |).\n"
            f"2. Translate section headings properly (e.g. 'Direct Answer' <-> 'सीधा उत्तर', 'Key Provisions' <-> 'मुख्य कानूनी प्रावधान', 'Punishment/Outcome' <-> 'दंड/परिणाम', 'Sources' <-> 'स्रोत').\n"
            f"3. Keep statutory section numbers intact (e.g. 'Section 103 BNS', 'Section 302 IPC').\n"
            f"4. Output ONLY the translated legal content. Do not include introductory conversational text (such as 'Here is the translation:') or concluding comments.\n\n"
            f"Text to translate:\n{text}"
        )
        try:
            return self._call_llm([{"role": "user", "content": prompt}], max_tokens=2500).strip()
        except Exception as e:
            print(f"[RAGEngine] Translation error: {e}")
            return text
