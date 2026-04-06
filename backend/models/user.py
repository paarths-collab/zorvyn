from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
import enum
from backend.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_promoted_admin = Column(Boolean, default=False, nullable=False)
    permission_overrides = Column(String, nullable=True)
    permission_expires_at = Column(DateTime, nullable=True)
