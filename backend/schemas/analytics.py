from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import date
from backend.models.record import RecordType, RecordCategory

class SummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float

class CategoryBreakdown(BaseModel):
    category: RecordCategory
    amount: float

class TrendPoint(BaseModel):
    period: str  # e.g., "2024-01"
    income: float
    expense: float


class RecentTransaction(BaseModel):
    id: int
    amount: float
    type: RecordType
    category: RecordCategory
    date: date
    description: str | None = None
    reference_id: str | None = None
    model_config = ConfigDict(from_attributes=True)

class DashboardData(BaseModel):
    summary: SummaryResponse
    categories: List[CategoryBreakdown]
    trends: List[TrendPoint]
    recent_transactions: List[RecentTransaction]
