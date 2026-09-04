import os
import json
import random
from typing import List, Dict, Any
import io

try:
    from pypdf import PdfReader
except ImportError:
    print("Error: 'pypdf' is not installed. Please run: pip install pypdf")
    exit(1)

# --- CONFIGURATION ---
# UPDATE THIS PATH to where you unzipped the Kaggle Dataset
# Example: "C:/Downloads/legal-dataset-sc-judgments-india/1950_2024"
SOURCE_DIR = r"dataset" 

# Resolve paths relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(BASE_DIR, "rag_service", "data", "golden_dataset.json")
# SOURCE_DIR is relative to CWD if running from root, or absolute
SOURCE_DIR = os.path.join(BASE_DIR, "supreme_court_judgments")
TARGET_COUNT = 1000

# Keywords to identify "Important" cases and classify them
TOPIC_KEYWORDS = {
    "Murder": ["Section 302", "murder", "culpable homicide", "death penalty"],
    "Theft": ["Section 378", "theft", "stolen property"],
    "Cheating": ["Section 420", "cheating", "dishonestly inducing"],
    "Defamation": ["Section 499", "defamation", "reputation"],
    "Assault": ["Section 354", "assault", "outrage modesty"],
    "Constitution": ["Constitution Bench", "Article 21", "Fundamental Rights", "Public Interest Litigation"]
}

def extract_text_from_pdf(filepath: str) -> str:
    """Extracts text from a single PDF file."""
    text = ""
    try:
        reader = PdfReader(filepath)
        # Limit to first 5 pages for speed and relevance (summaries are usually at start/end)
        for i, page in enumerate(reader.pages[:5]): 
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    except Exception as e:
        print(f"Skipping {filepath}: {e}")
    return text

def analyze_and_format(filename: str, text: str) -> Dict[str, Any] | None:
    """
    Analyzes text to see if it matches our topics and formats it for golden_dataset.json.
    """
    text_lower = text.lower()
    
    # Check for match
    matched_topic = None
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(k.lower() in text_lower for k in keywords):
            matched_topic = topic
            break
            
    if not matched_topic:
        return None

    # Heuristic Extraction (Mocking 'Intelligent' Parsing)
    # in a real scenario, an LLM would do this breakdown
    
    return {
        "keywords": [matched_topic.lower(), "supreme court", "judgment", filename],
        "ipc": {
            "section": f"Related to {matched_topic} (IPC)",
            "text": f"Extracted from judgment: {filename}"
        },
        "bns": {
            "section": "BNS Equivalent",
            "text": "The new Sanhita consolidates these provisions."
        },
        "hindi_response": "यह मामला सर्वोच्च न्यायालय के महत्वपूर्ण निर्णयों में से एक है।",
        "case_laws": [
            { 
                "title": filename.replace('.pdf', ''), 
                "summary": f"A landmark case regarding {matched_topic}. The court held verifyable observations on the matter." 
            }
        ],
        "arguments": {
            "for": ["The prosecution proved the guilt beyond reasonable doubt.", "Evidence corroborates the sequence of events."],
            "against": ["The defense argued lack of direct evidence.", "Procedural lapses in investigation were cited."]
        },
        "neutral_analysis": {
            "factors": [f"**Nature of Offense**: {matched_topic}", "**Evidence**: Circumstantial vs Direct"],
            "interpretations": ["**Precedent**: This judgment sets a precedent for similar future cases."]
        }
    }

def main():
    print(f"🚀 Starting Ingestion from: {SOURCE_DIR}")
    
    if not os.path.exists(SOURCE_DIR) or SOURCE_DIR == "path/to/your/downloaded/pdfs":
        print(f"❌ Error: Please edit the script to point to the actual PDF folder.\nCurrent path: {SOURCE_DIR}")
        return

    extracted_cases = []
    files_processed = 0
    
    # Walk through year directories
    for root, dirs, files in os.walk(SOURCE_DIR):
        pdf_files = [f for f in files if f.lower().endswith('.pdf')]
        
        # Shuffle to get a mix of random years/cases
        random.shuffle(pdf_files)
        
        for file in pdf_files:
            if len(extracted_cases) >= TARGET_COUNT:
                break
                
            filepath = os.path.join(root, file)
            print(f"Processing: {file}...")
            
            text = extract_text_from_pdf(filepath)
            if len(text) < 100: # Skip empty/scanned image PDFs
                continue
                
            entry = analyze_and_format(file, text)
            if entry:
                extracted_cases.append(entry)
                print(f"✅ Added Case [{len(extracted_cases)}/{TARGET_COUNT}]: {file} ({entry['keywords'][0]})")
            
            files_processed += 1
            if files_processed % 50 == 0:
                print(f"ℹ️ Scanned {files_processed} files...")

        if len(extracted_cases) >= TARGET_COUNT:
            break
            
    # Load existing data to append
    try:
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except FileNotFoundError:
        existing_data = []

    # Merge
    print(f"\n💾 Merging {len(extracted_cases)} new cases...")
    final_data = existing_data + extracted_cases
    
    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
        
    print(f"🎉 Done! Dataset expanded to {len(final_data)} entries.")
    print(f"File saved at: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
