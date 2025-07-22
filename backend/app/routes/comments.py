from fastapi import APIRouter, HTTPException
from ..schemas.models import CommentRequest
from ..services.openai_client import get_openai_client
from typing import List, Dict, Any

router = APIRouter()

@router.post('/generate-comments')
async def generate_comments(data: CommentRequest) -> Dict[str, List[Dict[str, str]]]:
    """
    Generate AI-powered comment suggestions for LinkedIn posts
    
    Args:
        data: CommentRequest containing post_text and author
        
    Returns:
        dict: JSON object with "comments" array containing type and text
        
    Raises:
        HTTPException: If OpenAI API fails, configuration is invalid, or post_text is missing
    """
    # Validate required fields
    if not data.post_text or not data.post_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="post_text is required and cannot be empty"
        )
    
    try:
        client = get_openai_client()
        
        prompt = f"""
You are a professional LinkedIn engagement coach. Given the following LinkedIn post content, generate 3 comments: 1) an insightful contribution, 2) a thought-provoking question, and 3) a hybrid comment that adds value and invites discussion. Respond with only a JSON array of objects like: [{{type: 'insight', text: '...'}}, ...]

Post: {data.post_text}
Author: {data.author}

Ensure each comment object has 'type' and 'text' fields.
"""
        
        # Generate response using centralized client
        response_text = await client.generate_response(prompt)
        # Remove Markdown code block if present
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[len('```json'):].strip()
        if response_text.startswith('```'):
            response_text = response_text[len('```'):].strip()
        if response_text.endswith('```'):
            response_text = response_text[:-len('```')].strip()
        
        # Parse JSON response
        comments = client.parse_json_response(response_text)
        
        # Validate and provide fallback if parsing fails
        if not comments or not isinstance(comments, list):
            # Fallback: try to parse as list of dicts from lines
            comments = []
            for line in response_text.split('\n'):
                if line.strip() and not line.strip().startswith('[') and not line.strip().startswith(']'):
                    comments.append({
                        "type": "suggestion", 
                        "text": line.strip('- ').strip()
                    })
        
        # Ensure we have exactly 3 comments with proper structure
        valid_comments = []
        comment_types = ["insight", "question", "combo"]
        
        for i, comment in enumerate(comments[:3]):
            if isinstance(comment, dict) and "text" in comment:
                valid_comments.append({
                    "type": comment.get("type", comment_types[i] if i < len(comment_types) else "suggestion"),
                    "text": comment["text"]
                })
            elif isinstance(comment, str):
                valid_comments.append({
                    "type": comment_types[i] if i < len(comment_types) else "suggestion",
                    "text": comment
                })
        
        # Pad with default comments if needed
        while len(valid_comments) < 3:
            valid_comments.append({
                "type": "suggestion",
                "text": "Great post! Thanks for sharing."
            })
        
        return {"comments": valid_comments}
        
    except HTTPException:
        # Re-raise HTTP exceptions (like API key missing)
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Comment generation failed: {str(e)}"
        ) 