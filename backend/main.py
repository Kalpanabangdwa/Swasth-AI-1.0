import os
import re
import json
import httpx
import requests
import fitz  # PyMuPDF
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from typing import List, Optional

# Import database and models
from database import get_db, init_db
from models import Report as ReportModel, User
from services.report_service import ReportService
from services.analysis_service import AnalysisService
from services.category_service import CategoryService
from services.trend_service import TrendService
from services.export_service import ExportService
from services.error_handling import create_error_response, ValidationError

# Load .env file from the backend directory
load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")  # Loaded from backend/.env
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

app = FastAPI(title="Swasth AI Backend")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

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


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from PDF bytes using PyMuPDF."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"PDF extraction failed: {str(e)}")


def call_huggingface(prompt: str, token: str) -> str:
    """Call HuggingFace Inference API and return raw generated text."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 800,
            "return_full_text": False,
            "temperature": 0.1,
        }
    }
    resp = requests.post(HF_API_URL, headers=headers, json=payload, timeout=120)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"HuggingFace API error: {resp.text[:300]}")
    result = resp.json()
    if result and isinstance(result, list) and result[0].get("generated_text"):
        return result[0]["generated_text"]
    raise HTTPException(status_code=502, detail="HuggingFace returned an empty response.")


def parse_json_from_response(raw_text: str) -> dict:
    """Safely extract the first JSON object from an LLM response string."""
    match = re.search(r'\{[\s\S]*\}', raw_text)
    if not match:
        return {}
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


@app.post("/analyze-report")
async def analyze_report(
    file: UploadFile = File(...),
    hf_token: str = Form(default=""),
    user_email: str = Form(default="guest@swasthai.com"),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF medical report. The backend:
    1. Extracts text with PyMuPDF
    2. Sends to Mistral-7B via HuggingFace
    3. Returns structured insights JSON
    4. Optionally persists to database if user_email provided
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    
    # Validate file size (10MB limit)
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    # Step 1: Extract text
    extracted_text = extract_text_from_pdf(pdf_bytes)
    if len(extracted_text) < 30:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from the PDF.")

    # Step 2: Prefer server-side token; fall back to client-supplied token.
    # If no token is present, AnalysisService will use offline deterministic extraction.
    token = (HF_TOKEN or hf_token or "").strip()

    # Step 3: Analyze with new services (AI when configured, offline fallback otherwise)
    try:
        analysis_service = AnalysisService(token)
        category_service = CategoryService(token)
        
        # Analyze report
        analysis_result = await analysis_service.analyze_report(extracted_text)
        
        # Categorize report
        category, confidence = await category_service.categorize_report(
            extracted_text,
            analysis_result["markers"]
        )
        
        # Optionally persist to database
        report_id = None
        if user_email and user_email != "guest@swasthai.com":
            try:
                report_service = ReportService(db)
                user = await report_service.get_or_create_user(user_email)
                
                analysis_result["category"] = category
                report = await report_service.create_report(
                    user_id=user.id,
                    filename=file.filename,
                    file_content=pdf_bytes,
                    analysis_result=analysis_result
                )
                report_id = report.id
            except Exception as e:
                print(f"Failed to persist report: {e}")
        
        return {
            "filename": file.filename,
            "extracted_text_length": len(extracted_text),
            # Keep enough of the extracted text for downstream summarization.
            # (The analysis service itself still truncates for model token limits.)
            "extracted_text": extracted_text[:12000],
            "markers": analysis_result["markers"],
            "deficiencies": analysis_result["deficiencies"],
            "warnings": analysis_result["warnings"],
            "suggestions": analysis_result["suggestions"],
            "health_score": analysis_result["health_score"],
            "analysis_mode": analysis_result.get("analysis_mode", "unknown"),
            "category": category,
            "category_confidence": confidence,
            "report_id": report_id,
            "summary": f"Extracted {len(analysis_result['markers'])} markers and identified {len(analysis_result['deficiencies'])} deficiencies."
        }
    
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response.get("message", str(e))
        )


# ============================================================================
# NEW API ENDPOINTS FOR ENHANCED REPORT SCANNER
# ============================================================================

# Pydantic models for requests/responses
class ReportResponse(BaseModel):
    id: str
    filename: str
    upload_date: str
    category: str
    health_score: int
    markers: List[dict]
    deficiencies: List[str]
    warnings: List[str]
    suggestions: List[str]

class EmailRequest(BaseModel):
    recipient: EmailStr

# Helper function to convert Report model to dict
def report_to_dict(report: ReportModel) -> dict:
    return {
        "id": report.id,
        "filename": report.filename,
        "upload_date": report.upload_date.isoformat(),
        "category": report.category,
        "health_score": report.health_score,
        "markers": [
            {
                "name": m.name,
                "value": m.value,
                "num": m.numeric_value,
                "unit": m.unit,
                "status": m.status,
                "reference_range": m.reference_range
            }
            for m in report.markers
        ],
        "deficiencies": [d.name for d in report.deficiencies],
        "warnings": [w.message for w in report.warnings],
        "suggestions": [s.text for s in report.suggestions]
    }

@app.post("/api/reports/upload")
async def upload_report(
    file: UploadFile = File(...),
    user_email: str = Form(...),
    hf_token: str = Form(default=""),
    db: Session = Depends(get_db)
):
    """
    Upload and analyze a medical report with persistence.
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith(".pdf"):
            raise ValidationError("Only PDF files are accepted.", status_code=400)
        
        # Read file
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise ValidationError("The uploaded file is empty.", status_code=400)
        
        # Validate file size (10MB limit)
        if len(pdf_bytes) > 10 * 1024 * 1024:
            raise ValidationError("File size exceeds 10MB limit.", status_code=400)
        
        # Extract text
        extracted_text = extract_text_from_pdf(pdf_bytes)
        if len(extracted_text) < 30:
            raise ValidationError(
                "Could not extract meaningful text from the PDF.",
                status_code=422
            )
        
        # Initialize services.
        # If no token is present, AnalysisService will use offline deterministic extraction.
        token = (HF_TOKEN or hf_token or "").strip()
        
        analysis_service = AnalysisService(token)
        category_service = CategoryService(token)
        report_service = ReportService(db)
        
        # Analyze report
        analysis_result = await analysis_service.analyze_report(extracted_text)
        
        # Categorize report
        category, confidence = await category_service.categorize_report(
            extracted_text,
            analysis_result["markers"]
        )
        analysis_result["category"] = category
        
        # Get or create user
        user = await report_service.get_or_create_user(user_email)
        
        # Store report
        report = await report_service.create_report(
            user_id=user.id,
            filename=file.filename,
            file_content=pdf_bytes,
            analysis_result=analysis_result
        )
        
        return {
            "success": True,
            "report": report_to_dict(report),
            "message": f"Report analyzed successfully. Category: {category}"
        }
        
    except ValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.get("/api/reports")
