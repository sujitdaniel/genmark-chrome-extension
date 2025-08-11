import openai
import os
import json
import re
import time
from typing import Any, Optional, List, Dict
from fastapi import HTTPException

FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)

def _strip_code_fences(s: str) -> str:
    return FENCE_RE.sub("", s).strip()

def _json_repair(s: str) -> Optional[Any]:
    # Quick repairs: smart quotes → regular, trailing commas, etc.
    s = s.replace("“", '"').replace("”", '"').replace("’", "'")
    # Remove trailing commas in arrays/objects
    s = re.sub(r",\s*([\]}])", r"\1", s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return None

class OpenAIClient:
    """Centralized OpenAI client for all API interactions"""

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file."
            )
        try:
            # The modern client constructor usually doesn't take api_key directly;
            # use env or explicit configuration here. Keeping your pattern:
            self.client = openai.OpenAI(api_key=api_key)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize OpenAI client: {str(e)}"
            )

        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.timeout = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "20"))
        self.max_retries = int(os.getenv("OPENAI_MAX_RETRIES", "2"))

    async def generate_response(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_tokens: int = 256,
        temperature: float = 0.7
    ) -> str:
        """Call OpenAI with simple retry & timeout."""
        model = model or self.model
        last_err = None
        for attempt in range(self.max_retries + 1):
            try:
                start = time.time()
                resp = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a LinkedIn engagement coach. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    timeout=self.timeout,  # supported by newer SDKs; if not, wrap with your own timeout
                )
                text = resp.choices[0].message.content or ""
                return text
            except Exception as e:
                last_err = e
                if attempt < self.max_retries:
                    time.sleep(0.4 * (attempt + 1))
                else:
                    raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
        # should never reach
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(last_err)}")

    def parse_json_response(self, response_text: str) -> Any:
        """Fence-proof parsing with repair pass."""
        cleaned = _strip_code_fences(response_text)
        # fast path
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass
        # repair path
        repaired = _json_repair(cleaned)
        return repaired
        

# Global client instance
openai_client = None

def get_openai_client() -> OpenAIClient:
    global openai_client
    if openai_client is None:
        openai_client = OpenAIClient()
    return openai_client
