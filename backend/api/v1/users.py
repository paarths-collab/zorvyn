from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.api.deps import PermissionChecker, get_db
from backend.core.permissions import Permission
from backend.schemas.user import UserResponse, UserUpdate
from backend.services import user as user_service

router = APIRouter()
check_manage_users = PermissionChecker(Permission.MANAGE_USERS)


@router.get("/", response_model=List[UserResponse])
@router.get("", response_model=List[UserResponse], include_in_schema=False)
def read_users(
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user=Depends(check_manage_users),
) -> List[UserResponse]:
    return user_service.get_users(db, skip=skip, limit=limit)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(check_manage_users),
) -> UserResponse:
    db_user = user_service.get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user_service.update_user(db, db_user=db_user, user_in=user_in)


@router.post("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(check_manage_users),
) -> UserResponse:
    db_user = user_service.get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user_service.deactivate_user(db, db_user=db_user)
