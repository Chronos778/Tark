import requests
import time

print("Testing /health...")
start = time.time()
try:
    response = requests.get("http://127.0.0.1:8000/health", timeout=5)
    print(f"Response: {response.json()}")
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
