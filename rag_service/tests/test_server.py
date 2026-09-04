from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting minimal server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
