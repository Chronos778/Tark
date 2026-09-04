"""
Script to populate multi-jurisdictional legal dataset
Processes IT Act, Companies Act, Consumer Protection Act, Motor Vehicles Act
"""

import json
import re
import os
import requests
from bs4 import BeautifulSoup

BASE_DIR = "d:/HACATHONS/RUBIX TSEC/legal-compass-ai-main"
DATA_DIR = os.path.join(BASE_DIR, "rag_service/data")
DATASETS_DIR = os.path.join(BASE_DIR, "datasets resources")

def parse_it_act():
    """Parse IT Act 2000 from text file"""
    print("📖 Processing IT Act 2000...")
    
    it_file = os.path.join(DATASETS_DIR, "it.txt")
    with open(it_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    sections = []
    
    # Split by section numbers (pattern: number followed by dot)
    section_pattern = r'(\d+[A-Z]?\.\s+[^\n]+?)\.—'
    matches = re.finditer(section_pattern, content, re.MULTILINE)
    
    current_section = None
    for match in matches:
        section_num_title = match.group(1).strip()
        # Extract section number
        sec_num_match = re.match(r'(\d+[A-Z]?)\.\s+(.+)', section_num_title)
        if sec_num_match:
            section_num = sec_num_match.group(1)
            title = sec_num_match.group(2)
            
            # Find the content (text after the section title until next section)
            start_pos = match.end()
            # Simple extraction - will need refinement
            content_chunk = content[start_pos:start_pos+500]  # Get next 500 chars
            
            sections.append({
                "act": "IT Act 2000",
                "section": f"Section {section_num}",
                "title": title,
                "description": content_chunk.strip()[:300]  # Limit to 300 chars
            })
    
    print(f"✅ Extracted {len(sections)} sections from IT Act 2000")
    return sections

def fetch_companies_act():
    """Fetch Companies Act 2013 sections from ca2013.com"""
    print("📖 Processing Companies Act 2013...")
    
    url = "https://ca2013.com/sections/"
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        sections = []
        # This is a placeholder - actual scraping logic depends on website structure
        print("⚠️ Companies Act: Manual parsing required (website structure)")
        
        # For demo, create a few key sections manually
        key_sections = [
            {"section": "Section 2(20)", "title": "Company", "description": "Definition of company under the Companies Act 2013"},
            {"section": "Section 3", "title": "Formation of company", "description": "Provisions for formation of a company"},
            {"section": "Section 8", "title": "Formation of companies with charitable objects", "description": "Companies formed for promotion of commerce, art, science, sports, education, research, social welfare, religion, charity, protection of environment"},
            {"section": "Section 149", "title": "Company to have Board of Directors", "description": "Every company shall have a Board of Directors consisting of individuals as directors"},
        ]
        
        for sec in key_sections:
            sections.append({
                "act": "Companies Act 2013",
                **sec
            })
        
        print(f"✅ Added {len(sections)} key sections from Companies Act 2013")
        return sections
        
    except Exception as e:
        print(f"⚠️ Error fetching Companies Act: {e}")
        return []

def fetch_consumer_protection_act():
    """Fetch Consumer Protection Act"""
    print("📖 Processing Consumer Protection Act...")
    
    # For demo, adding key sections manually
    sections = [
        {
            "act": "Consumer Protection Act 2019",
            "section": "Section 2(7)",
            "title": "Consumer",
            "description": "Any person who buys any goods for consideration and includes any user of such goods"
        },
        {
            "act": "Consumer Protection Act 2019",
            "section": "Section 2(11)",
            "title": "Defect",
            "description": "Any fault, imperfection or shortcoming in the quality, quantity, potency, purity or standard"
        },
        {
            "act": "Consumer Protection Act 2019",
            "section": "Section 35",
            "title": "Jurisdiction of District Commission",
            "description": "District Commission has jurisdiction to entertain complaints where value does not exceed Rs 1 crore"
        },
    ]
    
    print(f"✅ Added {len(sections)} key sections from Consumer Protection Act")
    return sections

def fetch_motor_vehicles_act():
    """Fetch Motor Vehicles Act"""
    print("📖 Processing Motor Vehicles Act 1988...")
    
    # For demo, adding key sections manually
    sections = [
        {
            "act": "Motor Vehicles Act 1988",
            "section": "Section 3",
            "title": "Necessity for driving licence",
            "description": "No person shall drive a motor vehicle in any public place unless he holds an effective driving licence"
        },
        {
            "act": "Motor Vehicles Act 1988",
            "section": "Section 5",
            "title": "Age limit for driving vehicles",
            "description": "Minimum age for driving without gear: 16 years, with gear: 18 years"
        },
        {
            "act": "Motor Vehicles Act 1988",
            "section": "Section 146",
            "title": "Necessity for insurance",
            "description": "No person shall use motor vehicle in public place unless there is a policy of insurance"
        },
        {
            "act": "Motor Vehicles Act 1988",
            "section": "Section 184",
            "title": "Driving dangerously",
            "description": "Whoever drives a motor vehicle at a speed or in a manner dangerous to public shall be punishable"
        },
    ]
    
    print(f"✅ Added {len(sections)} key sections from Motor Vehicles Act")
    return sections

def create_multi_domain_dataset():
    """Create comprehensive multi-domain legal dataset"""
    print("\n🚀 Creating Multi-Domain Legal Dataset\n")
    
    all_sections = []
    
    # Process each act
    all_sections.extend(parse_it_act())
    all_sections.extend(fetch_companies_act())
    all_sections.extend(fetch_consumer_protection_act())
    all_sections.extend(fetch_motor_vehicles_act())
    
    # Save to JSON
    output_file = os.path.join(DATA_DIR, "multi_domain_acts.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_sections, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Dataset created: {output_file}")
    print(f"📊 Total sections: {len(all_sections)}")
    
    # Print summary by act
    acts = {}
    for sec in all_sections:
        act_name = sec['act']
        acts[act_name] = acts.get(act_name, 0) + 1
    
    print("\n📋 Summary by Act:")
    for act, count in acts.items():
        print(f"   - {act}: {count} sections")
    
    return output_file

if __name__ == "__main__":
    create_multi_domain_dataset()
