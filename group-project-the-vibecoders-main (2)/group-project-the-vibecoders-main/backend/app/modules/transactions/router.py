from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlmodel import Session
from app.core.database import get_session
from app.modules.auth.deps import get_current_user_id
from app.modules.transactions import agent_service, ocr_service, service
from app.modules.transactions.schemas import (
    ReceiptOCRResponse,
    TransactionCreate,
    TransactionFilters,
    TransactionResponse,
    TransactionUpdate,
)
from fastapi_pagination import Page

router = APIRouter()

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return service.create_transaction(session, UUID(user_id), data)


@router.post(
    "/receipt-ocr",
    response_model=ReceiptOCRResponse,
    response_description="Structured transaction draft parsed from a receipt image",
)
async def process_receipt_ocr(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    """
    Receipt processing pipeline:
    1. Validate the uploaded image.
    2. A Gemini Vision-powered LangChain agent analyzes the image directly 
       and parses it into a ReceiptOCRResponse.
    """
    file_bytes = await file.read()

    # Stage 1: Validation
    ocr_service.validate_image_upload(
        filename=file.filename or "receipt",
        content_type=file.content_type,
        file_bytes=file_bytes,
    )

    # Stage 2: AI Agent (Vision)
    return await agent_service.run_receipt_agent(
        image_bytes=file_bytes,
        content_type=file.content_type or "image/jpeg",
        user_id=UUID(user_id),
        session=session,
    )

@router.get("/", response_model=Page[TransactionResponse])
def get_all_transactions(
    filters: TransactionFilters = Depends(),
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return service.get_transactions(
        session=session,
        user_id=UUID(user_id),
        filters=filters
    )

@router.put("/{transaction_id}", response_model=Page[TransactionResponse] | TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    data: TransactionUpdate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    return service.update_transaction(session, transaction_id, UUID(user_id), data)

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session)
):
    service.delete_transaction(session, transaction_id, UUID(user_id))
