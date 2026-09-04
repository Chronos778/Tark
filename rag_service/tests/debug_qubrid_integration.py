
import sys
import os
import pathlib
import asyncio
from dotenv import load_dotenv

# Path setup
sys.path.append(os.path.join(os.getcwd(), "rag_service"))

# Load env
base_path = pathlib.Path(__file__).parent.parent
load_dotenv(dotenv_path=base_path / ".env")

try:
    from rag_engine import RAGEngine
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def main():
    print("Initializing Engine (Should pick up QUBRID_API_KEY)...")
    try:
        engine = RAGEngine()
        # Ensure we are using Qubrid
        if "qubrid" not in str(engine.client.base_url).lower():
             print(f"WARNING: Client base URL is {engine.client.base_url}, expected Qubrid.")
        
        print("\nQuerying 'Punishment for murder'...")
        res = await engine.query("Punishment for murder")
        print("\nFinal Answer:", res.get("answer"))

    except Exception:
        print("\nCRASHED:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
