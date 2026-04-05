from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional
from datetime import datetime
from backend.models.record import RecordType, RecordCategory, PaymentMethod, ApprovalStatus

class RecordBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be greater than 0")
    type: RecordType
    category: RecordCategory
    date: date
    description: Optional[str] = None
    payment_method: PaymentMethod
    reference_id: Optional[str] = None

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[RecordType] = None
    category: Optional[RecordCategory] = None
    date: Optional[date] = None
    description: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    reference_id: Optional[str] = None
    is_deleted: Optional[bool] = None

class RecordResponse(RecordBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int] = None
    approval_status: ApprovalStatus
    approval_requested_by: Optional[int] = None
    approval_notes: Optional[str] = None
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)
