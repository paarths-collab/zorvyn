from sqlalchemy import Column, Integer, Float, String, Date, Enum, ForeignKey, DateTime, Boolean
import enum
from datetime import datetime
from sqlalchemy.orm import relationship
from backend.db.session import Base

class RecordType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


class RecordCategory(str, enum.Enum):
    SALARY = "salary"
    MARKETING = "marketing"
    RENT = "rent"
    CLIENT_PAYMENT = "client_payment"
    SUBSCRIPTION = "subscription"
    TRAVEL = "travel"
    UTILITIES = "utilities"
    PRODUCT_SALES = "product_sales"
    FUNDING = "funding"
    SOFTWARE = "software"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    UPI = "upi"


class ApprovalStatus(str, enum.Enum):
    NONE = "none"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(Enum(RecordType), nullable=False)
    category = Column(Enum(RecordCategory), index=True, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    reference_id = Column(String, index=True, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.NONE, nullable=False)
    approval_requested_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_notes = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
