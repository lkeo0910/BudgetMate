import uuid
import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.users.models import User, Category

from enum import Enum

class TransactionType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

class Transaction(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    
    # Frontend mapped fields
    vendor: str
    category_id: uuid.UUID = Field(foreign_key="category.id", index=True)
    amount: float
    date: datetime.date
    type: TransactionType = Field(description="'INCOME' or 'EXPENSE'")
    notes: Optional[str] = None
    
    created_at: datetime.datetime = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at: datetime.datetime = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    user: Optional["User"] = Relationship(back_populates="transactions")
    category_obj: Optional["Category"] = Relationship(back_populates="transactions")
