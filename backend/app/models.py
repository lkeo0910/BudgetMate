from datetime import date as date_type, datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: str | None = None
    phone_number: str | None = None
    avatar_url: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None
    phone_number: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class CategoryCreate(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=120)
    category_type: str = Field(..., pattern="^(income|expense)$")
    category_icon: str | None = Field(None, max_length=80)
    monthly_limit: float | None = Field(None, ge=0)


class CategoryUpdate(BaseModel):
    category_name: str | None = Field(None, min_length=1, max_length=120)
    category_type: str | None = Field(None, pattern="^(income|expense)$")
    category_icon: str | None = Field(None, max_length=80)
    monthly_limit: float | None = Field(None, ge=0)


class TransactionCreate(BaseModel):
    vendor: str = Field(..., min_length=1, max_length=255)
    category_id: int
    amount: float = Field(..., gt=0)
    date: date_type
    type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    notes: str | None = None


class TransactionUpdate(BaseModel):
    vendor: str | None = Field(None, min_length=1, max_length=255)
    category_id: int | None = None
    amount: float | None = Field(None, gt=0)
    date: date_type | None = None
    type: str | None = Field(None, pattern="^(INCOME|EXPENSE)$")
    notes: str | None = None


class ChatMessage(BaseModel):
    user_id: int
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
