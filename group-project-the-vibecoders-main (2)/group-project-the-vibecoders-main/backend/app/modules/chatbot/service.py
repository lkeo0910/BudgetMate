from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID
from bson import ObjectId
from sqlmodel import Session

from app.core.mongodb import get_mongodb_db
from app.modules.chatbot.models import ChatSection, Message
from app.modules.chatbot.agent_service import run_chatbot_agent
from app.modules.chatbot.schemas import ChatResponse, SectionSummary, SectionDetail
from app.shared.exception.chatbot_exception import ChatSectionNotFoundException, ChatbotGeneralException

async def create_section(user_id: UUID) -> SectionSummary:
    """Explicitly create a new chat section."""
    db = get_mongodb_db()
    collection = db["chat_sections"]
    
    try:
        new_section = ChatSection(user_id=user_id)
        result = await collection.insert_one(new_section.model_dump(by_alias=True, exclude={"id"}))
        section_id = str(result.inserted_id)
        
        return SectionSummary(
            section_id=section_id,
            date=new_section.updated_at
        )
    except Exception as e:
        raise ChatbotGeneralException(f"Failed to create chat section: {str(e)}")

async def handle_chat(
    user_id: UUID,
    message_text: str,
    session: Session,
    section_id: str
) -> ChatResponse:
    """Handle a chat message within an EXISTING section."""
    section_id = section_id.strip()
    db = get_mongodb_db()
    collection = db["chat_sections"]

    # 1. Retrieve section
    section_doc = await collection.find_one({"_id": ObjectId(section_id), "user_id": user_id})
    
    if not section_doc:
        raise ChatSectionNotFoundException()
    
    # 2. Run AI Agent
    try:
        ai_response_text = await run_chatbot_agent(message_text, user_id, session, section_id)
    except Exception as e:
        raise ChatbotGeneralException(f"AI Agent error: {str(e)}")

    # 3. Update section updated_at timestamp and push clean messages
    now = datetime.now(timezone.utc)
    user_msg = Message(role="user", content=message_text, timestamp=now).model_dump()
    ai_msg = Message(role="ai", content=ai_response_text, timestamp=now).model_dump()

    await collection.update_one(
        {"_id": ObjectId(section_id)},
        {
            "$set": {"updated_at": now},
            "$push": {"messages": {"$each": [user_msg, ai_msg]}}
        }
    )

    return ChatResponse(
        section_id=section_id,
        response=ai_response_text
    )

async def get_user_sections(user_id: UUID) -> List[SectionSummary]:
    db = get_mongodb_db()
    collection = db["chat_sections"]
    
    cursor = collection.find({"user_id": user_id}).sort("updated_at", -1)
    sections = await cursor.to_list(length=100)
    
    return [
        SectionSummary(
            section_id=str(s["_id"]),
            name=s.get("name"),
            date=s["updated_at"]
        ) for s in sections
    ]

async def get_section_detail(user_id: UUID, section_id: str) -> SectionDetail:
    section_id = section_id.strip()
    db = get_mongodb_db()
    collection = db["chat_sections"]
    
    section = await collection.find_one({"_id": ObjectId(section_id), "user_id": user_id})
    if not section:
        raise ChatSectionNotFoundException()
        
    return SectionDetail(
        section_id=str(section["_id"]),
        user_id=section["user_id"],
        name=section.get("name"),
        messages=section.get("messages", []),
        created_at=section["created_at"],
        updated_at=section["updated_at"]
    )

async def delete_section(user_id: UUID, section_id: str) -> None:
    section_id = section_id.strip()
    db = get_mongodb_db()
    collection = db["chat_sections"]
    
    # 1. Check if section exists and belongs to the user
    section = await collection.find_one({"_id": ObjectId(section_id), "user_id": user_id})
    if not section:
        raise ChatSectionNotFoundException()
        
    # 2. Delete the section
    await collection.delete_one({"_id": ObjectId(section_id)})
    
    # 3. Delete related history from Langchain's chat_history collection
    history_collection = db["chat_history"]
    await history_collection.delete_many({"SessionId": section_id})

async def update_section_name(user_id: UUID, section_id: str, name: str) -> SectionSummary:
    section_id = section_id.strip()
    db = get_mongodb_db()
    collection = db["chat_sections"]
    
    section = await collection.find_one({"_id": ObjectId(section_id), "user_id": user_id})
    if not section:
        raise ChatSectionNotFoundException()
        
    now = datetime.now(timezone.utc)
    await collection.update_one(
        {"_id": ObjectId(section_id)},
        {"$set": {"name": name[:100], "updated_at": now}}
    )
    
    return SectionSummary(
        section_id=section_id,
        name=name[:100],
        date=now
    )
