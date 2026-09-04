"""
Advanced Text Processing Module for Legal Documents
Implements 12-stage text cleaning pipeline, language detection, and multi-modal PDF extraction
"""

import re
import unicodedata
from typing import Tuple, Optional
import io

class TextProcessor:
    """Handles advanced text extraction and cleaning for legal documents"""
    
    def __init__(self):
        # Language detector disabled in favor of lightweight regex check
        print("[TextProcessor] Lightweight language detection initialized")
    
    def detect_language(self, text: str) -> str:
        """
        Detect language of text (English or Hindi) using lightweight character check
        """
        if not text or not text.strip():
            return 'en'
        
        # Check for Devanagari characters (Hindi)
        if re.search(r'[\u0900-\u097F]', text):
            return 'hi'
        return 'en'
    
    def extract_text_from_pdf(self, file_content: bytes, filename: str, max_ocr_pages: int = 100) -> Tuple[str, str]:
        """
        Advanced multi-modal PDF text extraction with automatic fallback
        
        Args:
            file_content: PDF file bytes
            filename: Name of the file
            max_ocr_pages: Maximum pages to process with OCR (default: 100)
            
        Returns:
            Tuple of (extracted_text, extraction_method)
        """
        try:
            print(f"[TextProcessor] Processing PDF: {filename.encode('utf-8', 'replace').decode('utf-8')} ({len(file_content)} bytes)")
        except Exception:
            print(f"[TextProcessor] Processing PDF: (filename encoding error) ({len(file_content)} bytes)")
        
        # Try PyMuPDF first (fast, for digital PDFs)
        try:
            import fitz  # PyMuPDF
            full_text = ""
            
            with fitz.open(stream=file_content, filetype="pdf") as pdf:
                total_pages = len(pdf)
                print(f"[TextProcessor] PDF has {total_pages} pages. Trying native extraction...")
                
                for page_num in range(total_pages):
                    page = pdf[page_num]
                    text = page.get_text()
                    if text:
                        full_text += text + "\n"
                
                # Check if we got meaningful text (at least 100 chars)
                if len(full_text.strip()) > 100:
                    print(f"[TextProcessor] Native extraction successful ({len(full_text)} chars)")
                    return full_text, "pymupdf"
                else:
                    print(f"[TextProcessor] Native extraction yielded insufficient text. Falling back to OCR...")
        
        except Exception as e:
            print(f"[TextProcessor] PyMuPDF failed: {e}. Trying fallback...")
        

        # Fallback to pypdf (Pure Python, very reliable)
        try:
            import pypdf
            full_text = ""
            print(f"[TextProcessor] Trying pypdf extraction...")
            
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
            for page in pdf_reader.pages:
                full_text += page.extract_text() + "\n"
            
            if len(full_text.strip()) > 50:
                 print(f"[TextProcessor] pypdf extraction successful ({len(full_text)} chars)")
                 return full_text, "pypdf"
        except ImportError:
            print("[TextProcessor] pypdf not installed. Skipping.")
        except Exception as e:
             print(f"[TextProcessor] pypdf extraction failed: {e}")


        # Last resort: OCR with Pytesseract
        try:
            import pytesseract
            from pdf2image import convert_from_bytes
            
            print(f"[TextProcessor] Attempting OCR extraction (max {max_ocr_pages} pages)...")
            
            # Convert PDF to images (limit pages for performance)
            try:
                images = convert_from_bytes(file_content, dpi=300, first_page=1, last_page=max_ocr_pages)
            except Exception as poppler_error:
                print(f"[TextProcessor] ⚠️ OCR Failed: {poppler_error}. Is Poppler installed and in PATH?")
                return f"Error: Could not process PDF. Please install Poppler or ensure the PDF is text-readable.", "failed"

            full_text = ""
            for i, image in enumerate(images):
                print(f"[TextProcessor] OCR processing page {i+1}/{len(images)}...")
                text = pytesseract.image_to_string(image, lang='eng+hin')
                full_text += text + "\n"
            
            if len(full_text.strip()) > 50:
                print(f"[TextProcessor] OCR extraction successful ({len(full_text)} chars)")
                return full_text, "ocr"
            else:
                return "Error: OCR extraction yielded no meaningful text.", "failed"
        
        except ImportError:
            print("[TextProcessor] ⚠️ OCR dependencies not installed (pytesseract/pdf2image)")
            return "Error: OCR not available. Install pytesseract and pdf2image.", "failed"
        except Exception as e:
            print(f"[TextProcessor] OCR failed: {e}")
            return f"Error: All extraction methods failed. {str(e)}", "failed"
    
    def clean_text(self, text: str) -> str:
        """
        12-stage text cleaning pipeline for legal documents
        
        Stages:
        1. Unicode normalization (NFC)
        2. PDF artifact removal (cid:NN patterns)
        3. Hyphenation repair
        4. Sentence reconstruction across line breaks
        5. Devanagari-Latin script isolation
        6. Token-level gibberish filtering
        7. Section marker injection
        8. Phrase deduplication
        9. Whitespace normalization
        10. Special character cleanup
        11. Legal formatting preservation
        12. Final trimming
        """
        if not text:
            return ""
        
        # Stage 1: Unicode normalization (NFC)
        text = unicodedata.normalize('NFC', text)
        
        # Stage 2: PDF artifact removal
        text = re.sub(r'\(cid:\d+\)', '', text)  # Remove (cid:NN) patterns
        text = re.sub(r'[^\S\n]{3,}', ' ', text)  # Remove excessive spaces (preserve newlines)
        
        # Stage 3: Hyphenation repair (rejoin words split across lines)
        text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
        
        # Stage 4: Sentence reconstruction across line breaks
        # Join lines that don't end with sentence terminators
        text = re.sub(r'([^\.\!\?\n])\n([a-z])', r'\1 \2', text)
        
        # Stage 5: Devanagari-Latin script isolation
        # Remove mixed-script artifacts (e.g., stray Latin chars in Hindi text)
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            # Check if line is predominantly Devanagari
            devanagari_chars = len(re.findall(r'[\u0900-\u097F]', line))
            latin_chars = len(re.findall(r'[a-zA-Z]', line))
            
            # If predominantly Devanagari, remove isolated Latin chars
            if devanagari_chars > latin_chars * 2:
                line = re.sub(r'\b[a-zA-Z]{1,2}\b', '', line)
            
            cleaned_lines.append(line)
        text = '\n'.join(cleaned_lines)
        
        # Stage 6: Token-level gibberish filtering
        # Remove tokens with very low alphanumeric ratio
        words = text.split()
        filtered_words = []
        for word in words:
            if len(word) < 2:
                filtered_words.append(word)
                continue
            
            alnum_count = sum(c.isalnum() for c in word)
            if alnum_count / len(word) > 0.5:  # At least 50% alphanumeric
                filtered_words.append(word)
        text = ' '.join(filtered_words)
        
        # Stage 7: Section marker injection
        # Add [SEC_N] markers for hierarchical structure
        text = re.sub(r'\b(Section\s+\d+[A-Z]?)\b', r'[SEC] \1', text, flags=re.IGNORECASE)
        text = re.sub(r'\b(Article\s+\d+[A-Z]?)\b', r'[ART] \1', text, flags=re.IGNORECASE)
        
        # Stage 8: Phrase deduplication (remove OCR repetition errors)
        # Remove consecutive duplicate phrases (3+ words)
        text = re.sub(r'\b(\w+\s+\w+\s+\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)
        
        # Stage 9: Whitespace normalization
        text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces to single
        text = re.sub(r'\n{3,}', '\n\n', text)  # Multiple newlines to double
        
        # Stage 10: Special character cleanup
        # Remove control characters except newlines and tabs
        text = ''.join(char for char in text if char == '\n' or char == '\t' or not unicodedata.category(char).startswith('C'))
        
        # Stage 11: Legal formatting preservation
        # Ensure proper spacing around legal markers
        text = re.sub(r'(\d+)\s*\.\s*(\d+)', r'\1.\2', text)  # Fix section numbering
        text = re.sub(r'([A-Z]{2,})\s+([A-Z]{2,})', r'\1 \2', text)  # Preserve acronyms
        
        # Stage 12: Final trimming
        text = text.strip()
        
        return text
    
    def extract_metadata(self, text: str, filename: str) -> dict:
        """
        Extract rich metadata from legal document text
        
        Args:
            text: Cleaned document text
            filename: Original filename
            
        Returns:
            Dictionary with extracted metadata
        """
        metadata = {
            "source": filename,
            "document_length": len(text),
            "keywords": [],
            "act_year": None,
            "act_number": None,
            "dates": [],
            "sections": []
        }
        
        # Extract act year from filename (multiple patterns)
        year_patterns = [
            r'(\d{4})',  # Simple 4-digit year
            r'Act[_\s]+(\d{4})',  # "Act 2023"
            r'(\d{4})[_\s]+Act',  # "2023 Act"
        ]
        for pattern in year_patterns:
            match = re.search(pattern, filename)
            if match:
                year = int(match.group(1))
                if 1800 <= year <= 2100:  # Sanity check
                    metadata["act_year"] = year
                    break
        
        # Extract act number from content
        act_num_match = re.search(r'Act\s+No\.?\s*(\d+)', text, re.IGNORECASE)
        if act_num_match:
            metadata["act_number"] = act_num_match.group(1)
        
        # Extract keywords
        keywords = ["amendment", "section", "court", "penalty", "punishment", 
                   "offense", "offence", "criminal", "civil", "jurisdiction",
                   "appeal", "judgment", "verdict", "sentence"]
        found_keywords = []
        text_lower = text.lower()
        for keyword in keywords:
            if keyword in text_lower:
                found_keywords.append(keyword)
        metadata["keywords"] = found_keywords[:10]  # Limit to 10
        
        # Extract dates (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{2}-\d{2}-\d{4}'
        ]
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text))
        metadata["dates"] = list(set(dates))[:5]  # Unique, limit to 5
        
        # Extract section references
        sections = re.findall(r'Section\s+(\d+[A-Z]?)', text, re.IGNORECASE)
        metadata["sections"] = list(set(sections))[:20]  # Unique, limit to 20
        
        return metadata
