import os
import re
import json
import httpx
import requests
import fitz
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import desc as sql_desc
from typing import List, Optional
from datetime import datetime

from database import get_db, init_db
from models import Report as ReportModel, User, ChatHistory
from services.report_service import ReportService
from services.analysis_service import AnalysisService
from services.category_service import CategoryService
from services.trend_service import TrendService
from services.export_service import ExportService
from services.error_handling import create_error_response, ValidationError
from services.diet_symptom_service import build_weekly_plan, analyze_symptoms

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

app = FastAPI(title="Swasth AI Backend")


@app.on_event("startup")
async def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# GROQ HELPER — single function replaces all Ollama calls
# =============================================================================
async def call_groq(prompt: str, max_tokens: int = 500) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=503, detail="GROQ_API_KEY not configured.")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}",
                         "Content-Type": "application/json"},
                json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                      "max_tokens": max_tokens, "temperature": 0.7},
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503, detail="Could not connect to Groq API.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502, detail=f"Groq API error: {str(e)}")


# =============================================================================
# HELPERS
# =============================================================================
def get_or_create_user(db: Session, email: str, name: str = None) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif name and not user.name:
        user.name = name
        db.commit()
    return user


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id, "email": user.email, "name": user.name,
        "age": user.age, "weight_kg": user.weight_kg, "height_cm": user.height_cm,
        "goal": user.goal, "preference": user.preference, "allergies": user.allergies,
        "activity_level": user.activity_level, "medical_conditions": user.medical_conditions,
        "created_at": user.created_at.isoformat(),
    }


def report_to_dict(report: ReportModel) -> dict:
    return {
        "id": report.id, "filename": report.filename,
        "upload_date": report.upload_date.isoformat(),
        "category": report.category, "health_score": report.health_score,
        "markers": [{"name": m.name, "value": m.value, "num": m.numeric_value,
                     "unit": m.unit, "status": m.status, "reference_range": m.reference_range}
                    for m in report.markers],
        "deficiencies": [d.name for d in report.deficiencies],
        "warnings":     [w.message for w in report.warnings],
        "suggestions":  [s.text for s in report.suggestions],
    }


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=422, detail=f"PDF extraction failed: {str(e)}")


def extract_calories_from_text(text: str):
    matches = re.findall(r'\b(\d{1,4})\b', text)
    for m in matches:
        n = int(m)
        if 1 <= n <= 3000:
            return n
    return None


ACTIVITY_MULTIPLIERS = {"sedentary": 1.2, "moderate": 1.55, "active": 1.725}
GOAL_CALORIE_DELTA = {"weight_loss": -500,
                      "weight_gain": +500, "maintenance": 0}


def calculate_bmr(age: int, weight_kg: float, height_cm: float) -> int:
    return int(10 * weight_kg + 6.25 * height_cm - 5 * age + 5)


def pick_meal(options: list, user_id: str) -> str:
    import hashlib
    seed = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return options[seed % len(options)]


MEAL_TEMPLATES = {
    "vegetarian": {
        "breakfast": ["Oats porridge with banana and honey", "Vegetable upma with green chutney", "Whole wheat toast with peanut butter and apple", "Besan chilla with mint chutney and curd"],
        "lunch":     ["Dal tadka, brown rice, sabzi and curd", "Paneer bhurji wrap with mint chutney", "Rajma chawal with onion salad", "Mixed vegetable khichdi with kadhi"],
        "snack":     ["Mixed nuts and seeds", "Fruit salad with chaat masala", "Sprouts chaat with lemon", "Roasted makhana with green tea"],
        "dinner":    ["Roti, palak paneer, cucumber salad", "Moong dal soup with whole wheat bread", "Vegetable daliya with raita", "Tofu stir-fry with quinoa"],
    },
    "non-vegetarian": {
        "breakfast": ["Boiled eggs with whole wheat toast", "Egg bhurji with roti", "Grilled chicken sandwich", "Omelette with vegetables and toast"],
        "lunch":     ["Grilled chicken with brown rice and salad", "Fish curry with steamed rice", "Chicken wrap with mint chutney", "Egg curry with roti"],
        "snack":     ["2 boiled eggs with black pepper", "Grilled chicken tikka", "Mixed nuts and banana", "Tuna on whole wheat crackers"],
        "dinner":    ["Baked fish with sautéed vegetables", "Chicken soup with whole wheat bread", "Grilled prawns with brown rice", "Mutton keema with roti"],
    },
    "vegan": {
        "breakfast": ["Smoothie bowl with chia seeds", "Besan chilla with mint chutney", "Oats with almond milk and banana", "Tofu scramble with whole wheat toast"],
        "lunch":     ["Red lentil soup with brown rice", "Tofu stir-fry with quinoa", "Chickpea salad wrap with tahini", "Rajma with brown rice"],
        "snack":     ["Hummus with carrot sticks", "Trail mix", "Fresh fruit", "Roasted chickpeas"],
        "dinner":    ["Mixed vegetable curry with quinoa", "Black bean tacos with avocado", "Lentil dal with roti", "Mushroom stir-fry with brown rice"],
    },
}


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class UserCreateRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserProfileUpdateRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    goal: Optional[str] = None
    preference: Optional[str] = None
    allergies: Optional[str] = None
    activity_level: Optional[str] = None
    medical_conditions: Optional[str] = None


