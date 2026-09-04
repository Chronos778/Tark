import os
import requests
from dotenv import load_dotenv

load_dotenv()

nvidia_key = os.getenv("NVIDIA_API_KEY")
openrouter_key = os.getenv("OPENROUTER_API_KEY")

def test_api(name, key, url, model):
    if not key:
        print(f"Skipping {name}: Key not found in .env")
        return
    
    print(f"\n--- Testing {name} API Key ---")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    data = {
        "model": model,
        "messages": [{"role": "user", "content": "Say 'API Test Success'"}],
        "max_tokens": 20
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=15)
        if response.status_code == 200:
            print(f"[SUCCESS] {name} is WORKING!")
            print("Response:", response.json()['choices'][0]['message']['content'])
        else:
            print(f"[FAILED] {name} failed with status {response.status_code}")
            print("Error details:", response.text)
    except Exception as e:
        print(f"[ERROR] {name} error: {e}")

# Test NVIDIA 70B
test_api("NVIDIA NIM 70B", nvidia_key, "https://integrate.api.nvidia.com/v1/chat/completions", "meta/llama-3.1-70b-instruct")

# Test OpenRouter
test_api("OpenRouter", openrouter_key, "https://openrouter.ai/api/v1/chat/completions", "mistralai/mistral-7b-instruct")
