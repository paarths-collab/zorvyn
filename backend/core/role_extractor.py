import re

from backend.models.user import UserRole


EMAIL_ROLE_PATTERN = re.compile(
    r"^[^@.\s]+\.(viewer|analyst|admin)@gmail\.com$", re.IGNORECASE
)


def extract_role_from_email(email: str) -> UserRole:
    normalized_email = email.strip().lower()
    match = EMAIL_ROLE_PATTERN.match(normalized_email)
    if not match:
        raise ValueError(
            "Email must follow name.role@gmail.com and role must be viewer, analyst, or admin"
        )
    return UserRole(match.group(1).lower())