class ChatRequest(BaseModel):
    email: EmailStr
    query: str
    name: Optional[str] = None


class DietPlanRequest(BaseModel):
    email: EmailStr
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    goal: Optional[str] = None
    preference: Optional[str] = None
    activity_level: Optional[str] = "moderate"
    medical_conditions: Optional[str] = None


class WeeklyDietRequest(BaseModel):
    email: EmailStr
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    goal: Optional[str] = None
    preference: Optional[str] = None
    activity_level: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None


class SymptomCheckRequest(BaseModel):
    symptoms: List[str]
    duration: str
    severity: int
    email: Optional[EmailStr] = None


class EstimateCaloriesRequest(BaseModel):
    food: str


class EmailRequest(BaseModel):
    recipient: EmailStr


# =============================================================================
# ROOT + HEALTH CHECK
# =============================================================================
@app.get("/")
def read_root():
    return {"message": "Welcome to Swasth AI Backend", "status": "running", "ai": "groq"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "groq_configured": bool(GROQ_API_KEY)}


# =============================================================================
# USER ENDPOINTS
# =============================================================================
@app.post("/user/register")
def register_user(req: UserCreateRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, req.email, req.name)
    return _user_to_dict(user)


@app.get("/user/profile")
def get_user_profile(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return _user_to_dict(user)


@app.put("/user/profile")
def update_user_profile(req: UserProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(email=req.email)
        db.add(user)
    for field in ["name", "age", "weight_kg", "height_cm", "goal", "preference",
                  "allergies", "activity_level", "medical_conditions"]:
        val = getattr(req, field, None)
        if val is not None:
            setattr(user, field, val)
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated successfully", "user": _user_to_dict(user)}


@app.get("/user/calorie-target")
def get_calorie_target(email: str = Query(...), db: Session = Depends(get_db)):
    """Returns personalised calorie target for dashboard."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.age or not user.weight_kg or not user.height_cm:
        return {"target": 2000, "bmr": None, "tdee": None, "personalised": False}
    bmr = calculate_bmr(int(user.age), float(
        user.weight_kg), float(user.height_cm))
    multiplier = ACTIVITY_MULTIPLIERS.get(
        user.activity_level or "moderate", 1.55)
    tdee = int(bmr * multiplier)
    target = tdee + GOAL_CALORIE_DELTA.get(user.goal or "maintenance", 0)
    return {"target": target, "bmr": bmr, "tdee": tdee, "personalised": True,
            "goal": user.goal, "activity_level": user.activity_level}


@app.get("/users")
def list_users(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).limit(limit).all()
    return {"users": [_user_to_dict(u) for u in users], "total": len(users)}


# =============================================================================
# CHAT — real AI via Groq with user profile context
# =============================================================================
@app.post("/chat")
async def chat_response(req: ChatRequest, db: Session = Depends(get_db)):
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    user = get_or_create_user(db, req.email, req.name)

    # Load recent chat for context
    recent = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user.id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(6).all()
    )
    recent.reverse()

    history_text = ""
    for msg in recent:
        role = "User" if msg.role == "user" else "Assistant"
        history_text += f"{role}: {msg.message}\n"

    profile_parts = []
    if user.age:
        profile_parts.append(f"Age: {user.age}")
    if user.weight_kg:
        profile_parts.append(f"Weight: {user.weight_kg}kg")
    if user.height_cm:
        profile_parts.append(f"Height: {user.height_cm}cm")
    if user.goal:
        profile_parts.append(f"Goal: {user.goal}")
    if user.preference:
        profile_parts.append(f"Diet: {user.preference}")
    if user.medical_conditions:
        profile_parts.append(f"Medical: {user.medical_conditions}")
    if user.allergies:
        profile_parts.append(f"Allergies: {user.allergies}")
    profile_context = ", ".join(profile_parts)

    prompt = f"""You are Swasth AI, a helpful and empathetic personal health assistant for Indian users.
You provide accurate health information, diet advice, and wellness guidance.
Always recommend consulting a doctor for serious medical concerns.
Keep responses concise and friendly (max 3-4 sentences).

{f"User profile: {profile_context}" if profile_context else ""}
{f"Recent conversation:{chr(10)}{history_text}" if history_text else ""}

User: {query}
Assistant:"""

    try:
        ai_response = await call_groq(prompt, max_tokens=300)
    except Exception:
        ai_response = (
            f"Hello {user.name or 'there'}! I'm Swasth AI. "
            "I'm having trouble connecting right now. Please try again shortly."
        )

    db.add(ChatHistory(user_id=user.id, role="user",      message=query))
    db.add(ChatHistory(user_id=user.id, role="assistant", message=ai_response))
    db.commit()

    return {"response": ai_response, "user_id": user.id, "email": user.email}


@app.get("/chat/history")
def get_chat_history(email: str = Query(...), limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    rows = db.query(ChatHistory).filter(ChatHistory.user_id == user.id).order_by(
        ChatHistory.timestamp.asc()).offset(offset).limit(limit).all()
    total = db.query(ChatHistory).filter(
        ChatHistory.user_id == user.id).count()
    return {"email": email, "history": [{"id": r.id, "role": r.role, "message": r.message, "timestamp": r.timestamp.isoformat()} for r in rows], "total": total, "limit": limit, "offset": offset}


@app.delete("/chat/history")
def clear_chat_history(email: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    deleted = db.query(ChatHistory).filter(
        ChatHistory.user_id == user.id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} messages for {email}"}


# =============================================================================
# CALORIE ESTIMATOR — Groq
# =============================================================================
@app.post("/estimate-calories")
async def estimate_calories(req: EstimateCaloriesRequest):
    if not req.food or not req.food.strip():
        raise HTTPException(
            status_code=400, detail="Food description is required")
    prompt = f"""You are a nutrition expert. Estimate total calories for this food/meal.
Consider typical Indian/standard serving sizes.
Reply with ONLY a single integer. No units, no explanation, nothing else.
Food: {req.food.strip()}"""
    content = await call_groq(prompt, max_tokens=20)
    calories = extract_calories_from_text(content)
    if calories is None:
        raise HTTPException(
            status_code=502, detail=f"Could not parse calories: {content[:100]}")
    return {"calories": calories, "food": req.food.strip()}


# =============================================================================
# DIET PLAN — single day
# =============================================================================
@app.post("/diet/plan")
async def get_diet_plan(req: DietPlanRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, req.email)
    age = req.age or user.age
    weight_kg = req.weight_kg or user.weight_kg
    height_cm = req.height_cm or user.height_cm
    goal = req.goal or user.goal or "maintenance"
    preference = req.preference or user.preference or "vegetarian"
    activity_level = req.activity_level or user.activity_level or "moderate"
    medical_conditions = req.medical_conditions or user.medical_conditions

    missing = [f for f, v in [
        ("age", age), ("weight_kg", weight_kg), ("height_cm", height_cm)] if not v]
    if missing:
        raise HTTPException(
            status_code=400, detail=f"Missing: {', '.join(missing)}. Update your profile first.")

    bmr = calculate_bmr(int(age), float(weight_kg), float(height_cm))
    tdee = int(bmr * ACTIVITY_MULTIPLIERS.get(activity_level, 1.55))
    target = tdee + GOAL_CALORIE_DELTA.get(goal, 0)

    pref_key = preference.lower() if preference.lower() in MEAL_TEMPLATES else "vegetarian"
    meal_plan = {slot: pick_meal(opts, user.id)
                 for slot, opts in MEAL_TEMPLATES[pref_key].items()}

    notes = []
    if medical_conditions:
        notes.append(
            f"⚠️ You have: {medical_conditions}. Consult your doctor before dietary changes.")
    if user.allergies:
        notes.append(f"⚠️ Allergy alert: Avoid {user.allergies}.")

    return {
        "email": user.email, "user_name": user.name, "plan_source": "rule-based",
        "goal": goal, "preference": preference, "activity_level": activity_level,
        "calories": {"bmr": bmr, "tdee": tdee, "target": target},
        "macros":   {"protein_g": int((target*0.30)/4), "carbs_g": int((target*0.40)/4), "fat_g": int((target*0.30)/9)},
        "water_ml": int(float(weight_kg)*35), "meal_plan": meal_plan, "notes": notes,
    }


# =============================================================================
# DIET PLAN — full 7-day with deficiency awareness + Groq AI tips
# =============================================================================
@app.post("/diet/weekly-plan")
async def get_weekly_diet_plan(req: WeeklyDietRequest, db: Session = Depends(get_db)):
    user = get_or_create_user(db, req.email)
    age = req.age or user.age
    weight_kg = req.weight_kg or user.weight_kg
    height_cm = req.height_cm or user.height_cm
    goal = req.goal or user.goal or "maintenance"
    preference = req.preference or user.preference or "vegetarian"
    activity_level = req.activity_level or user.activity_level or "moderate"
    medical_conditions = req.medical_conditions or user.medical_conditions or ""
    allergies_str = req.allergies or user.allergies or ""

    missing = [f for f, v in [
        ("age", age), ("weight_kg", weight_kg), ("height_cm", height_cm)] if not v]
    if missing:
        raise HTTPException(
            status_code=400, detail=f"Missing: {', '.join(missing)}. Update your profile first.")

    allergens = [a.strip() for a in allergies_str.split(",")
                 if a.strip()] if allergies_str else []
    deficiencies = []
    latest_report = db.query(ReportModel).filter(
        ReportModel.user_id == user.id).order_by(sql_desc(ReportModel.upload_date)).first()
    if latest_report:
        deficiencies = [d.name for d in latest_report.deficiencies]

    bmr = calculate_bmr(int(age), float(weight_kg), float(height_cm))
    tdee = int(bmr * ACTIVITY_MULTIPLIERS.get(activity_level, 1.55))
    target = tdee + GOAL_CALORIE_DELTA.get(goal, 0)
    water_ml = int(float(weight_kg) * 35)

    notes = []
    if medical_conditions:
        notes.append(
            f"⚠️ Medical conditions: {medical_conditions}. Consult your doctor before dietary changes.")
    if goal == "weight_loss":
        notes.append(
            "Eat slowly, avoid processed foods, and keep dinner light.")
    elif goal == "weight_gain":
        notes.append(
            "Include calorie-dense, nutrient-rich foods. Never skip meals.")
    notes.append(f"💧 Drink at least {water_ml//1000:.1f}L of water daily.")
    notes.append("⏰ Eat every 3-4 hours to keep your metabolism active.")

    plan_source = "rule-based"
    ai_tips = []
    try:
        prompt = f"""You are a certified nutritionist. Give exactly 3 practical meal tips for:
Goal: {goal}, Diet: {preference}, Allergies: {allergens or 'None'},
Deficiencies: {deficiencies or 'None'}, Medical: {medical_conditions or 'None'}
Reply ONLY with a JSON array: ["tip1","tip2","tip3"]"""
        content = await call_groq(prompt, max_tokens=200)
        match = re.search(r'\[[\s\S]*?\]', content)
        if match:
            ai_tips = json.loads(match.group(0))
            plan_source = "ai-enhanced"
    except Exception:
        pass

    plan_data = build_weekly_plan(
        preference=preference, allergens=allergens, deficiencies=deficiencies,
        goal=goal, target_calories=target, water_ml=water_ml, notes=notes + ai_tips,
    )

    return {
        "email": user.email, "user_name": user.name, "plan_source": plan_source,
        "goal": goal, "preference": preference, "activity_level": activity_level,
        "allergens": allergens, "deficiencies_from_report": deficiencies,
        "calories": {"bmr": bmr, "tdee": tdee, "target": target},
        "macros":   {"protein_g": int((target*0.30)/4), "carbs_g": int((target*0.40)/4), "fat_g": int((target*0.30)/9)},
        "water_ml": water_ml, "weekly_plan": plan_data["weekly_plan"],
        "allergen_alerts": plan_data["allergen_alerts"],
        "deficiency_notes": plan_data["deficiency_notes"],
        "general_notes": plan_data["general_notes"],
    }


# =============================================================================
# SYMPTOM CHECKER
# =============================================================================
@app.post("/symptoms/check")
async def check_symptoms(req: SymptomCheckRequest):
    if not req.symptoms:
        raise HTTPException(
            status_code=400, detail="At least one symptom is required.")
    if not (1 <= req.severity <= 10):
        raise HTTPException(
            status_code=400, detail="Severity must be between 1 and 10.")
    return analyze_symptoms(symptoms=req.symptoms, duration=req.duration, severity=req.severity)


# =============================================================================
# REPORT ENDPOINTS
# =============================================================================
@app.post("/analyze-report")
async def analyze_report(
    file: UploadFile = File(...), hf_token: str = Form(default=""),
    user_email: str = Form(default="guest@swasthai.com"), db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, detail="Only PDF files are accepted.")
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(pdf_bytes) > 10*1024*1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB.")
    extracted_text = extract_text_from_pdf(pdf_bytes)
    if len(extracted_text) < 30:
        raise HTTPException(
            status_code=422, detail="Could not extract text from PDF.")
    token = (HF_TOKEN or hf_token or "").strip()
    try:
        analysis_service = AnalysisService(token)
        category_service = CategoryService(token)
        analysis_result = await analysis_service.analyze_report(extracted_text)
        category, confidence = await category_service.categorize_report(extracted_text, analysis_result["markers"])
        report_id = None
        if user_email and user_email != "guest@swasthai.com":
            try:
                report_service = ReportService(db)
                user = await report_service.get_or_create_user(user_email)
                analysis_result["category"] = category
                report = await report_service.create_report(user_id=user.id, filename=file.filename, file_content=pdf_bytes, analysis_result=analysis_result)
                report_id = report.id
                # Auto-update user deficiencies from report
                if analysis_result.get("deficiencies"):
                    existing = user.medical_conditions or ""
                    new_defs = ", ".join(analysis_result["deficiencies"])
                    if new_defs not in existing:
                        user.medical_conditions = f"{existing}, {new_defs}".strip(
                            ", ") if existing else new_defs
                        db.commit()
            except Exception as e:
                print(f"Failed to persist report: {e}")
        return {
            "filename": file.filename, "extracted_text_length": len(extracted_text),
            "extracted_text": extracted_text[:12000],
            "markers": analysis_result["markers"], "deficiencies": analysis_result["deficiencies"],
            "warnings": analysis_result["warnings"], "suggestions": analysis_result["suggestions"],
            "health_score": analysis_result["health_score"],
            "analysis_mode": analysis_result.get("analysis_mode", "unknown"),
            "category": category, "category_confidence": confidence, "report_id": report_id,
            "summary": f"Extracted {len(analysis_result['markers'])} markers and identified {len(analysis_result['deficiencies'])} deficiencies."
        }
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(status_code=error_response.get(
            "status_code", 500), detail=error_response.get("message", str(e)))


@app.post("/api/reports/upload")
async def upload_report(file: UploadFile = File(...), user_email: str = Form(...), hf_token: str = Form(default=""), db: Session = Depends(get_db)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise ValidationError("Only PDF files accepted.", status_code=400)
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise ValidationError("Empty file.", status_code=400)
        if len(pdf_bytes) > 10*1024*1024:
            raise ValidationError("File exceeds 10MB.", status_code=400)
        extracted_text = extract_text_from_pdf(pdf_bytes)
        if len(extracted_text) < 30:
            raise ValidationError("Could not extract text.", status_code=422)
        token = (HF_TOKEN or hf_token or "").strip()
        analysis_service = AnalysisService(token)
        category_service = CategoryService(token)
        report_service = ReportService(db)
        analysis_result = await analysis_service.analyze_report(extracted_text)
        category, _ = await category_service.categorize_report(extracted_text, analysis_result["markers"])
        analysis_result["category"] = category
        user = await report_service.get_or_create_user(user_email)
        report = await report_service.create_report(user_id=user.id, filename=file.filename, file_content=pdf_bytes, analysis_result=analysis_result)
        return {"success": True, "report": report_to_dict(report), "message": f"Report analyzed. Category: {category}"}
    except ValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(status_code=error_response.get(
            "status_code", 500), detail=error_response)


@app.get("/api/reports")
async def get_reports(user_email: str = Query(...), category: Optional[str] = Query(None), limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    try:
        report_service = ReportService(db)
        user = await report_service.get_or_create_user(user_email)
        reports = await report_service.get_reports(user_id=user.id, category=category, limit=limit, offset=offset)
        total = report_service.get_report_count(user.id, category)
        return {"reports": [report_to_dict(r) for r in reports], "total": total, "limit": limit, "offset": offset}
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(status_code=error_response.get(
            "status_code", 500), detail=error_response)


@app.get("/api/reports/{report_id}")
async def get_report(report_id: str, user_email: str = Query(...), db: Session = Depends(get_db)):
    try:
        report_service = ReportService(db)
        user = await report_service.get_or_create_user(user_email)
        report = await report_service.get_report_by_id(report_id, user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report_to_dict(report)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str, user_email: str = Query(...), db: Session = Depends(get_db)):
    try:
        report_service = ReportService(db)
        user = await report_service.get_or_create_user(user_email)
        success = await report_service.delete_report(report_id, user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"success": True, "message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports/compare")
async def compare_reports(report_ids: List[str], user_email: str = Query(...), db: Session = Depends(get_db)):
    try:
        if len(report_ids) < 2 or len(report_ids) > 4:
            raise ValidationError(
                "Can only compare 2-4 reports", status_code=400)
        report_service = ReportService(db)
        trend_service = TrendService(db)
        user = await report_service.get_or_create_user(user_email)
        comparison = trend_service.compare_reports(user.id, report_ids)
        return {"comparison": comparison, "report_count": len(report_ids)}
    except ValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/trends")
async def get_trends(user_email: str = Query(...), time_period: str = Query("all", pattern="^(3m|6m|1y|all)$"), db: Session = Depends(get_db)):
    try:
        report_service = ReportService(db)
        trend_service = TrendService(db)
        user = await report_service.get_or_create_user(user_email)
        trends = trend_service.get_all_trends(user.id, time_period)
        trends_data = {k: {"marker_name": t.marker_name, "direction": t.direction,
                           "data_points": t.data_points, "concerning": t.concerning} for k, t in trends.items()}
        return {"trends": trends_data, "concerning_markers": trend_service.identify_concerning_trends(trends), "time_period": time_period}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports/{report_id}/export/pdf")
async def export_pdf(report_id: str, user_email: str = Query(...), db: Session = Depends(get_db)):
    try:
        report_service = ReportService(db)
        export_service = ExportService()
        user = await report_service.get_or_create_user(user_email)
        report = await report_service.get_report_by_id(report_id, user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        pdf_content = await export_service.generate_pdf(report)
        return Response(content=pdf_content, media_type="application/pdf",
                        headers={"Content-Disposition": f"attachment; filename={report.filename}_analysis.pdf"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/reports/{report_id}/export/email")
async def export_email(report_id: str, email_request: EmailRequest, user_email: str = Query(...), db: Session = Depends(get_db)):
    try:
        report_service = ReportService(db)
        export_service = ExportService()
        user = await report_service.get_or_create_user(user_email)
        report = await report_service.get_report_by_id(report_id, user.id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        pdf_content = await export_service.generate_pdf(report)
        success = await export_service.send_email(recipient=email_request.recipient, report=report, pdf_content=pdf_content)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        return {"success": True, "message": f"Report sent to {email_request.recipient}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories")
async def get_categories():
    return {"categories": CategoryService.CATEGORIES}


@app.get("/api/reports/category/{category_name}")
async def get_reports_by_category(category_name: str, user_email: str = Query(...), limit: int = Query(10, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return await get_reports(user_email=user_email, category=category_name, limit=limit, offset=offset, db=db)


@app.get("/appointments")
def get_appointments():
    return [
        {"id": 1, "doctor": "Dr. Sharma", "specialty": "Cardiologist",
            "date": "2023-10-25", "time": "10:00 AM"},
        {"id": 2, "doctor": "Dr. Gupta", "specialty": "Dentist",
            "date": "2023-10-28", "time": "02:00 PM"},
    ]
