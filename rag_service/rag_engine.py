
import os
import json
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
import requests
import io
from text_processor import TextProcessor
from conversation_memory import ConversationMemory

class RAGEngine:
    def __init__(self):
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        
        # Priority: NVIDIA NIM -> OpenRouter
        self.api_key = self.nvidia_api_key or self.openrouter_api_key
        self.provider = "nvidia" if self.nvidia_api_key else "openrouter"

        # Model mapping
        if self.provider == "nvidia":
            self.model_name = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-8b-instruct")
            self.model_legal = os.getenv("NVIDIA_MODEL_LEGAL", "meta/llama-3.1-70b-instruct")
            self.model_simple = os.getenv("NVIDIA_MODEL_SIMPLE", "meta/llama-3.1-8b-instruct")
            print(f"[RAGEngine] Using NVIDIA NIM API. Models: {self.model_name}")
        else:
            self.model_name = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct")
            self.model_legal = os.getenv("OPENROUTER_MODEL_LEGAL", "nvidia/nemotron-orchestrator-8b")
            self.model_simple = os.getenv("OPENROUTER_MODEL_SIMPLE", "mistralai/mistral-7b-instruct")
            print(f"[RAGEngine] Using OpenRouter API. Models: {self.model_name}")

        if not self.api_key:
            print("[RAGEngine] ⚠️ Warning: No API Key found (NVIDIA or OpenRouter). LLM features disabled.")

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
                # Model 'nvidia/nv-embedqa-e5-v5' is high quality and cloud-based
                data = {"input": input, "model": "nvidia/nv-embedqa-e5-v5", "input_type": "query", "encoding_format": "float"}
                response = requests.post(self.url, headers=headers, json=data)
                if response.status_code != 200:
                    raise Exception(f"NVIDIA Embedding Error: {response.text}")
                return [item["embedding"] for item in response.json()["data"]]

        try:
            self.db_client = chromadb.PersistentClient(path=chroma_path)
            
            # Use NVIDIA Cloud Embeddings to save RAM (removes need for local models)
            if self.nvidia_api_key:
                self.ef = NvidiaEmbeddingFunction(self.nvidia_api_key)
                # Use v2 collection for the new embedding dimensions (1024)
                collection_name = "legal_knowledge_v2"
            else:
                self.ef = embedding_functions.DefaultEmbeddingFunction()
                collection_name = "legal_knowledge_default"
                
            self.collection = self.db_client.get_or_create_collection(name=collection_name, embedding_function=self.ef)
            print(f"[RAGEngine] Connected to Vector DB [{collection_name}]. ({self.collection.count()} docs)")
            
            # Simple check: If collection is empty, we would normally ingest here.
            # For now, we prioritize stability and will let the user upload files.
            
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector DB Connection Error: {e}")
             self.collection = None

    def _classify_query(self, query: str) -> str:
        """Classify query as 'simple' or 'legal' for optimization."""
        query_lower = query.lower()
        
        # Simple greetings/basic questions that don't need RAG
        simple_patterns = [
            'hello', 'hi', 'hey', 'thanks', 'thank you',
            'what is your name', 'who are you', 'what can you do',
            'help', 'how to use', 'what are you'
        ]
        
        if any(pattern in query_lower for pattern in simple_patterns):
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
    
    
    def _call_llm(self, messages: List[Dict], max_tokens: int = 1500, timeout: int = 30, model_override: Optional[str] = None) -> str:
        """Helper to call LLM API with timeout."""
        if not self.api_key:
            raise Exception("API Key missing")

        if self.provider == "nvidia":
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
                "X-Title": "LegalAi",
                "Content-Type": "application/json"
            }

        data = {
            "model": model_override or self.model_name,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": max_tokens
        }

        try:
            response = requests.post(url, headers=headers, json=data, timeout=timeout)
            
            if response.status_code != 200:
                print(f"[RAGEngine] API Error Body: {response.text}")
                raise Exception(f"API Error {response.status_code}: {response.text}")

            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message'].get('content', '')
                if not content:
                     return "Error: Received empty content from LLM."
                return content
            else:
                raise Exception(f"Unexpected response format: {result}")

        except requests.exceptions.Timeout:
            print(f"[RAGEngine] Request timeout after {timeout}s")
            raise Exception(f"Response took too long (>{timeout}s). The LLM service may be busy. Please try again.")
        except Exception as e:
            print(f"[RAGEngine] Request failed: {e}")
            raise e

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
                    "You are a legal AI assistant.\n"
                    "Summarize the following legal text with:\n"
                    "- Key facts\n"
                    "- Legal issues\n"
                    "- Sections / Acts mentioned (ONLY if explicitly present)\n"
                    "- Court observations (if any)\n\n"
                    "Rules:\n"
                    "- Do NOT infer missing sections\n"
                    "- Do NOT hallucinate citations\n"
                    "- Use neutral legal language\n"
                    "- Bullet points preferred\n\n"
                    f"Text:\n{chunk}"
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
            combined_text = "\n\n".join(chunk_summaries)
            
            final_system_prompt = (
                "You are an expert Legal Architect AI. "
                "Using the provided summaries of a legal document, create a single, Master Structured Summary. "
                "Format strictly in Markdown with the following sections:\n"
                "### 📌 Executive Summary\n(A concise overview)\n\n"
                "### 🏷 Case Classification\n"
                "- Nature: Criminal / Civil / Constitutional / Administrative\n"
                "- Cyber Law Applicable: Yes / No\n"
                "- Era: Pre-IT Act / Post-IT Act\n\n"
                "### 📑 Key Legal Sections Referenced\n(List specific Acts and Sections)\n\n"
                "### ⚖️ Critical Observations & Findings\n(Key points, obligations, facts)\n\n"
                "### 📚 Citations & Case Law\n(If any mentioned)\n\n"
                "### 🔮 Legal Implications\n(What this means for the parties)"
            )

            final_summary = self._call_llm([
                {"role": "system", "content": final_system_prompt},
                {"role": "user", "content": f"Summaries:\n{combined_text}"}
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
            "You MUST return the result in valid JSON format with the following structure:\n"
            "{\n"
            '  "change_type": "Renumbered / Modified / New / Removed",\n'
            '  "legal_impact": "A concise summary of the legal impact...",\n'
            '  "penalty_difference": "No substantive change / Increased / Decreased",\n'
            '  "key_changes": ["Bullet point 1", "Bullet point 2"],\n'
            '  "verdict": "Minor procedural change" (or "Major substantive change")\n'
            "}\n"
            "Do not include any Markdown formatting (like ```json). Just the raw JSON string."
        )

        user_query = f"Clause A (Old/IPC): {text1}\n\nClause B (New/BNS): {text2}"

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

    async def query(self, query: str, language: str = "en", arguments_mode: bool = False, analysis_mode: bool = False, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Semantic Search + LLM Generation with Conversation Memory.
        
        Args:
            query: User's question
            language: 'en' or 'hi'
            arguments_mode: Generate balanced arguments
            analysis_mode: Generate neutral analysis
            session_id: Optional session ID for conversation memory
        """
        # Handle conversation memory and query reformulation
        original_query = query
        if session_id:
            # SAFEGUARD: Do not reformulate very long queries (e.g. pasted text)
            if len(query) < 300:
                query = self.conversation_memory.reformulate_query(session_id, query)
                if query != original_query:
                    print(f"[RAGEngine] Query reformulated: '{original_query}' -> '{query}'")
        
        # Safe print for Windows consoles (handles Hindi chars)
        safe_query = query.encode('ascii', 'replace').decode('ascii')
        print(f"[RAGEngine] Semantic Query: {safe_query} (Lang: {language})")

        LONG_TRIGGERS = ["explain", "detail", "elaborate", "analysis", "ingredients"]
        is_long = any(t in query.lower() for t in LONG_TRIGGERS)

        # 0. Smart Routing: rule-based first, LLM as optional fallback
        query_type = self._classify_query(query)
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
                    "You are a Router. Classify the user input.\n"
                    "- If it is a greeting, general chat, or a question NOT about Indian Law, answer it directly and politely. DO NOT say 'I am a router'. Act as LegalAi.\n"
                    "- If it is a specific legal question, OR a request for 'details', 'explanation', 'elaboration', or a follow-up to a previous topic, reply ONLY with the word 'SEARCH'.\n"
                    "- If the input is ambiguous, reply 'SEARCH'.\n"
                    f"- User Language: {language}\n"
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
                translation_prompt = f"Translate the following Hindi legal query to precise English legal terms for a database search. Output ONLY the English translation.\nHindi: {query}"
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
            if search_cache_key in self._cache:
                 print(f"[RAGEngine] Using Cached Search Results.")
                 results = self._cache[search_cache_key]
            elif self.collection:
                results = self.collection.query(
                    query_texts=[search_query], # Use the (potentially) translated query
                    n_results=5,
                    include=["documents", "metadatas", "distances"]
                )
                # Cache the raw search results
                self._cache[search_cache_key] = results
                print(f"[RAGEngine] Vector Search Complete. Found: {len(results['documents'][0])} docs", flush=True)
                
                docs = results['documents'][0]
                metas = results['metadatas'][0]
                
                dists = results['distances'][0]
                min_dist = min(dists) if dists else 1.0
                
                doc_count = 0
                for i, doc in enumerate(docs):
                    meta = metas[i]
                    dist = dists[i]
                    
                    # Relevance Cutoff tightened: dynamic + absolute guard
                    # RELAXED threshold per expert recommendation
                    if dist > 0.45:
                        continue
                        
                    # Limit context size: max 4 docs
                    if doc_count >= 4:
                        break
                    doc_count += 1
                        
                    snippet = doc[:2000]
                    src = meta.get('source', 'Unknown')
                    law = meta.get('law')
                    section = meta.get('section') or meta.get('bns_section') or meta.get('ipc_section')
                    context_text += f"---\nSource: {src}\nContent: {snippet}\n"
                    
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
                "You are LegalAi, an expert Indian legal research assistant with comprehensive knowledge of Indian law.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. ALWAYS provide authoritative, professional answers. NEVER mention 'context not available', 'provided context', or data limitations.\n"
                "2. Use the provided Context when available, otherwise rely on your knowledge of Indian Law (IPC, BNS, CrPC, IT Act, Constitution).\n"
                "3. NEVER say 'does not directly relate' or 'not applicable'. If a question is about constitutional law, civil law, or case law, answer it confidently.\n"
                "4. For landmark cases (e.g., Kesavananda Bharati), provide the case name, year, key holding, and citation (AIR/SCC) even if not in the database.\n"
                "5. ACCURACY: Verify facts. IPC 420 = up to 7 years + fine. IPC 302 = Death or Life Imprisonment.\n"
                "6. STRUCTURE:\n"
                "   - Direct Answer (clear, confident)\n"
                "   - Provisions/Key Points (if applicable)\n"
                "   - Punishment/Outcome (if applicable)\n"
                "   - Source/Citation (statute or case law)\n\n"
                "7. NEVER use phrases like:\n"
                "   - 'The provided context does not contain...'\n"
                "   - 'Not applicable as...'\n"
                "   - 'Does not directly relate to...'\n"
                "   Instead, answer the question directly and professionally.\n\n"
                "DISCLAIMER: For informational purposes only. Not legal advice."
            )
            if language == "hi":
                system_prompt += (
                    "\n\nLANGUAGE RULE:\n- Respond fully in Hindi (Devanagari).\n- Section numbers and Act names may remain in English characters.\n"
                    "- Translate legal terms to Hindi where appropriate. Do NOT reply in English."
                )

            if is_long:
                system_prompt += (
                    "\n\nLONG-FORM REQUEST:\n"
                    "- Provide a detailed explanation with additional context when possible."
                )

            if analysis_mode:
                system_prompt += (
                    "\n[NEUTRAL ANALYSIS REQUESTED]\n"
                    "You must also provide a Neutral Analysis section at the end.\n"
                    "Strictly use this format:\n"
                    "[FACTORS]\n- Factor 1\n- Factor 2\n[/FACTORS]\n"
                    "[INTERPRETATIONS]\n- Interpretation 1\n- Interpretation 2\n[/INTERPRETATIONS]"
                )
            
            if arguments_mode:
                system_prompt += (
                    "\n[ARGUMENTS REQUESTED]\n"
                    "You must also provide Balanced Arguments at the end.\n"
                    "Strictly use this format:\n"
                    "[FOR]\n- Argument For 1\n- Argument For 2\n[/FOR]\n"
                    "[AGAINST]\n- Argument Against 1\n- Argument Against 2\n[/AGAINST]"
                )

            user_query = f"Context:\n{context_text}\n\nQuery: {query}\n"
            
            # Append instructions to User Prompt for Recency Bias
            if analysis_mode:
                user_query += (
                    "\n\nIMPORTANT: You MUST also provide a Neutral Analysis at the very end.\n"
                    "Use this EXACT format:\n"
                    "[FACTORS]\n- Factor 1\n- Factor 2\n[/FACTORS]\n"
                    "[INTERPRETATIONS]\n- Interpretation 1\n- Interpretation 2\n[/INTERPRETATIONS]"
                )

            if arguments_mode:
                 user_query += (
                    "\n\nIMPORTANT: You MUST also provide Balanced Arguments at the very end.\n"
                    "Use this EXACT format:\n"
                    "[FOR]\n- Argument For 1\n[/FOR]\n"
                    "[AGAINST]\n- Argument Against 1\n[/AGAINST]"
                )

            try:
                print(f"[RAGEngine] Calling LLM now...", flush=True)
                # Check cache (keyed by query + language + top sources)
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
                raw_answer = self._call_llm([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ], max_tokens=max_tokens, model_override=self.model_simple)
                print(f"[RAGEngine] LLM returned response.", flush=True)
                try:
                    print(f"\n[DEBUG] Raw LLM Answer:\n{raw_answer.encode('utf-8', 'replace').decode('utf-8')}\n[DEBUG] End Raw Answer\n", flush=True)
                except Exception:
                     print(f"\n[DEBUG] Raw LLM Answer: (encoding error)\n[DEBUG] End Raw Answer\n", flush=True)
                
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
                        return [item.strip("- *").strip() for item in content.split("\n") if item.strip()]
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
                answer = re.sub(r'\n{3,}', '\n\n', answer).strip()
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
            "legal_notice": "## LEGAL NOTICE\nThrough Registered Post / Speed Post / Email\nDate: [Date]\n\nTo,\n[Recipient Name]\n[Recipient Address]\n\n### Subject:\nLegal Notice under [Applicable Law] regarding [Issue Brief]\n\nSir/Madam,\n\nUnder instructions and on behalf of my client [Sender Name], residing at [Sender Address], I hereby serve upon you the present legal notice as follows:\n\n1. Facts of the Case\nThat my client [Brief Background].\nThat despite requests, you have [Breach Description].\n\n2. Legal Provisions\nYour actions amount to violation of:\n- [Section Name] of [Act Name]\n- Other applicable provisions of law\n\n3. Cause of Action\nThat the cause of action arose on [Date] and continues to subsist.\n\n4. Demand\nYou are hereby called upon to:\n- [Specific Demand]\nwithin [Time Limit] days from receipt of this notice.\n\n5. Consequences\nFailing compliance, my client shall initiate legal proceedings at your risk.\n\nYours faithfully,\n[Advocate Name]\nAdvocate for [Sender Name]",
            
            "nda": "## NON-DISCLOSURE AGREEMENT (NDA)\n\nThis Agreement is entered into on [Date] between:\n\nParty A: [Party A Name], at [Address A]\nParty B: [Party B Name], at [Address B]\n\n1. Purpose\nThe parties wish to exchange confidential information for [Purpose].\n\n2. Definition of Confidential Information\n'Confidential Information' includes all written, oral, electronic information disclosed.\n\n3. Obligations\nThe Receiving Party shall:\n- Not disclose confidential information to third parties\n- Use the information solely for the stated purpose\n\n4. Exclusions\nInformation publicly available or required by law is excluded.\n\n5. Term\nValid for [Duration] years.\n\n6. Governing Law\nGoverned by laws of India.\n\n7. Jurisdiction\nCourts at [City] shall have exclusive jurisdiction.\n\nIN WITNESS WHEREOF, the parties have signed.\n\nParty A Signature: __________\nParty B Signature: __________",
            
            "rent_agreement": "## RENT AGREEMENT\n\nThis Agreement is made on [Date] between:\n\nLandlord: [Landlord Name]\nTenant: [Tenant Name]\n\n1. Property\nThe Landlord lets out the premises located at [Property Address].\n\n2. Rent\nMonthly rent shall be Rs. [Rent Amount], payable on or before [Due Date].\n\n3. Security Deposit\nTenant shall pay Rs. [Security Deposit] as refundable security deposit.\n\n4. Term\nValid for [Duration] months.\n\n5. Maintenance\nTenant shall maintain the premises and not sublet without permission.\n\n6. Termination\nEither party may terminate with [Notice Period] days notice.\n\nSigned on [Date].\n\nLandlord Signature: _______\nTenant Signature: _______",
            
            "affidavit": "## AFFIDAVIT\n\nI, [Deponent Name], aged [Age], residing at [Address], do hereby solemnly affirm:\n\n1. That I am the deponent herein and competent to swear this affidavit.\n2. That [Statement of Facts].\n3. That the statements made herein are true to my knowledge.\n\nVerified at [Place] on [Date].\n\nDEPONENT SIGNATURE\n\nSolemnly affirmed before me on [Date].\n\nNotary / Oath Commissioner",
            
            "employment_contract": "## EMPLOYMENT AGREEMENT\n\nThis Agreement is entered on [Date] between:\n\nEmployer: [Company Name]\nEmployee: [Employee Name]\n\n1. Designation\nEmployee shall serve as [Designation].\n\n2. Duties\nEmployee shall perform duties assigned from time to time.\n\n3. Salary\nMonthly remuneration shall be Rs. [Salary].\n\n4. Confidentiality\nEmployee shall maintain confidentiality during and after employment.\n\n5. Termination\nEither party may terminate with [Notice Period] days notice.\n\nSigned:\n\nEmployer: _______\nEmployee: _______",
            
            "posh_complaint": "## COMPLAINT UNDER POSH ACT, 2013\n\nTo,\nThe Internal Complaints Committee\n[Organization Name]\n\nSubject: Complaint under Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013\n\n1. Complainant Details\nName: [Complainant Name]\nDesignation: [Designation]\nDepartment: [Department]\n\n2. Respondent Details\nName: [Respondent Name]\nDesignation: [Respondent Designation]\nRelationship with Complainant: [Relationship]\n\n3. Incident Details\nDate of Incident: [Date]\nPlace of Incident: [Place]\nDescription of Incident:\n[Detailed Description of Harassment]\n\n4. Impact\nThe incident has created a hostile work environment and affected my dignity/work performance.\n\n5. Witnesses (if any)\n[List of Witnesses]\n\n6. Evidence (if any)\n[List of Evidence]\n\n7. Relief Sought\nI requested the ICC to conduct an inquiry into this matter and take appropriate action against the respondent under the POSH Act.\n\nI hereby declare that the information provided above is true and correct to the best of my knowledge.\n\nSignature: ______\nDate: ______",
            
            "rti_application": "## APPLICATION UNDER RTI ACT, 2005\n\nTo,\nThe Public Information Officer\n[Department Name]\n\nSubject: Information under RTI Act, 2005\n\nSir/Madam,\n\nKindly provide the following information regarding [Subject Matter]:\n\n1. [Question 1]\n2. [Question 2]\n\nI have enclosed the application fee of Rs. 10.\n\nAddress for correspondence: [Address]\n\nDate: [Date]\nApplicant Signature: _______"
        }

        template = templates.get(draft_type, "Generate a formal legal document for the user.")

        system_prompt = (
            "You are an Indian Legal Drafting Assistant. YOUR GOAL is to fill the provided template accurately.\n\n"
            f"TEMPLATE STRUCTURE (Reference Only):\n{template}\n\n"
            "CRITICAL RULES:\n"
            "1. NO MARKDOWN BOLDING: Do NOT use **bold** or *italic* syntax. Use plain text.\n"
            "2. ADAPTIVE LENGTH: If user provides detailed input, EXPAND the draft. Add extra paragraphs/points to cover all user details. Do NOT truncate user info to fit the template.\n"
            "3. REPLACE PLACEHOLDERS: Replace [Name], [Date] with actual info. Infer missing info reasonably.\n"
            "4. OUTPUT: Return ONLY the filled document content.\n"
            "5. DISCLAIMER: Add a standard disclaimer at the very bottom.\n\n"
        )

        if language == 'hi':
            system_prompt += (
                "CRITICAL HINDI RULES:\n"
                "1. TRANSLATE THE ENTIRE DOCUMENT TO HINDI (Devanagari).\n"
                "2. USE CORRECT LEGAL TERMINOLOGY (Glossary below):\n"
                "   - 'Legal Notice' -> 'विधिक सूचना' (Vidhik Suchna)\n"
                "   - 'Demand' -> 'मांग' (Maang) or 'अपेक्षा' (Apeksha)\n"
                "   - 'Cause of Action' -> 'वाद का कारण' (Vaad ka Kaaran)\n"
                "   - 'Rent Agreement' -> 'किरायानामा' (Kirayanama)\n"
                "   - 'Affidavit' -> 'शपथ पत्र' (Shapath Patra)\n"
                "3. Translate Headers properly (e.g., '1. Purpose' -> '1. उद्देश्य').\n"
                "4. ONLY keep specific Act Names/Section Numbers in English (e.g., 'Section 420 IPC').\n"
                "5. Do NOT use Hinglish. Ensure full grammatical correctness.\n"
            )
        else:
            system_prompt += "Respond in formal English."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Details for draft:\n{details}"}
        ]

        try:
            # Using model_simple (Mistral) for better reliability during demo
            return self._call_llm(messages, max_tokens=2000, model_override=self.model_simple)
        except Exception as e:
            print(f"[RAGEngine] Drafting failed: {e}")
            return f"Error: Could not generate draft. Reason: {str(e)}"
