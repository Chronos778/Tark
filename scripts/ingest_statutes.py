import os
import csv
import json
import re

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(BASE_DIR, "rag_service", "data", "ipc_bns_mapping.json")
BNS_CSV = os.path.join(BASE_DIR, "datasets resources", "bns_sections.csv")
IPC_CSV = os.path.join(BASE_DIR, "datasets resources", "ipc_sections.csv") # Optional
print(f"DEBUG: Checking IPC at: {os.path.abspath(IPC_CSV)}")

# Curated Manual Mappings (The "Holy Grail" links)
# We use this to bridge the gap between the two distinct datasets
MANUAL_MAPPINGS = {
    "103": {"ipc": "302", "topic": "Murder"},
    "105": {"ipc": "304", "topic": "Culpable Homicide"},
    "303(2)": {"ipc": "379", "topic": "Theft"},
    "318(4)": {"ipc": "420", "topic": "Cheating"},
    "356(2)": {"ipc": "500", "topic": "Defamation"},
    "64": {"ipc": "376", "topic": "Rape"},
    "74": {"ipc": "354", "topic": "Assault on Women"},
    "152": {"ipc": "124A", "topic": "Sedition (Replaced)"},
    "69": {"ipc": "90", "topic": "Romeo Juliet Law (Deceitful Cohabitation)"} 
}

def clean_text(text):
    if not text: return ""
    return text.replace("span@", "").strip()

def ingest_bns():
    print(f"🚀 Starting Statute Ingestion...")
    
    entries = []
    
    # 1. Ingest BNS (The New Law) - CRITICAL
    if os.path.exists(BNS_CSV):
        print(f"📄 Found BNS CSV: {BNS_CSV}")
        with open(BNS_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                section_raw = row.get('Section', '').strip()
                desc_raw = row.get('Description', '')
                
                # Check if this BNS section has a known mapping
                mapping = MANUAL_MAPPINGS.get(section_raw)
                
                entry = {
                    "topic": mapping['topic'] if mapping else row.get('Section _name', 'BNS Section'),
                    "bns": section_raw,
                    "ipc": mapping['ipc'] if mapping else None, # Link if we know it
                    "description": row.get('Section _name', ''),
                    "text_bns": clean_text(desc_raw),
                    "text_ipc": "Pending IPC Dataset Ingestion" if mapping else None
                }
                
                if entry['bns'] == '103':
                    ipc_ref = entry['ipc'] if entry['ipc'] else "N/A"
                    # ipc_key and ipc_lookup are not available at this stage of processing
                    # ipc_key = f"IPC_{ipc_ref}"
                    print(f"DEBUG LOOP 103: BNS Section '{entry['bns']}', Mapped IPC Ref '{ipc_ref}'")
                    # print(f"DEBUG LOOP 103: Key in Lookup? {ipc_key in ipc_lookup}") # ipc_lookup not yet defined
                
                entries.append(entry)
        print(f"✅ Ingested {len(entries)} BNS sections.")
    else:
        print(f"❌ BNS CSV not found at {BNS_CSV}")

    # 2. Ingest IPC (The Old Law) - OPTIONAL but RECOMMENDED
    # If the user provides the IPC CSV, we can look up the "Pending" text
    if os.path.exists(IPC_CSV):
        print(f"📄 Found IPC CSV: {IPC_CSV}")
        ipc_lookup = {}
        with open(IPC_CSV, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sec = row.get('Section', '').strip()
                ipc_lookup[sec] = row.get('Description', '') + " " + row.get('Offense', '')
        print(f"DEBUG: IPC Lookup Size: {len(ipc_lookup)}")
        print(f"DEBUG: Check IPC_302: {ipc_lookup.get('IPC_302', 'NOT FOUND')[:50]}...")

        # Enrich existing entries
        enriched = 0
        for entry in entries:
            ipc_ref = entry['ipc']
            if ipc_ref:
                ipc_key = f"IPC_{ipc_ref}"
                if ipc_key in ipc_lookup:
                    entry['text_ipc'] = ipc_lookup[ipc_key]
                    enriched += 1
                else:
                    if entry['text_ipc'] is None:
                        entry['text_ipc'] = "Pending IPC Dataset Ingestion"
        print(f"✨ Enriched {enriched} entries with full IPC text.")
    else:
        print(f"⚠️ IPC CSV not found. Text for old laws will be generic.")

    # 3. Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
        
    print(f"🎉 Final Statute Dataset saved to: {OUTPUT_FILE}")
    print(f"Total Entries: {len(entries)}")

if __name__ == "__main__":
    ingest_bns()
