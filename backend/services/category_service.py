"""Category service for automatic report categorization."""
import re
import json
import requests
from typing import List, Dict, Tuple
from services.error_handling import HuggingFaceAPIError


class CategoryService:
    """Service for automatic medical report categorization."""
    
    CATEGORIES = [
        "Blood Test",
        "Radiology",
        "Pathology",
        "Cardiology",
        "Endocrinology",
        "General"
    ]
    
    # Keywords for category detection
    CATEGORY_KEYWORDS = {
        "Blood Test": ["hemoglobin", "wbc", "rbc", "platelet", "glucose", "cholesterol", "cbc", "blood count"],
        "Radiology": ["x-ray", "ct scan", "mri", "ultrasound", "imaging", "radiograph", "scan"],
        "Pathology": ["biopsy", "tissue", "histology", "cytology", "pathology"],
        "Cardiology": ["ecg", "ekg", "echo", "cardiac", "heart", "troponin", "bnp"],
        "Endocrinology": ["thyroid", "tsh", "t3", "t4", "hormone", "insulin", "cortisol"],
    }
    
    def __init__(self, hf_token: str):
        """
        Initialize category service.
        
        Args:
            hf_token: HuggingFace API token
        """
        self.hf_token = hf_token
        self.api_url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    
    async def categorize_report(
        self,
        extracted_text: str,
        markers: List[Dict]
    ) -> Tuple[str, float]:
        """
        Categorize report using HuggingFace API with fallback to keyword matching.
        
        Args:
            extracted_text: Text extracted from report
            markers: List of extracted markers
            
        Returns:
            Tuple of (category_name, confidence_score)
        """
        # Try keyword-based categorization first (fast and reliable)
        keyword_category, keyword_confidence = self._categorize_by_keywords(
            extracted_text, markers
        )
        
        # If confidence is high enough, use keyword result
        if keyword_confidence >= 0.7:
            return keyword_category, keyword_confidence
        
        # Otherwise, try AI categorization
        try:
            ai_category, ai_confidence = await self._categorize_with_ai(
                extracted_text, markers
            )
            
            # Use AI result if confidence is higher
            if ai_confidence > keyword_confidence:
                return ai_category, ai_confidence
        except Exception as e:
            print(f"AI categorization failed: {e}")
        
        # Fall back to keyword result or General
        if keyword_confidence > 0.3:
            return keyword_category, keyword_confidence
        
        return "General", 0.5
    
    def _categorize_by_keywords(
        self,
        text: str,
        markers: List[Dict]
    ) -> Tuple[str, float]:
        """
        Categorize report based on keyword matching.
        
        Args:
            text: Report text
            markers: List of markers
            
        Returns:
            Tuple of (category, confidence)
        """
        text_lower = text.lower()
        marker_names = " ".join([m.get("name", "").lower() for m in markers])
        combined_text = text_lower + " " + marker_names
        
        # Count keyword matches for each category
        category_scores = {}
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in combined_text:
                    score += 1
            category_scores[category] = score
        
        # Find category with highest score
        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            best_score = category_scores[best_category]
            
            if best_score > 0:
                # Normalize confidence (cap at 0.9 for keyword matching)
                confidence = min(0.9, best_score / 5.0)
                return best_category, confidence
        
        return "General", 0.3
    
    async def _categorize_with_ai(
        self,
        text: str,
        markers: List[Dict]
    ) -> Tuple[str, float]:
        """
        Categorize report using AI.
        
        Args:
            text: Report text
            markers: List of markers
            
        Returns:
            Tuple of (category, confidence)
        """
        prompt = self.build_categorization_prompt(text, markers)
        
        try:
            response = await self._call_huggingface(prompt)
            category, confidence = self._parse_category_response(response)
            
            # Validate category
            if category not in self.CATEGORIES:
                return "General", 0.5
            
            return category, confidence
            
        except Exception as e:
            raise HuggingFaceAPIError(
                f"Failed to categorize report: {str(e)}",
                status_code=502
            )
    
    def build_categorization_prompt(
        self,
        text: str,
        markers: List[Dict]
    ) -> str:
        """
        Build prompt for category classification.
        
        Args:
            text: Report text (truncated)
            markers: List of markers
            
        Returns:
            Prompt string
        """
        marker_names = ", ".join([m.get("name", "") for m in markers[:10]])
        text_snippet = text[:500]
        
        categories_str = ", ".join(self.CATEGORIES)
        
        return f"""[INST] You are a medical report classifier. Classify the following medical report into ONE of these categories: {categories_str}

Report excerpt: {text_snippet}

Markers found: {marker_names}

Respond with ONLY the category name and confidence (0-1), in this format:
Category: [category name]
Confidence: [0.0-1.0]
[/INST]"""
    
    async def _call_huggingface(self, prompt: str) -> str:
        """Call HuggingFace API."""
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 50,
                "return_full_text": False,
                "temperature": 0.1,
            }
        }
        
        response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)
        
        if response.status_code != 200:
            raise Exception(f"API error: {response.text[:200]}")
        
        result = response.json()
        if result and isinstance(result, list) and result[0].get("generated_text"):
            return result[0]["generated_text"]
        
        raise Exception("Empty response from API")
    
    def _parse_category_response(self, response: str) -> Tuple[str, float]:
        """
        Parse category and confidence from AI response.
        
        Args:
            response: AI response text
            
        Returns:
            Tuple of (category, confidence)
        """
        # Try to extract category
        category_match = re.search(r'Category:\s*([A-Za-z\s]+)', response, re.IGNORECASE)
        confidence_match = re.search(r'Confidence:\s*([\d.]+)', response, re.IGNORECASE)
        
        category = "General"
        confidence = 0.5
        
        if category_match:
            category = category_match.group(1).strip()
        
        if confidence_match:
            try:
                confidence = float(confidence_match.group(1))
                confidence = max(0.0, min(1.0, confidence))  # Clamp to [0, 1]
            except ValueError:
                pass
        
        return category, confidence
