import requests
import json
import time

url = "http://127.0.0.1:8000/query"
payload = {
    "query": "hi",
    "language": "en",
    "domain": "all"
}
headers = {"Content-Type": "application/json"}

print(f"Sending query: {payload}")
start = time.time()
try:
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    elapsed = time.time() - start
    print(f"Response ({elapsed:.2f}s): status={response.status_code}")
    print(response.text[:500])
except Exception as e:
    print(f"Error ({time.time() - start:.2f}s): {e}")
