import openai
import os
import json
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

class OpenAIClient:
    """Centralized OpenAI client for all API interactions"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file."
            )
        self.client = openai.OpenAI(api_key=api_key)
    
    async def generate_response(
        self,
        prompt: str,
        model: str = "gpt-4o-mini",
        max_tokens: int = 256,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a response from OpenAI API with error handling
        
        Args:
            prompt: The prompt to send to OpenAI
            model: OpenAI model to use (default: gpt-4o-mini for cost efficiency)
            max_tokens: Maximum number of tokens in the response (default: 256)
            temperature: Sampling temperature (default: 0.7)
            
        Returns:
            Generated response text
            
        Raises:
            HTTPException: If API call fails
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"OpenAI API error: {str(e)}"
            )
    
    def parse_json_response(self, response_text: str) -> Any:
        """
        Safely parse JSON response from OpenAI
        
        Args:
            response_text: Raw response text from OpenAI
            
        Returns:
            Parsed JSON object or None if parsing fails
        """
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return None

# Global client instance
openai_client = None

def get_openai_client() -> OpenAIClient:
    """Get or create OpenAI client instance"""
    global openai_client
    if openai_client is None:
        openai_client = OpenAIClient()
    return openai_client 