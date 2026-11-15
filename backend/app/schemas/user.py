from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class UserResponse(UserBase):
        id: int
        role: UserRole
        is_active: bool
        created_at: datetime | None = None

        class Config:
            from_attributes = True
