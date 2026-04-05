from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from backend.models.record import FinancialRecord, RecordType, RecordCategory, ApprovalStatus
from backend.schemas.record import RecordCreate, RecordUpdate
from backend.core.errors import AppError

def create_record(db: Session, record_in: RecordCreate, user_id: int) -> FinancialRecord:
    try:
        db_record = FinancialRecord(
            **record_in.model_dump(),
            created_by=user_id,
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while creating record: {exc}", 500, "DB_CREATE_RECORD_ERROR") from exc

def get_records(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    type: Optional[RecordType] = None,
    category: Optional[RecordCategory] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    include_deleted: bool = False,
) -> List[FinancialRecord]:
    try:
        query = db.query(FinancialRecord)
        if not include_deleted:
            query = query.filter(FinancialRecord.is_deleted.is_(False))
        if type:
            query = query.filter(FinancialRecord.type == type)
        if category:
            query = query.filter(FinancialRecord.category == category)
        if start_date:
            query = query.filter(FinancialRecord.date >= start_date)
        if end_date:
            query = query.filter(FinancialRecord.date <= end_date)
        return query.order_by(FinancialRecord.date.desc()).offset(skip).limit(limit).all()
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while reading records: {exc}", 500, "DB_READ_RECORDS_ERROR") from exc

def update_record(
    db: Session, db_record: FinancialRecord, record_in: RecordUpdate, user_id: int
) -> FinancialRecord:
    try:
        update_data = record_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_record, field, value)
        db_record.updated_by = user_id
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while updating record: {exc}", 500, "DB_UPDATE_RECORD_ERROR") from exc


def request_update(
    db: Session, db_record: FinancialRecord, record_in: RecordUpdate, user_id: int
) -> FinancialRecord:
    """Analyst requests update - sets approval_status to PENDING"""
    try:
        update_data = record_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_record, field, value)
        db_record.approval_status = ApprovalStatus.PENDING
        db_record.approval_requested_by = user_id
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while requesting update approval: {exc}", 500, "DB_REQUEST_UPDATE_ERROR") from exc


def approve_update(
    db: Session, db_record: FinancialRecord, user_id: int, notes: Optional[str] = None
) -> FinancialRecord:
    """Admin approves analyst update request"""
    try:
        db_record.approval_status = ApprovalStatus.APPROVED
        db_record.updated_by = user_id
        db_record.approval_notes = notes
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while approving update: {exc}", 500, "DB_APPROVE_UPDATE_ERROR") from exc


def reject_update(
    db: Session, db_record: FinancialRecord, user_id: int, notes: Optional[str] = None
) -> FinancialRecord:
    """Admin rejects analyst update request"""
    try:
        db_record.approval_status = ApprovalStatus.REJECTED
        db_record.approval_notes = notes
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while rejecting update: {exc}", 500, "DB_REJECT_UPDATE_ERROR") from exc

def delete_record(db: Session, db_record: FinancialRecord) -> None:
    try:
        db_record.is_deleted = True
        db.add(db_record)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise AppError(f"Database error while deleting record: {exc}", 500, "DB_DELETE_RECORD_ERROR") from exc

def get_record_by_id(db: Session, record_id: int, include_deleted: bool = False) -> Optional[FinancialRecord]:
    try:
        query = db.query(FinancialRecord).filter(FinancialRecord.id == record_id)
        if not include_deleted:
            query = query.filter(FinancialRecord.is_deleted.is_(False))
        return query.first()
    except SQLAlchemyError as exc:
        raise AppError(f"Database error while fetching record {record_id}: {exc}", 500, "DB_GET_RECORD_ERROR") from exc
