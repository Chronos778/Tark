import requests
import json

url = "http://localhost:8000/query"
headers = {"Content-Type": "application/json"}
data = {
    "query": "What is punishment for murder?",
    "language": "en",
    "domain": "criminal",
    "arguments_mode": True,   # <-- Enabling this
    "analysis_mode": True     # <-- And this
}

try:
    print(f"Sending request to {url} with toggles ON...")
    response = requests.post(url, headers=headers, json=data, timeout=120)
    
    if response.status_code == 200:
        result = response.json()
        print("\n--- API Response JSON ---")
        # Print specific fields to check if they are null or populated
        print(f"Neutral Analysis: {json.dumps(result.get('neutral_analysis'), indent=2)}")
        print(f"Arguments: {json.dumps(result.get('arguments'), indent=2)}")
        print(f"Full Response Keys: {result.keys()}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

except Exception as e:
    print(f"Request Failed: {e}")
