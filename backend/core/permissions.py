from enum import Enum
from typing import Dict, Set
from datetime import datetime

from backend.models.user import UserRole


class Permission(str, Enum):
    READ_RECORDS = "read_records"
    CREATE_RECORDS = "create_records"
    UPDATE_RECORDS = "update_records"
    DELETE_RECORDS = "delete_records"
    VIEW_ANALYTICS = "view_analytics"
    MANAGE_USERS = "manage_users"


ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.VIEWER: {
        Permission.READ_RECORDS,
        Permission.VIEW_ANALYTICS,
    },
    UserRole.ANALYST: {
        Permission.READ_RECORDS,
        Permission.CREATE_RECORDS,
        Permission.UPDATE_RECORDS,
        Permission.VIEW_ANALYTICS,
    },
    UserRole.ADMIN: {
        Permission.READ_RECORDS,
        Permission.CREATE_RECORDS,
        Permission.UPDATE_RECORDS,
        Permission.DELETE_RECORDS,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_USERS,
    },
}


def has_permission(role: UserRole, permission: Permission) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())


def _parse_permission_overrides(permission_overrides: str | None) -> Set[Permission]:
    if not permission_overrides:
        return set()
    raw = [item.strip() for item in permission_overrides.split(",") if item.strip()]
    parsed: Set[Permission] = set()
    for item in raw:
        try:
            parsed.add(Permission(item))
        except ValueError:
            continue
    return parsed


def has_permission_for_user(
    role: UserRole,
    permission: Permission,
    permission_overrides: str | None = None,
    permission_expires_at: datetime | None = None,
) -> bool:
    base_permissions = set(ROLE_PERMISSIONS.get(role, set()))
    override_permissions = _parse_permission_overrides(permission_overrides)
    if not override_permissions:
        return permission in base_permissions

    if permission_expires_at and permission_expires_at < datetime.utcnow():
        return permission in base_permissions

    effective_permissions = base_permissions | override_permissions
    return permission in effective_permissions


def get_effective_permissions_for_user(
    role: UserRole,
    permission_overrides: str | None = None,
    permission_expires_at: datetime | None = None,
) -> Set[Permission]:
    base_permissions = set(ROLE_PERMISSIONS.get(role, set()))
    override_permissions = _parse_permission_overrides(permission_overrides)
    if not override_permissions:
        return base_permissions

    if permission_expires_at and permission_expires_at < datetime.utcnow():
        return base_permissions

    return base_permissions | set(override_permissions)
