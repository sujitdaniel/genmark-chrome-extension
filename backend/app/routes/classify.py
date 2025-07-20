from fastapi import APIRouter, HTTPException
from ..schemas.models import PostData
from ..services.openai_client import get_openai_client
from typing import Dict, Any

router = APIRouter()

@router.post('/classify-post')
async def classify_post(data: PostData) -> Dict[str, Any]:
    """
    Classify LinkedIn post content by industry, tone, topic, and summary
    
    Args:
        data: PostData containing post_text and author
        
    Returns:
        dict: JSON object with industry, tone, topic, and summary
        
    Raises:
        HTTPException: If OpenAI API fails or configuration is invalid
    """
    try:
        client = get_openai_client()
        
        # Compose prompt for GPT-4o-mini
        prompt = f"""
You are a LinkedIn content analyst. Analyze the following post and provide classification in JSON format:

Post: {data.post_text}
Author: {data.author}

Respond with a JSON object containing:
- industry: the industry this post relates to
- tone: the tone of the post (professional, casual, inspirational, etc.)
- topic: the main topic or theme
- summary: a brief summary of the post content

Format: {{"industry": "...", "tone": "...", "topic": "...", "summary": "..."}}
"""

        # Generate response using centralized client
        response_text = await client.generate_response(prompt)
        
        # Parse JSON response
        classification = client.parse_json_response(response_text)
        
        # Validate and provide fallback if parsing fails
        if not classification or not isinstance(classification, dict):
            classification = {
                "industry": "General",
                "tone": "Professional",
                "topic": "General Discussion",
                "summary": "Post content analysis"
            }
        
        # Ensure all required fields are present
        required_fields = ["industry", "tone", "topic", "summary"]
        for field in required_fields:
            if field not in classification:
                classification[field] = "Not specified"
        
        return classification
        
    except HTTPException:
        # Re-raise HTTP exceptions (like API key missing)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Post classification failed: {str(e)}"
        ) 