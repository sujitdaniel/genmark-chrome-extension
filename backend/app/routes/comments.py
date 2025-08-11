from fastapi import APIRouter, HTTPException
from ..schemas.models import CommentRequest
from ..services.openai_client import get_openai_client
from typing import List, Dict
import math

router = APIRouter()

def _dedupe_keep_order(items: List[str], min_ratio: float = 0.9) -> List[str]:
    """Remove near-duplicates by simple normalized containment / Jaccard-ish heuristic."""
    out: List[str] = []
    seen: List[str] = []
    for t in items:
        cand = " ".join(t.lower().split())
        if not cand:
            continue
        is_dup = False
        for s in seen:
            # containment or high overlap → consider duplicate
            if cand in s or s in cand:
                is_dup = True
                break
            a, b = set(cand.split()), set(s.split())
            if a and b:
                overlap = len(a & b) / float(len(a | b))
                if overlap >= min_ratio:
                    is_dup = True
                    break
        if not is_dup:
            out.append(t)
            seen.append(cand)
    return out

def _fallback_for(slot: str) -> str:
    if slot == "insight":
        return "One practical extension is piloting this approach with a small team to validate assumptions before scaling."
    if slot == "question":
        return "How did you weigh the trade-offs here—speed to value vs. long-term maintainability?"
    return "We’ve seen this work well when teams define one success metric upfront. Curious which metric you’d prioritize?"

@router.post('/generate-comments')
async def generate_comments(data: CommentRequest) -> Dict[str, List[Dict[str, str]]]:
    """
    Generate AI-powered comment suggestions for LinkedIn posts.
    """
    if not data.post_text or not data.post_text.strip():
        raise HTTPException(status_code=400, detail="post_text is required and cannot be empty")

    client = get_openai_client()

    # Optional knobs (backward compatible): tone/length from author field or future schema
    tone = "professional"
    length = "short"
    author = data.author or ""

    # Stronger prompt with explicit schema
    prompt = f"""
Return ONLY valid JSON matching this schema, no prose:
{{
  "comments":[
    {{"type":"insight","text":"string"}},
    {{"type":"question","text":"string"}},
    {{"type":"combo","text":"string"}}
  ]
}}

Rules:
- Audience: LinkedIn professionals.
- Tone: {tone}. Length: {length}.
- No emojis unless present in the post. Avoid clichés and generic praise.
- Be specific to the post. Don't fabricate facts beyond the text.
- The "question" must invite a concrete, forward-moving reply.

Post:
\"\"\"{data.post_text.strip()[:4000]}\"\"\"
Author: {author}
"""

    try:
        response_text = await client.generate_response(prompt, max_tokens=320, temperature=0.7)
        parsed = client.parse_json_response(response_text) or {}

        raw_comments = parsed.get("comments", parsed if isinstance(parsed, list) else [])
        # normalize to list of dicts
        normalized: List[Dict[str, str]] = []
        want_order = ["insight", "question", "combo"]

        # Accept both array-of-dicts or loose array
        for i, want in enumerate(want_order):
            # try to find object with that type
            obj = None
            if isinstance(raw_comments, list):
                obj = next((c for c in raw_comments if isinstance(c, dict) and c.get("type") == want), None)
                if not obj and i < len(raw_comments) and isinstance(raw_comments[i], dict):
                    obj = raw_comments[i]
            elif isinstance(raw_comments, dict) and "type" in raw_comments and "text" in raw_comments:
                obj = raw_comments

            text = (obj or {}).get("text", "").strip() if obj else ""
            if not text:
                text = _fallback_for(want)
            normalized.append({"type": want, "text": text})

        # light dedupe
        texts = [c["text"] for c in normalized]
        unique_texts = _dedupe_keep_order(texts)
        # If dedupe dropped something, re-fill with distinct fallbacks
        if len(unique_texts) < 3:
            for t in ["insight", "question", "combo"]:
                if len(unique_texts) >= 3:
                    break
                fb = _fallback_for(t)
                if fb not in unique_texts:
                    unique_texts.append(fb)
        # Ensure we have exactly 3 comments
        while len(unique_texts) < 3:
            for t in ["insight", "question", "combo"]:
                if len(unique_texts) >= 3:
                    break
                fb = _fallback_for(t)
                if fb not in unique_texts:
                    unique_texts.append(fb)
                    break
        # Update normalized comments with deduplicated texts
        for i, t in enumerate(unique_texts[:3]):
            if i < len(normalized):
                normalized[i]["text"] = t

        return {"comments": normalized}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comment generation failed: {str(e)}")
