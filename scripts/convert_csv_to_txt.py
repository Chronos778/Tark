import csv
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "datasets resources", "ipc_sections.csv")
TXT_PATH = os.path.join(BASE_DIR, "datasets resources", "ipc.txt")

def convert_csv_to_txt():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    print(f"Converting {CSV_PATH} to {TXT_PATH}...")
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        with open(TXT_PATH, 'w', encoding='utf-8') as out:
            count = 0
            for row in reader:
                section = row.get('Section', '').replace('_', ' ')
                offense = row.get('Offense', '')
                punishment = row.get('Punishment', '')
                description = row.get('Description', '')

                text_block = f"Section: {section}\n"
                text_block += f"Offense: {offense}\n"
                text_block += f"Punishment: {punishment}\n"
                text_block += f"Description: {description}\n"
                text_block += "-" * 50 + "\n"
                
                out.write(text_block)
                count += 1
            
            print(f"Successfully converted {count} sections to {TXT_PATH}")

if __name__ == "__main__":
    convert_csv_to_txt()
