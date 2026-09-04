import time
print("Testing Text Processor...")
start = time.time()
try:
    from text_processor import TextProcessor
    tp = TextProcessor()
    print(f"Text Processor created ({time.time() - start:.2f}s)")
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
