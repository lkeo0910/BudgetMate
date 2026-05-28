from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatSection(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: UUID
    name: Optional[str] = Field(None, max_length=100)
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
