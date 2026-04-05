from sqlalchemy.orm import Session
from sqlalchemy import case, func
from sqlalchemy.exc import SQLAlchemyError
from backend.models.record import FinancialRecord, RecordType
from backend.schemas.analytics import SummaryResponse, CategoryBreakdown, TrendPoint, RecentTransaction
from backend.core.errors import AppError
from typing import List


def _active_records_query(db: Session):
    try:
        return db.query(FinancialRecord).filter(FinancialRecord.is_deleted.is_(False))
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while preparing analytics query: {exc}", 500, "DB_ANALYTICS_QUERY_ERROR") from exc

def get_summary(db: Session) -> SummaryResponse:
    try:
        active_query = _active_records_query(db)
        income = active_query.filter(FinancialRecord.type == RecordType.INCOME).with_entities(
            func.sum(FinancialRecord.amount)
        ).scalar() or 0.0

        expense = active_query.filter(FinancialRecord.type == RecordType.EXPENSE).with_entities(
            func.sum(FinancialRecord.amount)
        ).scalar() or 0.0

        return SummaryResponse(
            total_income=income,
            total_expense=expense,
            net_balance=income - expense
        )
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while calculating summary analytics: {exc}", 500, "DB_ANALYTICS_SUMMARY_ERROR") from exc

def get_category_breakdown(db: Session) -> List[CategoryBreakdown]:
    try:
        results = _active_records_query(db).with_entities(
            FinancialRecord.category,
            func.sum(FinancialRecord.amount)
        ).group_by(FinancialRecord.category).all()

        return [CategoryBreakdown(category=row[0], amount=row[1] or 0.0) for row in results]
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while calculating category analytics: {exc}", 500, "DB_ANALYTICS_CATEGORY_ERROR") from exc

def get_monthly_trends(db: Session) -> List[TrendPoint]:
    """
    Returns monthly aggregation for the last 12 months.
    SQLite specific strftime for grouping.
    """
    # Group by YYYY-MM
    try:
        results = _active_records_query(db).with_entities(
            func.strftime("%Y-%m", FinancialRecord.date).label("month"),
            func.sum(case((FinancialRecord.type == RecordType.INCOME, FinancialRecord.amount), else_=0)).label("income"),
            func.sum(case((FinancialRecord.type == RecordType.EXPENSE, FinancialRecord.amount), else_=0)).label("expense")
        ).group_by("month").order_by("month").limit(12).all()

        return [
            TrendPoint(period=row[0], income=row[1] or 0.0, expense=row[2] or 0.0)
            for row in results
        ]
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while calculating trend analytics: {exc}", 500, "DB_ANALYTICS_TREND_ERROR") from exc


def get_recent_transactions(db: Session, limit: int = 10) -> List[RecentTransaction]:
    try:
        rows = (
            _active_records_query(db)
            .order_by(FinancialRecord.created_at.desc())
            .limit(limit)
            .all()
        )
        return [RecentTransaction.model_validate(row, from_attributes=True) for row in rows]
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while loading recent transactions: {exc}", 500, "DB_ANALYTICS_RECENT_ERROR") from exc
