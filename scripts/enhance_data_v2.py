
import json
import csv
import re
import os

def normalize(text):
    if not text: return ""
    return text.lower().strip().replace(".", "").replace("  ", " ")

def clean_ipc_text(raw_text):
    """
    Extracts the legal text from the verbose CSV description.
    Removes headers like "Description of IPC Section..."
    Removes trailing "IPC ... in Simple Words" sections.
    Removes "According to section ...," prefixes.
    """
    if not isinstance(raw_text, str):
        return None
    
    text = raw_text.strip()
    
    # 1. Remove "Description of IPC Section X" from start
    text = re.sub(r"^Description of IPC Section \w+\s*", "", text, flags=re.IGNORECASE)
    
    # 2. Remove "IPC X in Simple Words" and everything after it
    # This assumes the simple explanation is always at the end
    text = re.sub(r"IPC \w+ in Simple Words.*", "", text, flags=re.IGNORECASE | re.DOTALL)
    
    # 3. Remove "According to section X of Indian penal code," prefix
    text = re.sub(r"^According to section \d+[A-Z]* of Indian penal code,?\s*", "", text, flags=re.IGNORECASE)
    
    return text.strip()

def clean_bns_text(raw_text):
    """
    Cleans BNS text to balance it with IPC text.
    Removes "Illustration" blocks which are often lengthy and supplementary.
    """
    if not isinstance(raw_text, str):
        return None
    
    text = raw_text.strip()
    
    # Remove Illustrations and everything following them
    # Pattern matches "Illustration" or "Illustrations" followed by optional punctuation/chars and then the rest of the string
    # Using DOTALL so . matches newlines
    text = re.sub(r"(Illustration|Illustrations)[\.\s].*", "", text, flags=re.IGNORECASE | re.DOTALL)
    
    return text.strip()

def main():
    base_dir = "d:/HACATHONS/RUBIX TSEC/legal-compass-ai-main"
    ipc_csv_path = os.path.join(base_dir, "datasets resources/ipc_sections.csv")
    bns_csv_path = os.path.join(base_dir, "datasets resources/bns_sections.csv")
    mapping_json_path = os.path.join(base_dir, "rag_service/data/ipc_bns_mapping.json")
    curated_json_path = os.path.join(base_dir, "src/data/key_bns_mappings.json")
    output_path = os.path.join(base_dir, "src/data/ipc_bns.json")

    print("Loading datasets...")

    # 1. Load IPC Data (ID -> {text, offense}) and (NormalizedOffense -> ID)
    ipc_data = {}
    ipc_titles_map = {}
    
    with open(ipc_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sec_id = row.get('Section', '').strip().replace("IPC_", "")
            offense = row.get('Offense', '')
            raw_desc = row.get('Description', '')
            clean_text = clean_ipc_text(raw_desc)
            
            if sec_id:
                ipc_data[sec_id] = {
                    "text": clean_text,
                    "offense": offense
                }
                
                # Create map for title matching
                if offense:
                    norm_title = normalize(offense)
                    if norm_title:
                        ipc_titles_map[norm_title] = sec_id

    # 2. Load BNS Data (ID -> {text, title})
    # We use this to supplement the JSON if needed, or primarily for the Title
    bns_csv_data = {}
    with open(bns_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sec_id = row.get('Section', '').strip()
            title = row.get('Section _name', '')
            if sec_id:
                bns_csv_data[sec_id] = {
                    "title": title
                }

    # 3. Load Base Mapping JSON
    with open(mapping_json_path, 'r', encoding='utf-8') as f:
        base_mapping = json.load(f)

    # 4. Load Curated Mappings (Highest Priority)
    curated_map = {}
    if os.path.exists(curated_json_path):
        with open(curated_json_path, 'r', encoding='utf-8') as f:
            curated_list = json.load(f)
            for item in curated_list:
                bns_id = str(item.get('bns_section'))
                curated_map[bns_id] = item

    # 5. Merge and Build Final List
    final_list = []
    
    # Track used BNS IDs to avoid duplicates if we iterate multiple sources
    # But here we iterate the base_mapping as primary source of BNS structure
    
    for item in base_mapping:
        bns_num = str(item.get('bns'))
        bns_text = clean_bns_text(item.get('text_bns'))
        
        # Default IPC info
        ipc_num = str(item.get('ipc')) if item.get('ipc') else None
        ipc_text = None
        
        # Strategy 1: Check Curated (Overwrite everything if found)
        if bns_num in curated_map:
            c_item = curated_map[bns_num]
            ipc_num = str(c_item.get('ipc_section'))
            ipc_text = c_item.get('text_ipc')
            # Use curated text for BNS too if available and better?
            # User said "bns is very long", curated might be cleaner?
            # But let's stick to the mapping file text for BNS as it's full text usually.
            # actually curated has full text too.
            if c_item.get('text_bns'):
               bns_text = c_item.get('text_bns')
            
        elif not ipc_num:
            # Strategy 2: Title Match
            # Get BNS title from CSV if possible
            bns_title = item.get('topic') # JSON has 'topic'
            # Or use CSV title if 'topic' is vague? 
            # JSON topic: "Punishment for murder" 
            # CSV title: "Punishment for murder"
            # Let's try JSON topic first
            if bns_title:
                norm_topic = normalize(bns_title)
                if norm_topic in ipc_titles_map:
                    ipc_num = ipc_titles_map[norm_topic]
            
            # If still no match, try BNS CSV title
            if not ipc_num and bns_num in bns_csv_data:
                csv_title = bns_csv_data[bns_num]['title']
                norm_csv = normalize(csv_title)
                if norm_csv in ipc_titles_map:
                    ipc_num = ipc_titles_map[norm_csv]

        # Fetch IPC text if we have an ID but no text yet
        if ipc_num and not ipc_text:
            if ipc_num in ipc_data:
                ipc_text = ipc_data[ipc_num]['text']

        # Construct Final Item
        path_item = {
            "topic": item.get('topic'),
            "bns": bns_num,
            "ipc": ipc_num,
            "text_bns": bns_text,
            "text_ipc": ipc_text
        }
        final_list.append(path_item)

    # 6. Save
    mapped_count = sum(1 for x in final_list if x['ipc'])
    print(f"Saving {len(final_list)} items. items with IPC mapping: {mapped_count}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=2)

if __name__ == "__main__":
    main()
