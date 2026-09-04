import json
import csv
import os

# Define the curated high-impact mappings
# Format: IPC Section (key) -> { BNS Section, Titles, Summary, Change Type }
CURATED_MAPPINGS = [
    {
        "ipc_section": "302",
        "ipc_title": "Punishment for murder",
        "bns_section": "103",
        "bns_title": "Punishment for murder",
        "change_type": "Modified",
        "summary_of_change": "Retains death or life imprisonment; fine is now mandatory. Language made gender-neutral."
    },
    {
        "ipc_section": "307",
        "ipc_title": "Attempt to murder",
        "bns_section": "109",
        "bns_title": "Attempt to murder",
        "change_type": "Modified",
        "summary_of_change": "Similar provisions. Life imprisonment remains for causing hurt. Classification of 'offender under life sentence' retained."
    },
    {
        "ipc_section": "379",
        "ipc_title": "Punishment for theft",
        "bns_section": "303",
        "bns_title": "Theft",
        "change_type": "Expanded",
        "summary_of_change": "Community service added as a potential punishment for first-time offenders (snatching) if value is low and property returned."
    },
    {
        "ipc_section": "376",
        "ipc_title": "Punishment for rape",
        "bns_section": "64",
        "bns_title": "Punishment for rape",
        "change_type": "Modified",
        "summary_of_change": "Minimum sentence increased in certain aggravated circumstances. Community service not applicable here."
    },
    {
        "ipc_section": "420",
        "ipc_title": "Cheating and dishonestly inducing delivery of property",
        "bns_section": "318",
        "bns_title": "Cheating",
        "change_type": "Restructured",
        "summary_of_change": "Consolidated under Section 318. 'Dishonestly' and 'Fraudulently' definitions refined in BNS."
    },
    {
        "ipc_section": "124A",
        "ipc_title": "Sedition",
        "bns_section": "152",
        "bns_title": "Act endangering sovereignty, unity and integrity of India",
        "change_type": "Replaced",
        "summary_of_change": "'Sedition' term removed. Focus shifts to acts endangering sovereignty/integrity. Punishment can extend to life imprisonment."
    },
    {
        "ipc_section": "141",
        "ipc_title": "Unlawful assembly",
        "bns_section": "189",
        "bns_title": "Unlawful assembly",
        "change_type": "Modified",
        "summary_of_change": "Similar definition. Punishment structure streamlined."
    },
    {
        "ipc_section": "499",
        "ipc_title": "Defamation",
        "bns_section": "356",
        "bns_title": "Defamation",
        "change_type": "Modified",
        "summary_of_change": "Community service introduced as a punishment option."
    },
    {
        "ipc_section": "395",
        "ipc_title": "Punishment for dacoity",
        "bns_section": "310",
        "bns_title": "Dacoity",
        "change_type": "Same",
        "summary_of_change": "Retains life imprisonment or rigorous imprisonment up to 10 years."
    },
     {
        "ipc_section": "509",
        "ipc_title": "Word, gesture or act intended to insult the modesty of a woman",
        "bns_section": "79",
        "bns_title": "Word, gesture or act intended to insult the modesty of a woman",
        "change_type": "Modified",
        "summary_of_change": "Included new digital/electronic means of communication."
    }
]

def load_ipc_text(csv_path):
    ipc_data = {}
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return ipc_data
        
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Format in CSV is likely "IPC_302"
            section_id = row.get('Section', '').replace('IPC_', '')
            ipc_data[section_id] = row.get('Description', '')
    return ipc_data

def load_bns_text_from_json(json_path):
    bns_data = {}
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return bns_data

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            # BNS number in JSON
            bns_num = item.get('bns', '')
            if bns_num:
                bns_data[bns_num] = item.get('text_bns', '')
    return bns_data

def main():
    base_dir = r"d:/HACATHONS/RUBIX TSEC/legal-compass-ai-main"
    ipc_csv_path = os.path.join(base_dir, "datasets resources/ipc_sections.csv")
    bns_json_path = os.path.join(base_dir, "src/data/ipc_bns.json")
    output_path = os.path.join(base_dir, "src/data/key_bns_mappings.json")

    print("Loading IPC data...")
    ipc_texts = load_ipc_text(ipc_csv_path)
    
    print("Loading BNS data...")
    bns_texts = load_bns_text_from_json(bns_json_path)

    final_data = []

    for mapping in CURATED_MAPPINGS:
        ipc_sec = mapping['ipc_section']
        bns_sec = mapping['bns_section']
        
        # Get Text
        text_ipc = ipc_texts.get(ipc_sec, "Text not found in dataset.")
        text_bns = bns_texts.get(bns_sec, "Text not found in dataset.")

        # Construct payload
        entry = mapping.copy()
        entry['text_ipc'] = text_ipc
        entry['text_bns'] = text_bns
        
        final_data.append(entry)

    print(f"Writing {len(final_data)} entries to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
    
    print("Done.")

if __name__ == "__main__":
    main()
