from typing import List
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from backend.core.config import settings
from backend.db.session import get_db
from backend.models.user import UserRole
from backend.schemas.user import TokenPayload
from backend.core.permissions import Permission, has_permission
from backend.core.errors import AuthenticationError, PermissionDeniedError

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    token: str = Depends(reusable_oauth2),
) -> TokenPayload:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise AuthenticationError("Could not validate credentials")

    if token_data.id is None:
        raise AuthenticationError("Could not validate credentials")

    return token_data

def get_current_active_user(
    current_user: TokenPayload = Depends(get_current_user),
) -> TokenPayload:
    if not current_user.is_active:
        raise AuthenticationError("Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: TokenPayload = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise PermissionDeniedError("The user doesn't have enough privileges")
        return user


class PermissionChecker:
    def __init__(self, permission: Permission):
        self.permission = permission

    def __call__(self, user: TokenPayload = Depends(get_current_active_user)):
        if not has_permission(user.role, self.permission):
            raise PermissionDeniedError("The user doesn't have enough privileges")
        return user
