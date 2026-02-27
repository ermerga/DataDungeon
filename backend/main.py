from fastapi import FastAPI

app = FastAPI(title="DataDungeon API")


@app.get("/health")
def health():
    return {"status": "ok"}
