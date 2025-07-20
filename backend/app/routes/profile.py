from fastapi import APIRouter, HTTPException
from ..schemas.models import ProfileData
from ..services.openai_client import get_openai_client
from typing import List

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
        
        # Compose prompt for GPT-4o-mini
        prompt = f"""
You are a LinkedIn profile expert. Analyze the following profile data and provide 3 actionable improvement suggestions:

Banner present: {data.banner_present}
Headline: {data.headline}
About: {data.about}
Services: {data.services}

Respond with a JSON array of suggestions. Each suggestion should be a string.
Example format: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
"""

        # Generate response using centralized client
        response_text = await client.generate_response(prompt)
        
        # Parse JSON response
        suggestions = client.parse_json_response(response_text)
        
        # Fallback if JSON parsing fails
        if not suggestions or not isinstance(suggestions, list):
            # Split by lines and clean up
            suggestions = [
                line.strip('- ').strip() 
                for line in response_text.split('\n') 
                if line.strip() and not line.strip().startswith('[') and not line.strip().startswith(']')
            ][:3]  # Limit to 3 suggestions
        
        return {"suggestions": suggestions}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like API key missing)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Profile analysis failed: {str(e)}"
        ) 