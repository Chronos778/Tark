
import csv
import json
import os

def normalize(text):
    if not text: return ""
    return text.lower().strip().replace(".", "").replace("  ", " ")

def main():
    base_dir = "d:/HACATHONS/RUBIX TSEC/legal-compass-ai-main"
    ipc_csv = os.path.join(base_dir, "datasets resources/ipc_sections.csv")
    bns_csv = os.path.join(base_dir, "datasets resources/bns_sections.csv")
    mapping_json = os.path.join(base_dir, "rag_service/data/ipc_bns_mapping.json")

    # 1. Check JSON for existing mappings
    with open(mapping_json, 'r', encoding='utf-8') as f:
        m_data = json.load(f)
    
    with_ipc = [x for x in m_data if x.get('ipc')]
    print(f"JSON Total items: {len(m_data)}")
    print(f"JSON Items with IPC ID: {len(with_ipc)}")

    # 2. Check BNS CSV for 'IPC' mentions
    print("\nScanning BNS CSV for 'IPC' mentions...")
    bns_ipc_mentions = 0
    bns_titles = {}
    with open(bns_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            desc = row.get('Description', '')
            section = row.get('Section', '')
            title = row.get('Section _name', '') # Check header name in previous view
            if 'IPC' in desc or 'Indian Penal Code' in desc:
                bns_ipc_mentions += 1
            
            if section:
                bns_titles[section] = title

    print(f"Rows in BNS CSV with 'IPC' in description: {bns_ipc_mentions}")

    # 3. Load IPC Titles
    ipc_titles = {}
    with open(ipc_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sec_id = row.get('Section', '').replace("IPC_", "")
            # Title is often in 'My offense' or 'Description'? 
            # Header: Description,Offense,Punishment,Section
            # Offense seems to be the title-like field.
            offense = row.get('Offense', '')
            if sec_id:
                ipc_titles[sec_id] = offense

    # 4. Attempt Title Matching
    print("\nAttempting basic Title matching (BNS Section Name <-> IPC Offense)...")
    matches = 0
    for bns_sec, bns_title in bns_titles.items():
        norm_bns = normalize(bns_title)
        if not norm_bns: continue
        
        # Try to find exactly one IPC with same normalized offense title
        # This is n^2 greedy but okay for small datasets
        for ipc_sec, ipc_offense in ipc_titles.items():
            norm_ipc = normalize(ipc_offense)
            if norm_ipc == norm_bns:
                matches += 1
                # print(f"Match: BNS {bns_sec} ('{bns_title}') <-> IPC {ipc_sec} ('{ipc_offense}')")
                break
    
    print(f"\nTotal potential matches found via Title: {matches}")

if __name__ == "__main__":
    main()
