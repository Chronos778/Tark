import requests
import time

print("Testing backend health...")
try:
    response = requests.get("http://localhost:8000/health", timeout=5)
    if response.status_code == 200:
        print("✅ Backend is running")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ Backend returned status {response.status_code}")
except requests.exceptions.ConnectionError:
    print("❌ Backend is not running")
    print("Start it with: uvicorn main:app --reload --port 8000")
except Exception as e:
    print(f"❌ Error: {e}")

print("\nTesting a quick query...")
try:
    start = time.time()
    response = requests.post(
        "http://localhost:8000/query",
        json={
            "query": "What is Section 302 IPC?",
            "language": "en",
            "domain": "all",
            "arguments_mode": False,
            "analysis_mode": False
        },
        timeout=20
    )
    elapsed = time.time() - start
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Query successful ({elapsed:.2f}s)")
        print(f"Answer length: {len(data.get('answer', ''))} chars")
        print(f"Citations: {len(data.get('citations', []))}")
        print(f"\nFirst 200 chars:\\n{data.get('answer', '')[:200]}...")
        
        if elapsed > 15:
            print(f"\n⚠️  WARNING: Response took {elapsed:.2f}s (over 15s limit!)")
    else:
        print(f"❌ Query failed with status {response.status_code}")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("❌ Backend is not running")
except requests.exceptions.Timeout:
    print("❌ Query timed out (>20s)")
except Exception as e:
    print(f"❌ Error: {e}")
