from pydantic import BaseModel, ConfigDict, Field
import datetime
from typing import Optional, List, Literal
from uuid import UUID

from app.modules.transactions.models import TransactionType

class TransactionFilters(BaseModel):
    search: Optional[str] = Field(None)
    type: Optional[TransactionType] = Field(None)
    category_ids: Optional[str] = Field(None, alias="categoryIds")
    date_from: Optional[datetime.date] = Field(None, alias="dateFrom")
    date_to: Optional[datetime.date] = Field(None, alias="dateTo")
    min_amount: Optional[float] = Field(None, alias="minAmount")
    max_amount: Optional[float] = Field(None, alias="maxAmount")
    page: Optional[int] = Field(None, ge=1)
    size: Optional[int] = Field(None, ge=1)
    order_by: Literal["date", "amount", "vendor"] = Field("date", alias="orderBy")
    order: Literal["asc", "desc"] = Field("desc")

    model_config = ConfigDict(populate_by_name=True)

# Matches frontend TransactionDraft
class TransactionCreate(BaseModel):
    vendor: str
    category_id: UUID
    amount: float
    date: datetime.date
    type: TransactionType
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    vendor: Optional[str] = None
    category_id: Optional[UUID] = None
    amount: Optional[float] = None
    date: Optional[datetime.date] = None
    type: Optional[TransactionType] = None
    notes: Optional[str] = None

# Matches frontend Transaction
class TransactionResponse(BaseModel):
    id: UUID
    vendor: str
    category_id: UUID
    amount: float
    date: datetime.date
    type: TransactionType
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReceiptOCRResponse(BaseModel):
    vendor: str
    category_id: Optional[UUID] = None
    amount: Optional[float] = None
    date: Optional[datetime.date] = None
    type: TransactionType = TransactionType.EXPENSE
    notes: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)
