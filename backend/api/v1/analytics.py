from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.api.deps import get_db, PermissionChecker
from backend.core.permissions import Permission
from backend.schemas.analytics import SummaryResponse, CategoryBreakdown, TrendPoint, DashboardData
from backend.services import analytics as analytics_service
from typing import List

router = APIRouter()
check_view_analytics = PermissionChecker(Permission.VIEW_ANALYTICS)

@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    db: Session = Depends(get_db),
    current_user = Depends(check_view_analytics),
) -> SummaryResponse:
    return analytics_service.get_summary(db)

@router.get("/categories", response_model=List[CategoryBreakdown])
def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(check_view_analytics),
) -> List[CategoryBreakdown]:
    return analytics_service.get_category_breakdown(db)

@router.get("/trends", response_model=List[TrendPoint])
def get_trends(
    db: Session = Depends(get_db),
    current_user = Depends(check_view_analytics),
) -> List[TrendPoint]:
    return analytics_service.get_monthly_trends(db)

@router.get("/dashboard", response_model=DashboardData)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(check_view_analytics),
) -> DashboardData:
    return DashboardData(
        summary=analytics_service.get_summary(db),
        categories=analytics_service.get_category_breakdown(db),
        trends=analytics_service.get_monthly_trends(db),
        recent_transactions=analytics_service.get_recent_transactions(db),
    )
