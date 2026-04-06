from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.core.security import verify_password, get_password_hash
from backend.core.errors import AppError
from backend.models.user import User, UserRole
from backend.core.permissions import Permission
from backend.schemas.user import UserCreate, UserUpdate

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    try:
        return db.query(User).filter(User.email == email).first()
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while fetching user by email: {exc}", 500, "DB_GET_USER_EMAIL_ERROR") from exc

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    try:
        return db.query(User).filter(User.id == user_id).first()
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while fetching user by id: {exc}", 500, "DB_GET_USER_ID_ERROR") from exc


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    try:
        return db.query(User).offset(skip).limit(limit).all()
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while listing users: {exc}", 500, "DB_LIST_USERS_ERROR") from exc

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, user_in: UserCreate, role: UserRole) -> User:
    try:
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hashed_password,
            role=role,
            is_active=user_in.is_active,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while creating user: {exc}", 500, "DB_CREATE_USER_ERROR") from exc


def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    try:
        update_data = user_in.model_dump(exclude_unset=True)
        current_role = db_user.role

        # Original admins must keep full admin access.
        is_protected_admin = current_role == UserRole.ADMIN and not bool(db_user.is_promoted_admin)
        if is_protected_admin:
            if "role" in update_data and update_data["role"] != UserRole.ADMIN:
                raise AppError(
                    "This admin account is protected and cannot be demoted.",
                    400,
                    "PROTECTED_ADMIN_ROLE_CHANGE_BLOCKED",
                )
            if "permission_overrides" in update_data or "permission_expires_at" in update_data:
                raise AppError(
                    "This admin account is protected and cannot have restricted custom permissions.",
                    400,
                    "PROTECTED_ADMIN_PERMISSION_CHANGE_BLOCKED",
                )

        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))

        if "permission_overrides" in update_data:
            overrides = update_data["permission_overrides"]
            if overrides is None:
                update_data["permission_overrides"] = None
            else:
                valid_permissions: list[str] = []
                for item in overrides:
                    try:
                        valid_permissions.append(Permission(item).value)
                    except ValueError as exc:
                        raise AppError(
                            f"Invalid permission '{item}'. Allowed: {[p.value for p in Permission]}",
                            400,
                            "INVALID_PERMISSION_OVERRIDE",
                        ) from exc
                update_data["permission_overrides"] = ",".join(sorted(set(valid_permissions)))

        # Mark promoted admins and keep marker aligned with role changes.
        if "role" in update_data:
            next_role = update_data["role"]
            if current_role != UserRole.ADMIN and next_role == UserRole.ADMIN:
                update_data["is_promoted_admin"] = True
            elif current_role == UserRole.ADMIN and next_role != UserRole.ADMIN:
                update_data["is_promoted_admin"] = False

        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while updating user: {exc}", 500, "DB_UPDATE_USER_ERROR") from exc


def deactivate_user(db: Session, db_user: User) -> User:
    try:
        db_user.is_active = False
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while deactivating user: {exc}", 500, "DB_DEACTIVATE_USER_ERROR") from exc
