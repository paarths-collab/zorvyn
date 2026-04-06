from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from backend.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    role: UserRole

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    permission_overrides: Optional[list[str]] = None
    permission_expires_at: Optional[datetime] = None

class UserResponse(UserBase):
    id: int
    is_promoted_admin: bool = False
    permission_overrides: Optional[str] = None
    permission_expires_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    user_id: Optional[int] = None
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool = True

    @property
    def id(self) -> Optional[int]:
        return self.user_id or self.sub
