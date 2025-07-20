from pydantic import BaseModel
from typing import Optional

class ProfileData(BaseModel):
    banner_present: bool
    headline: str
    about: str
    services: str

class PostData(BaseModel):
    post_text: str
    author: str

class CommentRequest(BaseModel):
    post_text: str
    author: str = "" 