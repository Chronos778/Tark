import requests
import json
import time

url = "http://localhost:3001/api/v1/query"
payload = {
    "query": "Is online betting legal in India?",
    "language": "en",
    "domain": "all",
    "arguments_mode": True,
    "analysis_mode": True
}

print(f"Sending request to {url}...")
try:
    start = time.time()
    response = requests.post(url, json=payload, timeout=60)
    duration = time.time() - start
    
    print(f"Status Code: {response.status_code}")
    print(f"Duration: {duration:.2f}s")
    print("Response Body samples:")
    print(response.text[:500])
except Exception as e:
    print(f"Request failed: {e}")
