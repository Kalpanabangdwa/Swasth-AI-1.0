"""Enhanced AI analysis service with improved marker extraction."""
import re
import json
import requests
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from services.error_handling import (
    CircuitBreaker, retry_with_backoff, HuggingFaceAPIError
)
from services.cache_service import analysis_cache


class AnalysisService:
    """Service for AI-powered medical report analysis."""
    
    # Reference ranges for common markers
    REFERENCE_RANGES = {
        "hemoglobin": {"min": 13.5, "max": 17.5, "unit": "g/dL"},
        "vitamin d": {"min": 30, "max": 100, "unit": "ng/mL"},
        "cholesterol": {"min": 0, "max": 200, "unit": "mg/dL"},
        "blood sugar": {"min": 70, "max": 99, "unit": "mg/dL"},
        "glucose": {"min": 70, "max": 99, "unit": "mg/dL"},
        "iron": {"min": 60, "max": 170, "unit": "µg/dL"},
        "calcium": {"min": 8.5, "max": 10.5, "unit": "mg/dL"},
        "sodium": {"min": 136, "max": 145, "unit": "mEq/L"},
        "potassium": {"min": 3.5, "max": 5.0, "unit": "mEq/L"},
    }
    
    # Marker name normalization mapping
    MARKER_ALIASES = {
        "vit d": "vitamin d",
        "vitd": "vitamin d",
        "vitamin-d": "vitamin d",
        "hb": "hemoglobin",
        "hgb": "hemoglobin",
        "chol": "cholesterol",
        "ldl": "ldl cholesterol",
        "hdl": "hdl cholesterol",
        "trig": "triglycerides",
        "glu": "glucose",
        "na": "sodium",
        "k": "potassium",
        "ca": "calcium",
        "fe": "iron",
    }
    
    def __init__(self, hf_token: str | None):
        """
        Initialize analysis service.
        
        Args:
            hf_token: HuggingFace API token
        """
        self.hf_token = (hf_token or "").strip()
        self.api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, timeout=60)
    
    async def analyze_report(self, extracted_text: str) -> Dict:
        """
        Analyze report text using HuggingFace API with caching.
        
        Args:
            extracted_text: Text extracted from PDF
            
        Returns:
            Dictionary with markers, deficiencies, warnings, suggestions, health_score
        """
        # Check cache first
        cached_result = analysis_cache.get(extracted_text)
        if cached_result:
            return cached_result

        # If no HF token is configured, fall back to deterministic extraction.
        # This keeps the app usable out-of-the-box for hackathon/demo environments.
        if not self.hf_token:
            result = self.analyze_report_offline(extracted_text)
            result["analysis_mode"] = "offline"
            analysis_cache.set(extracted_text, result)
            return result
        
        # Limit text to avoid token limits
        snippet = extracted_text[:3000]
        
        # Build prompt
        prompt = self._build_analysis_prompt(snippet)
        
        # Call HuggingFace API with retry and circuit breaker
        try:
            raw_text = await self.call_huggingface_with_retry(prompt)
        except Exception as e:
            # Graceful degradation - offline extraction + warning banner
            offline = self.analyze_report_offline(extracted_text)
            offline["analysis_mode"] = "offline"
            offline["warnings"] = list(offline.get("warnings", [])) + [f"AI analysis unavailable, using offline extraction: {str(e)}"]
            analysis_cache.set(extracted_text, offline)
            return offline
        
        # Parse JSON response
        parsed = self._parse_json_from_response(raw_text)
        
        # Extract and enhance markers
        markers = parsed.get("markers", [])
        markers = await self.extract_markers(markers)
        markers = self.validate_marker_ranges(markers)
        
        # Get other analysis components
        deficiencies = parsed.get("deficiencies", [])
        warnings = parsed.get("warnings", [])
        suggestions = parsed.get("suggestions", [])
        
        # Extract date from report
        report_date = self.extract_date(extracted_text)
        
        # Calculate health score
        health_score = self.calculate_health_score(markers, warnings)
        
        result = {
            "markers": markers,
            "deficiencies": deficiencies,
            "warnings": warnings,
            "suggestions": suggestions,
            "health_score": health_score,
            "extracted_text": extracted_text,
            "report_date": report_date
        }
        result["analysis_mode"] = "ai"
        
        # Cache the result
        analysis_cache.set(extracted_text, result)
        
        return result

    # ---------------------------------------------------------------------
    # Offline deterministic analysis (no external LLM required)
    # ---------------------------------------------------------------------
    def analyze_report_offline(self, extracted_text: str) -> Dict:
        """
        Best-effort marker extraction from raw report text without an LLM.
        Produces the same shape as the AI pipeline so the frontend can render insights.
        """
        markers = self._extract_markers_from_text(extracted_text)
        markers = self.validate_marker_ranges(markers)

        deficiencies: List[str] = []
        warnings: List[str] = []
        suggestions: List[str] = []

        for m in markers:
            status = (m.get("status") or "normal").lower()
            name = (m.get("name") or "").strip()
            name_l = name.lower()
            if status == "low":
                deficiencies.append(name)
            elif status == "high":
                warnings.append(f"High {name}")

            suggestions.extend(self._suggestions_for_marker(name_l, status))

        if not markers:
            warnings.append("Could not reliably detect lab markers from the extracted PDF text.")
            suggestions.extend(
                [
                    "Try uploading a text-based PDF (not a scanned image). If it's scanned, run OCR first.",
                    "Ensure the report contains readable values like 'Hemoglobin 13.2 g/dL' or 'Vitamin D: 18 ng/mL'.",
                ]
            )

        # De-duplicate while preserving order
        deficiencies = list(dict.fromkeys(deficiencies))
        warnings = list(dict.fromkeys(warnings))
        suggestions = list(dict.fromkeys(suggestions))

        report_date = self.extract_date(extracted_text)
        health_score = self.calculate_health_score(markers, warnings)

        return {
            "markers": markers,
            "deficiencies": deficiencies,
            "warnings": warnings,
            "suggestions": suggestions,
            "health_score": health_score,
            "extracted_text": extracted_text,
            "report_date": report_date,
        }

    def _extract_markers_from_text(self, text: str) -> List[Dict]:
        """
        Extract common lab markers from text by regex patterns.
        This is intentionally conservative: prefer returning fewer correct markers than many wrong ones.
        """
        candidates: List[Dict] = []

        # Normalize whitespace to help regex across line breaks
        normalized = re.sub(r"[ \t]+", " ", text)

        patterns = [
            ("hemoglobin", r"\b(?:hemoglobin|hb|hgb)\b\s*[:\-]?\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(g\/d?l|gm\/d?l|g\s*\/\s*d?l)?"),
            ("vitamin d", r"\b(?:vitamin\s*d|25[-\s]?oh\s*vitamin\s*d|vit\s*d|vitd)\b\s*[:\-]?\s*([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*(ng\/ml|ng\/m?l)?"),
            ("cholesterol", r"\b(?:total\s*cholesterol|cholesterol)\b\s*[:\-]?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)\s*(mg\/dl|mg\/d?l)?"),
            ("ldl cholesterol", r"\b(?:ldl(?:\s*cholesterol)?)\b\s*[:\-]?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)\s*(mg\/dl|mg\/d?l)?"),
            ("hdl cholesterol", r"\b(?:hdl(?:\s*cholesterol)?)\b\s*[:\-]?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)\s*(mg\/dl|mg\/d?l)?"),
            ("triglycerides", r"\b(?:triglycerides|tg)\b\s*[:\-]?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)\s*(mg\/dl|mg\/d?l)?"),
            ("glucose", r"\b(?:fasting\s*glucose|glucose|blood\s*sugar|fbs)\b\s*[:\-]?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)\s*(mg\/dl|mg\/d?l)?"),
            ("iron", r"\b(?:iron|serum\s*iron)\b\s*[:\-]?\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)\s*(µg\/dl|ug\/dl|mcg\/dl)?"),
            ("calcium", r"\b(?:calcium|serum\s*calcium)\b\s*[:\-]?\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(mg\/dl|mg\/d?l)?"),
            ("sodium", r"\b(?:sodium|na)\b\s*[:\-]?\s*([0-9]{2,3}(?:\.[0-9]{1,2})?)\s*(meq\/l|mmol\/l)?"),
            ("potassium", r"\b(?:potassium|k)\b\s*[:\-]?\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(meq\/l|mmol\/l)?"),
        ]

        for marker_name, pattern in patterns:
            match = re.search(pattern, normalized, re.IGNORECASE)
            if not match:
                continue

            value = match.group(1)
            unit = (match.group(2) or "").strip() or None
            try:
                num = float(value)
            except ValueError:
                num = None

            # Store with the same keys the frontend expects.
            candidates.append(
                {
                    "name": marker_name.title(),
                    "value": f"{value} {unit}".strip() if unit else str(value),
                    "num": num,
                    "unit": unit,
                    "status": "normal",
                    "reference_range": self._get_reference_range(marker_name),
                }
            )

        return candidates

    def _suggestions_for_marker(self, name: str, status: str) -> List[str]:
        """
        Lightweight, non-LLM suggestions. Keep them actionable and safe.
        """
        if status not in {"low", "high"}:
            return []

        if name in {"vitamin d"} and status == "low":
            return [
                "Get 15–20 minutes of sunlight (if appropriate) and discuss Vitamin D supplementation with your doctor.",
                "Include Vitamin D rich foods (egg yolk, fortified milk, fatty fish).",
            ]
        if name in {"iron"} and status == "low":
            return [
                "Increase iron-rich foods (spinach, lentils, beans, red meat) and pair with Vitamin C for absorption.",
                "Avoid tea/coffee immediately around iron-rich meals.",
            ]
        if name in {"hemoglobin"} and status == "low":
            return [
                "Discuss possible anemia causes with a clinician; consider iron, B12, and folate evaluation.",
                "Add iron + folate rich foods (leafy greens, legumes).",
            ]
        if name in {"cholesterol", "ldl cholesterol", "triglycerides"} and status == "high":
            return [
                "Reduce saturated/trans fats; prioritize fiber (oats, fruits, vegetables) and healthy fats (nuts, olive oil).",
                "Aim for 150 minutes/week of moderate activity if medically appropriate.",
            ]
        if name in {"glucose", "blood sugar"} and status == "high":
            return [
                "Prefer low-glycemic carbs, add protein/fiber to meals, and limit sugary drinks/snacks.",
                "Consider a fasting glucose/HbA1c follow-up if this was a fasting test.",
            ]
        if name in {"sodium"} and status == "high":
            return ["Reduce packaged/processed foods and discuss fluid/blood pressure management with your clinician."]
        if name in {"potassium"} and status == "low":
            return ["Include potassium-rich foods (banana, citrus, coconut water) and review medications with your clinician."]
        return []
    
    async def extract_markers(self, markers: List[Dict]) -> List[Dict]:
        """
        Extract and normalize health markers.
        
        Args:
            markers: Raw marker data from AI
            
        Returns:
            Enhanced marker list with normalized names and numeric values
        """
        enhanced_markers = []
        
        for marker in markers:
            # Normalize marker name
            name = marker.get("name", "").lower().strip()
            normalized_name = self.normalize_marker_name(name)
            
            # Extract numeric value
            value_str = marker.get("value", "")
            numeric_value, unit = self._extract_numeric_value(value_str)
            
            # Determine status if not provided
            status = marker.get("status", "normal").lower()
            
            enhanced_marker = {
                "name": normalized_name.title(),
                "value": value_str,
                "num": numeric_value,
                "unit": unit,
                "status": status,
                "reference_range": self._get_reference_range(normalized_name)
            }
            
            enhanced_markers.append(enhanced_marker)
        
        return enhanced_markers
    
    def normalize_marker_name(self, name: str) -> str:
        """
        Normalize marker names to standard medical terminology.
        
        Args:
            name: Raw marker name
            
        Returns:
            Normalized marker name
        """
        name_lower = name.lower().strip()
        
        # Check aliases
        if name_lower in self.MARKER_ALIASES:
            return self.MARKER_ALIASES[name_lower]
        
        # Remove common prefixes/suffixes
        name_lower = re.sub(r'\s*\(.*?\)\s*', '', name_lower)  # Remove parentheses
        name_lower = re.sub(r'\s+', ' ', name_lower).strip()  # Normalize whitespace
        
        return name_lower
    
    def validate_marker_ranges(self, markers: List[Dict]) -> List[Dict]:
        """
        Validate markers against reference ranges.
        
        Args:
            markers: List of marker dictionaries
            
        Returns:
            Markers with updated status based on reference ranges
        """
        for marker in markers:
            name = marker.get("name", "").lower()
            numeric_value = marker.get("num")
            
            if numeric_value is None:
                continue
            
            # Check if we have a reference range
            if name in self.REFERENCE_RANGES:
                ref = self.REFERENCE_RANGES[name]
                
                if numeric_value < ref["min"]:
                    marker["status"] = "low"
                elif numeric_value > ref["max"]:
                    marker["status"] = "high"
                else:
                    marker["status"] = "normal"
                
                marker["reference_range"] = f"{ref['min']}-{ref['max']} {ref['unit']}"
        
        return markers
    
    def calculate_health_score(self, markers: List[Dict], warnings: List[str]) -> int:
        """
        Calculate health score (0-100).
        
        Args:
            markers: List of health markers
            warnings: List of warnings
            
        Returns:
            Health score between 0 and 100
        """
        # Start with perfect score
        score = 100
        
        # Deduct points for abnormal markers
        abnormal_markers = [m for m in markers if m.get("status", "normal") != "normal"]
        score -= len(abnormal_markers) * 10
        
        # Deduct points for warnings
        score -= len(warnings) * 5
        
        # Ensure score is within bounds
        return max(15, min(100, score))
    
    def extract_date(self, text: str) -> Optional[str]:
        """
        Extract date from report text.
        
        Args:
            text: Report text
            
        Returns:
            Extracted date string or None
        """
        # Common date patterns
        patterns = [
            r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',  # MM/DD/YYYY or DD-MM-YYYY
            r'\d{4}[/-]\d{1,2}[/-]\d{1,2}',    # YYYY-MM-DD
            r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}',  # Month DD, YYYY
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return None
    
    async def call_huggingface_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """
        Call HuggingFace API with exponential backoff retry.
        
        Args:
            prompt: Prompt for the model
            max_retries: Maximum number of retry attempts
            
        Returns:
            Generated text response
            
        Raises:
            HuggingFaceAPIError: If all retries fail
        """
        async def _call():
            return await self.call_huggingface(prompt)
        
        try:
            return await retry_with_backoff(_call, max_retries=max_retries)
        except Exception as e:
            raise HuggingFaceAPIError(
                f"Failed to analyze report after {max_retries} attempts",
                status_code=502,
                details={"last_error": str(e)}
            )
    
    async def call_huggingface(self, prompt: str) -> str:
        """
        Call HuggingFace API with circuit breaker protection.
        
        Args:
            prompt: Prompt for the model
            
        Returns:
            Generated text response
            
        Raises:
            HuggingFaceAPIError: If API call fails
        """
        def _make_request():
            headers = {"Authorization": f"Bearer {self.hf_token}"}
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 800,
                    "return_full_text": False,
                    "temperature": 0.1,
                }
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=120)
            
            if response.status_code != 200:
                raise HuggingFaceAPIError(
                    f"HuggingFace API error: {response.text[:300]}",
                    status_code=response.status_code
                )
            
            result = response.json()
            if result and isinstance(result, list) and result[0].get("generated_text"):
                return result[0]["generated_text"]
            
            raise HuggingFaceAPIError("HuggingFace returned an empty response.", status_code=502)
        
        # Use circuit breaker
        return self.circuit_breaker.call(_make_request)
    
    def _build_analysis_prompt(self, text: str) -> str:
        """Build prompt for analysis."""
        return f"""[INST] You are a medical data extraction AI. You will receive text extracted from a patient's medical lab report.

Your task is to:
1. Extract ALL nutritional and health markers present in the text
2. Identify deficiencies, excesses, and warnings
3. Generate targeted dietary suggestions

Output ONLY valid JSON — no explanations, no text before or after the JSON:
{{
  "markers": [
    {{ "name": "Marker Name", "value": "12 ng/mL", "num": 12, "status": "low|normal|high" }}
  ],
  "deficiencies": ["Iron", "Vitamin D"],
  "warnings": ["High Cholesterol"],
  "suggestions": ["Eat spinach daily", "Take Vitamin D supplements", "Reduce oily food"]
}}

Medical Report Text:
{text}
[/INST]"""
    
    def _parse_json_from_response(self, raw_text: str) -> Dict:
        """Parse JSON from LLM response."""
        match = re.search(r'\{[\s\S]*\}', raw_text)
        if not match:
            return {}
        
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return {}
    
    def _extract_numeric_value(self, value_str: str) -> Tuple[Optional[float], Optional[str]]:
        """Extract numeric value and unit from string."""
        # Pattern to match number with optional decimal and unit
        pattern = r'([\d.]+)\s*([a-zA-Zµ/]+)?'
        match = re.search(pattern, str(value_str))
        
        if match:
            try:
                numeric = float(match.group(1))
                unit = match.group(2) if match.group(2) else None
                return numeric, unit
            except ValueError:
                pass
        
        return None, None
    
    def _get_reference_range(self, marker_name: str) -> Optional[str]:
        """Get reference range for a marker."""
        name_lower = marker_name.lower()
        if name_lower in self.REFERENCE_RANGES:
            ref = self.REFERENCE_RANGES[name_lower]
            return f"{ref['min']}-{ref['max']} {ref['unit']}"
        return None
