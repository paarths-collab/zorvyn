from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
from backend.api.deps import get_db, get_current_active_user, PermissionChecker, RoleChecker
from backend.core.permissions import Permission
from backend.schemas.user import TokenPayload
from backend.models.record import RecordType, RecordCategory
from backend.models.user import UserRole
from backend.schemas.record import RecordCreate, RecordUpdate, RecordResponse
from backend.services import record as record_service

router = APIRouter()

check_records_read = PermissionChecker(Permission.READ_RECORDS)
check_records_create = PermissionChecker(Permission.CREATE_RECORDS)
check_records_update = PermissionChecker(Permission.UPDATE_RECORDS)
check_records_delete = PermissionChecker(Permission.DELETE_RECORDS)

@router.get("/", response_model=List[RecordResponse])
@router.get("", response_model=List[RecordResponse], include_in_schema=False)
def read_records(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    type: Optional[RecordType] = None,
    category: Optional[RecordCategory] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_deleted: bool = Query(default=False),
    current_user: TokenPayload = Depends(check_records_read),
) -> List[RecordResponse]:
    """
    Retrieve records.
    """
    # Only admins are allowed to inspect soft-deleted rows.
    if current_user.role.value != "admin":
        include_deleted = False

    return record_service.get_records(
        db,
        skip=skip,
        limit=limit,
        type=type,
        category=category,
        start_date=start_date,
        end_date=end_date,
        include_deleted=include_deleted,
    )

@router.post("/", response_model=RecordResponse)
def create_record(
    *,
    db: Session = Depends(get_db),
    record_in: RecordCreate,
    current_user: TokenPayload = Depends(check_records_create),
) -> RecordResponse:
    """
    Add a new record (Analyst/Admin).
    """
    return record_service.create_record(db, record_in=record_in, user_id=current_user.id)

@router.put("/{record_id}", response_model=RecordResponse)
def update_record(
    *,
    db: Session = Depends(get_db),
    record_id: int,
    record_in: RecordUpdate,
    current_user: TokenPayload = Depends(check_records_update),
) -> RecordResponse:
    """
    Edit a record.
    - Admin: directly update any record
    - Analyst: request update approval for records they created
    """
    db_record = record_service.get_record_by_id(db, record_id=record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Admin can directly update  any record
    if current_user.role == UserRole.ADMIN:
        return record_service.update_record(db, db_record=db_record, record_in=record_in, user_id=current_user.id)
    
    # Analyst can only update records they created
    if current_user.role == UserRole.ANALYST:
        if db_record.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update records you created. Admin approval required for other records."
            )
        # Submit update request for approval
        return record_service.request_update(db, db_record=db_record, record_in=record_in, user_id=current_user.id)
    
    # Other roles cannot update
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have permission to update records"
    )

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    *,
    db: Session = Depends(get_db),
    record_id: int,
    current_user: TokenPayload = Depends(check_records_delete),
):
    """
    Delete a record (Admin only).
    """
    db_record = record_service.get_record_by_id(db, record_id=record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    record_service.delete_record(db, db_record=db_record)
    return None


@router.post("/{record_id}/approve", response_model=RecordResponse)
def approve_update(
    *,
    db: Session = Depends(get_db),
    record_id: int,
    notes: Optional[str] = Query(default=None),
    current_user: TokenPayload = Depends(RoleChecker([UserRole.ADMIN])),
) -> RecordResponse:
    """
    Admin approves an analyst's update request (Admin only).
    """
    db_record = record_service.get_record_by_id(db, record_id=record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    if db_record.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Record has no pending approval request"
        )
    return record_service.approve_update(db, db_record=db_record, user_id=current_user.id, notes=notes)


@router.post("/{record_id}/reject", response_model=RecordResponse)
def reject_update(
    *,
    db: Session = Depends(get_db),
    record_id: int,
    notes: Optional[str] = Query(default=None),
    current_user: TokenPayload = Depends(RoleChecker([UserRole.ADMIN])),
) -> RecordResponse:
    """
    Admin rejects an analyst's update request (Admin only).
    """
    db_record = record_service.get_record_by_id(db, record_id=record_id)
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    if db_record.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Record has no pending approval request"
        )
    return record_service.reject_update(db, db_record=db_record, user_id=current_user.id, notes=notes)
