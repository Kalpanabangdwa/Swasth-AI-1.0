from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Swasth AI Backend")

# CORS setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Swasth AI Backend"}

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
