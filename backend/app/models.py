from datetime import date as date_type, datetime
from pydantic import BaseModel, Field, field_validator


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.-]+$")
    password: str = Field(..., min_length=8, max_length=72)
    email: str | None = Field(None, max_length=120)
    phone_number: str | None = Field(None, max_length=40)
    avatar_url: str | None = None

    @field_validator("username", "phone_number", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return clean_text(value)


class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=72)

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value):
        return clean_text(value)


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

    @field_validator("category_name", "category_icon", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return clean_text(value)


class CategoryUpdate(BaseModel):
    category_name: str | None = Field(None, min_length=1, max_length=120)
    category_type: str | None = Field(None, pattern="^(income|expense)$")
    category_icon: str | None = Field(None, max_length=80)
    monthly_limit: float | None = Field(None, ge=0)

    @field_validator("category_name", "category_icon", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return clean_text(value)


class TransactionCreate(BaseModel):
    vendor: str = Field(..., min_length=1, max_length=255)
    category_id: int = Field(..., gt=0)
    amount: float = Field(..., gt=0)
    date: date_type
    type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    notes: str | None = None
    goal_id: int | None = Field(None, gt=0)

    @field_validator("vendor", "notes", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return clean_text(value)


class TransactionUpdate(BaseModel):
    vendor: str | None = Field(None, min_length=1, max_length=255)
    category_id: int | None = None
    amount: float | None = Field(None, gt=0)
    date: date_type | None = None
    type: str | None = Field(None, pattern="^(INCOME|EXPENSE)$")
    notes: str | None = None
    goal_id: int | None = Field(None, gt=0)

    @field_validator("vendor", "notes", mode="before")
    @classmethod
    def normalize_text(cls, value):
        return clean_text(value)


class SavingsGoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    target_amount: float = Field(..., gt=0)
    initial_amount: float = Field(0, ge=0)
    target_date: date_type | None = None

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value):
        return clean_text(value)


class GoalContributionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    date: date_type | None = None
    note: str | None = Field(None, max_length=500)

    @field_validator("note", mode="before")
    @classmethod
    def normalize_note(cls, value):
        return clean_text(value)


class ChatSectionCreate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value):
        return clean_text(value)


class ChatSectionUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value):
        return clean_text(value)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    section_id: str


class UserSettingsUpdate(BaseModel):
    preferred_currency: str | None = Field(None, pattern="^(vnd|usd|eur)$")
    avatar_url: str | None = None
    phone_number: str | None = Field(None, max_length=40)

    @field_validator("phone_number", mode="before")
    @classmethod
    def normalize_phone(cls, value):
        return clean_text(value)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=72)
    confirm_new_password: str | None = Field(None, min_length=8, max_length=72)


class ProfilePhotoUpload(BaseModel):
    image_base64: str = Field(..., min_length=1)
    mime_type: str = Field("image/jpeg", pattern="^image/(jpeg|jpg|png|webp)$")
    filename: str | None = Field(None, max_length=160)


class PushTokenRequest(BaseModel):
    device_token: str = Field(..., min_length=16, max_length=4096)
    platform: str = Field(..., pattern="^(ios|android|web)$")

    @field_validator("device_token", mode="before")
    @classmethod
    def normalize_token(cls, value):
        return clean_text(value)


class PushTokenDeleteRequest(BaseModel):
    device_token: str = Field(..., min_length=16, max_length=4096)

    @field_validator("device_token", mode="before")
    @classmethod
    def normalize_token(cls, value):
        return clean_text(value)


class ChatMessage(BaseModel):
    user_id: int
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
