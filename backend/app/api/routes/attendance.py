from datetime import datetime, date, time
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.attendance import (
    AttendanceResponse, AttendanceCheckIn, AttendanceCheckOut,
    AttendanceUpdateAdmin, AttendanceSummary
)
from app.api.deps import get_current_user, get_current_active_employee, require_hr_or_admin
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    check_in_data: AttendanceCheckIn,
    request: Request,
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today
    ).first()

    if existing and existing.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in for today"
        )

    now = datetime.utcnow()
    if existing:
        existing.check_in = now
        existing.status = AttendanceStatus.PRESENT
        if check_in_data.remarks:
            existing.remarks = check_in_data.remarks
        db.commit()
        db.refresh(existing)
        attendance = existing
    else:
        attendance = Attendance(
            employee_id=employee.id,
            date=today,
            check_in=now,
            status=AttendanceStatus.PRESENT,
            working_hours=0.0,
            remarks=check_in_data.remarks
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="ATTENDANCE_CHECK_IN",
        entity="ATTENDANCE",
        entity_id=str(attendance.id),
        new_value={"time": str(now)},
        ip_address=request.client.host if request.client else None
    )

    return attendance


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    check_out_data: AttendanceCheckOut,
    request: Request,
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == employee.id,
        Attendance.date == today
    ).first()

    if not attendance or not attendance.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check out without checking in first"
        )

    now = datetime.utcnow()
    if now < attendance.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid check out time"
        )

    attendance.check_out = now
    
    # Calculate working hours automatically
    duration_seconds = (now - attendance.check_in).total_seconds()
    working_hours = round(duration_seconds / 3600.0, 2)
    attendance.working_hours = working_hours

    # If working hours < 4, mark as Half Day
    if working_hours < 4.0:
        attendance.status = AttendanceStatus.HALF_DAY
    else:
        attendance.status = AttendanceStatus.PRESENT

    if check_out_data.remarks:
        attendance.remarks = f"{attendance.remarks or ''} | Out: {check_out_data.remarks}".strip(" | ")

    db.commit()
    db.refresh(attendance)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="ATTENDANCE_CHECK_OUT",
        entity="ATTENDANCE",
        entity_id=str(attendance.id),
        new_value={"time": str(now), "working_hours": working_hours},
        ip_address=request.client.host if request.client else None
    )

    return attendance


@router.get("/me", response_model=List[AttendanceResponse])
def get_my_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    query = db.query(Attendance).filter(Attendance.employee_id == employee.id)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)

    return query.order_by(desc(Attendance.date)).all()


@router.get("/me/summary", response_model=AttendanceSummary)
def get_my_attendance_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    query = db.query(Attendance).filter(Attendance.employee_id == employee.id)
    
    # Defaults to current year/month
    now = datetime.utcnow()
    target_year = year or now.year
    target_month = month or now.month

    records = query.filter(
        func.extract('year', Attendance.date) == target_year,
        func.extract('month', Attendance.date) == target_month
    ).all()

    total_days = len(records)
    present_days = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    half_days = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
    absent_days = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    leave_days = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
    total_hours = sum(r.working_hours for r in records)

    attendance_rate = round(((present_days + 0.5 * half_days) / max(total_days, 1)) * 100, 1)

    return {
        "total_days": total_days,
        "present_days": present_days,
        "absent_days": absent_days,
        "half_days": half_days,
        "leave_days": leave_days,
        "attendance_rate": attendance_rate,
        "total_hours": round(total_hours, 1)
    }


@router.get("", response_model=List[AttendanceResponse])
def get_all_attendance(
    target_date: Optional[date] = None,
    department: Optional[str] = None,
    employee_id: Optional[int] = None,
    status: Optional[AttendanceStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    query = db.query(Attendance).join(Employee)
    if target_date:
        query = query.filter(Attendance.date == target_date)
    if department:
        query = query.filter(Employee.department == department)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if status:
        query = query.filter(Attendance.status == status)

    return query.order_by(desc(Attendance.date)).all()


@router.get("/employee/{employee_id}", response_model=List[AttendanceResponse])
def get_employee_attendance(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    return db.query(Attendance).filter(Attendance.employee_id == employee_id).order_by(desc(Attendance.date)).all()


@router.put("/{id}", response_model=AttendanceResponse)
def update_attendance_record(
    id: int,
    data: AttendanceUpdateAdmin,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    record = db.query(Attendance).filter(Attendance.id == id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")

    old_val = {"status": record.status.value, "hours": record.working_hours}

    if data.status is not None:
        record.status = data.status
    if data.check_in is not None:
        record.check_in = data.check_in
    if data.check_out is not None:
        record.check_out = data.check_out
    if data.working_hours is not None:
        record.working_hours = data.working_hours
    if data.remarks is not None:
        record.remarks = data.remarks

    db.commit()
    db.refresh(record)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="UPDATE_ATTENDANCE",
        entity="ATTENDANCE",
        entity_id=str(record.id),
        old_value=old_val,
        new_value={"status": record.status.value, "hours": record.working_hours},
        ip_address=request.client.host if request.client else None
    )

    return record
