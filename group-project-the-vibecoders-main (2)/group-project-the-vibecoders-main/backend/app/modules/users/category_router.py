from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.core.database import get_session
from app.modules.auth.deps import get_current_user_id
from app.modules.users.category_service import (
    get_user_categories, 
    create_category, 
    update_category, 
    delete_category
)
from app.modules.users.schemas import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter()

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return get_user_categories(session, UUID(user_id))

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(
    data: CategoryCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return create_category(session, UUID(user_id), data)

@router.put("/{category_id}", response_model=CategoryResponse)
def edit_category(
    category_id: UUID,
    data: CategoryUpdate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return update_category(session, category_id, UUID(user_id), data)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_category(
    category_id: UUID,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    delete_category(session, category_id, UUID(user_id))
