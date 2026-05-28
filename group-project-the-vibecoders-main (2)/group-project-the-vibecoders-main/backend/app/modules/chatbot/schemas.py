from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ChatRequest(BaseModel):
    message: str
    section_id: str

class MessageResponse(BaseModel):
    role: str
    content: str
    timestamp: datetime

class ChatResponse(BaseModel):
    section_id: str
    response: str = Field(
        ...,
        description=(
            "HTML body fragment produced by the BudgetMate agent. "
            "Render in the frontend via React's dangerouslySetInnerHTML, "
            "Vue's v-html, or equivalent. Contains only the safe subset "
            "of tags listed in the agent's system prompt (h3/h4, p, ul/ol/li, "
            "strong, em, br, table/thead/tbody/tr/th/td, span, small, hr)."
        ),
    )

class SectionSummary(BaseModel):
    section_id: str
    name: Optional[str] = None
    date: datetime

class SectionDetail(BaseModel):
    section_id: str
    user_id: UUID
    name: Optional[str] = None
    messages: List[MessageResponse]
    created_at: datetime
    updated_at: datetime

class SectionUpdate(BaseModel):
    name: str = Field(..., max_length=100)
