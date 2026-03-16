import os
import re
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

app = FastAPI(title="Swasth AI Backend")

# CORS setup
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")


class EstimateCaloriesRequest(BaseModel):
    food: str


def extract_calories(text: str) -> int | None:
    """Extract a calorie number from LLM response."""
    # Look for numbers (with optional commas/decimals) - take the first plausible one
    matches = re.findall(r'\b(\d{1,4})\b', text)
    for m in matches:
        n = int(m)
        if 1 <= n <= 3000:  # Plausible calorie range
            return n
    return None


@app.get("/")
def read_root():
    return {"message": "Welcome to Swasth AI Backend"}


@app.post("/estimate-calories")
async def estimate_calories(req: EstimateCaloriesRequest):
    """Use Ollama to estimate calories for a food/meal description."""
    if not req.food or not req.food.strip():
        raise HTTPException(status_code=400, detail="Food description is required")

    prompt = f"""Estimate the total calories for this food or meal. Consider typical serving sizes.
Reply with ONLY a single number (no units, no explanation, no other text). Just the calorie count.

Food/meal: {req.food.strip()}"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start it with: ollama run llama3.2"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {str(e)}")

    content = data.get("message", {}).get("content", "")
    calories = extract_calories(content)
    if calories is None:
        raise HTTPException(
            status_code=502,
            detail=f"Could not parse calories from Ollama response: {content[:200]}"
        )
    return {"calories": calories, "food": req.food.strip()}


@app.post("/chat")
def chat_response(query: str):
    # Mock AI response logic
    return {"response": f"I received your query: '{query}'. This is a mock response from Swasth AI."}


@app.get("/appointments")
def get_appointments():
    return [
        {"id": 1, "doctor": "Dr. Sharma", "specialty": "Cardiologist", "date": "2023-10-25", "time": "10:00 AM"},
        {"id": 2, "doctor": "Dr. Gupta", "specialty": "Dentist", "date": "2023-10-28", "time": "02:00 PM"},
    ]
