from fastapi import FastAPI

app = FastAPI(title="AI Coding Trainee Task")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

