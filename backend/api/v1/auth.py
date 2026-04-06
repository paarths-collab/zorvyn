from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from backend.core import security
from backend.core.config import settings
from backend.core.role_extractor import extract_role_from_email
from backend.core.errors import AppError
from backend.api.deps import get_current_active_user
from backend.core.permissions import get_effective_permissions_for_user
from backend.db.session import get_db
from backend.schemas.user import Token, TokenPayload, UserCreate, UserResponse
from backend.services import user as user_service

router = APIRouter()


class CurrentUserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    role: str
    is_active: bool
    effective_permissions: list[str]

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    try:
        user = user_service.authenticate_user(
            db, email=form_data.username, password=form_data.password
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return Token(
            access_token=security.create_access_token(
                user.id,
                role=user.role,
                full_name=user.full_name,
                is_active=user.is_active,
                expires_delta=access_token_expires,
            ),
            token_type="bearer",
        )
    except HTTPException:
        raise
    except AppError:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {type(exc).__name__}: {exc}",
        ) from exc

@router.post("/register", response_model=UserResponse)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> UserResponse:
    try:
        user = user_service.get_user_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this username already exists in the system.",
            )
        try:
            derived_role = extract_role_from_email(str(user_in.email))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        return user_service.create_user(db, user_in=user_in, role=derived_role)
    except HTTPException:
        raise
    except AppError:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {type(exc).__name__}: {exc}",
        ) from exc


@router.get("/me", response_model=CurrentUserResponse)
def read_current_user(
    current_user: TokenPayload = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    db_user = user_service.get_user_by_id(db, current_user.id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    effective_permissions = get_effective_permissions_for_user(
        db_user.role,
        permission_overrides=db_user.permission_overrides,
        permission_expires_at=db_user.permission_expires_at,
    )

    return CurrentUserResponse(
        id=db_user.id,
        email=str(db_user.email),
        full_name=db_user.full_name,
        role=db_user.role.value,
        is_active=db_user.is_active,
        effective_permissions=sorted([p.value for p in effective_permissions]),
    )