async def get_reports(
    user_email: str = Query(...),
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List reports with pagination and optional category filter.
    """
    try:
        report_service = ReportService(db)
        
        # Get user
        user = await report_service.get_or_create_user(user_email)
        
        # Get reports
        reports = await report_service.get_reports(
            user_id=user.id,
            category=category,
            limit=limit,
            offset=offset
        )
        
        # Get total count
        total = report_service.get_report_count(user.id, category)
        
        return {
            "reports": [report_to_dict(r) for r in reports],
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.get("/api/reports/{report_id}")
async def get_report(
    report_id: str,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Get single report by ID.
    """
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
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.delete("/api/reports/{report_id}")
async def delete_report(
    report_id: str,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Delete report with cascade deletion of associated data.
    """
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
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.post("/api/reports/compare")
async def compare_reports(
    report_ids: List[str],
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Compare multiple reports (2-4) side-by-side.
    """
    try:
        if len(report_ids) < 2 or len(report_ids) > 4:
            raise ValidationError(
                "Can only compare 2-4 reports",
                status_code=400
            )
        
        report_service = ReportService(db)
        trend_service = TrendService(db)
        
        user = await report_service.get_or_create_user(user_email)
        
        # Compare reports
        comparison = trend_service.compare_reports(user.id, report_ids)
        
        return {
            "comparison": comparison,
            "report_count": len(report_ids)
        }
        
    except ValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.get("/api/reports/trends")
async def get_trends(
    user_email: str = Query(...),
    time_period: str = Query("all", regex="^(3m|6m|1y|all)$"),
    db: Session = Depends(get_db)
):
    """
    Get trend analysis for all markers.
    """
    try:
        report_service = ReportService(db)
        trend_service = TrendService(db)
        
        user = await report_service.get_or_create_user(user_email)
        
        # Get all trends
        trends = trend_service.get_all_trends(user.id, time_period)
        
        # Convert to serializable format
        trends_data = {}
        for marker_name, trend in trends.items():
            trends_data[marker_name] = {
                "marker_name": trend.marker_name,
                "direction": trend.direction,
                "data_points": trend.data_points,
                "concerning": trend.concerning
            }
        
        # Get concerning markers
        concerning = trend_service.identify_concerning_trends(trends)
        
        return {
            "trends": trends_data,
            "concerning_markers": concerning,
            "time_period": time_period
        }
        
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.post("/api/reports/{report_id}/export/pdf")
async def export_pdf(
    report_id: str,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Generate and return PDF export of report.
    """
    try:
        report_service = ReportService(db)
        export_service = ExportService()
        
        user = await report_service.get_or_create_user(user_email)
        report = await report_service.get_report_by_id(report_id, user.id)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Generate PDF
        pdf_content = await export_service.generate_pdf(report)
        
        # Return PDF as response
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={report.filename}_analysis.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.post("/api/reports/{report_id}/export/email")
async def export_email(
    report_id: str,
    email_request: EmailRequest,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Send report analysis via email.
    """
    try:
        report_service = ReportService(db)
        export_service = ExportService()
        
        user = await report_service.get_or_create_user(user_email)
        report = await report_service.get_report_by_id(report_id, user.id)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Generate PDF
        pdf_content = await export_service.generate_pdf(report)
        
        # Send email
        success = await export_service.send_email(
            recipient=email_request.recipient,
            report=report,
            pdf_content=pdf_content
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to send email after multiple attempts"
            )
        
        return {
            "success": True,
            "message": f"Report sent to {email_request.recipient}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_response = create_error_response(e)
        raise HTTPException(
            status_code=error_response.get("status_code", 500),
            detail=error_response
        )

@app.get("/api/categories")
async def get_categories():
    """
    List available report categories.
    """
    return {
        "categories": CategoryService.CATEGORIES
    }

@app.get("/api/reports/category/{category_name}")
async def get_reports_by_category(
    category_name: str,
    user_email: str = Query(...),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Filter reports by category.
    """
    return await get_reports(
        user_email=user_email,
        category=category_name,
        limit=limit,
        offset=offset,
        db=db
    )
