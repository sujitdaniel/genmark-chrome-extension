from fastapi import APIRouter, HTTPException
from ..schemas.models import ProfileData
from ..services.openai_client import get_openai_client
from typing import List
import json

router = APIRouter()

@router.post('/analyze-profile')
async def analyze_profile(data: ProfileData) -> dict:
    """
    Analyze LinkedIn profile data and provide AI-powered improvement suggestions
    
    Args:
        data: ProfileData containing banner_present, headline, about, and services
        
    Returns:
        dict: JSON object with "suggestions" array
        
    Raises:
        HTTPException: If OpenAI API fails or configuration is invalid
    """
    try:
        client = get_openai_client()

        # Refined prompt to enforce clean JSON response
        prompt = f"""
You are a LinkedIn profile expert. Analyze the following profile data and provide exactly 3 actionable improvement suggestions.

Banner present: {data.banner_present}
Headline: {data.headline}
About: {data.about}
Services: {data.services}

Respond ONLY with a valid JSON array of 3 strings like:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]
Do NOT include any markdown, explanation, or formatting outside the array.
"""

        # Generate response using centralized client
        response_text = await client.generate_response(prompt)

        # Attempt to parse JSON directly
        try:
            suggestions = json.loads(response_text)
        except json.JSONDecodeError:
            # Strip markdown block indicators if present
            cleaned = response_text.replace("```json", "").replace("```", "").strip()
            try:
                suggestions = json.loads(cleaned)
            except json.JSONDecodeError:
                # Last-resort fallback: split by lines
                suggestions = [
                    line.strip('- ').strip()
                    for line in cleaned.split('\n')
                    if line.strip() and not line.strip().startswith('[') and not line.strip().startswith(']')
                ][:3]

        if not suggestions or not isinstance(suggestions, list):
            raise ValueError("Invalid suggestion format returned from model")

        return {"suggestions": suggestions}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Profile analysis failed: {str(e)}"
        )
