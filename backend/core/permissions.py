from enum import Enum
from typing import Dict, Set

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
