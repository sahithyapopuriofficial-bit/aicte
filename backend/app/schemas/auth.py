# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserProfileResponse(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    role: str
    institution_id: Optional[UUID] = None
    region_id: Optional[UUID] = None
    account_status: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    detail: str