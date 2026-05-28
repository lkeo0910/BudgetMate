from uuid import UUID
import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(max_length=72)
    profile_avatar: Optional[str] = None
    phone_number: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        # Check length and complexity (letter, number, special character)
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
            
        if not all([
            re.search(r'[A-Za-z]', v),
            re.search(r'\d', v),
            re.search(r'[!@#$%^&*(),.?":{}|<>]', v)
        ]):
            raise ValueError('Password must include at least one letter, one number, and one special character')
        return v

class UserLogin(BaseModel):
    username: str
    password: str = Field(max_length=72)

class RegisterVerify(BaseModel):
    email: EmailStr
    code: str

class UserResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    profile_avatar: str | None = None
    phone_number: str | None = None
class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
class LoginResponse(AccessTokenResponse):
    user: UserResponse 