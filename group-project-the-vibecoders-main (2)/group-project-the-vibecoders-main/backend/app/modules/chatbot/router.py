from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from uuid import UUID

from app.core.database import get_session
from app.modules.auth.deps import get_current_user_id
from app.modules.chatbot import service
from app.modules.chatbot.schemas import ChatRequest, ChatResponse, SectionSummary, SectionDetail, SectionUpdate

router = APIRouter()

@router.post("/sections", response_model=SectionSummary, status_code=status.HTTP_201_CREATED)
async def create_new_section(
    user_id: str = Depends(get_current_user_id)
):
    """
    Explicitly create a new chat section/session.
    """
    return await service.create_section(UUID(user_id))

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    """
    Send a message to the AI agent. 
    A valid section_id must be provided in the request body.
    """
    return await service.handle_chat(
        user_id=UUID(user_id),
        message_text=request.message,
        session=session,
        section_id=request.section_id
    )

@router.get("/sections", response_model=List[SectionSummary])
async def get_sections(
    user_id: str = Depends(get_current_user_id)
):
    """
    List all chat sessions for the current user.
    """
    return await service.get_user_sections(UUID(user_id))

@router.get("/sections/{section_id}", response_model=SectionDetail)
async def get_section(
    section_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Retrieve full history and details for a specific chat section.
    """
    return await service.get_section_detail(UUID(user_id), section_id)

@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a specific chat section and its associated history.
    """
    await service.delete_section(UUID(user_id), section_id)

@router.put("/sections/{section_id}", response_model=SectionSummary)
async def update_section(
    section_id: str,
    update_data: SectionUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Update the name of a specific chat section.
    """
    return await service.update_section_name(UUID(user_id), section_id, update_data.name)
