from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.wfh import WorkFromHomeRequest, WFHStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.wfh import WFHRequestCreate, WFHRequestResponse, WFHApprovalAction
from app.api.deps import get_current_user, get_current_active_employee, require_hr_or_admin
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/wfh", tags=["Work From Home"])


@router.post("", response_model=WFHRequestResponse, status_code=status.HTTP_201_CREATED)
def apply_wfh(
    wfh_in: WFHRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee),
    current_user: User = Depends(get_current_user)
):
    if wfh_in.start_date > wfh_in.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date"
        )

    wfh = WorkFromHomeRequest(
        employee_id=employee.id,
        start_date=wfh_in.start_date,
        end_date=wfh_in.end_date,
        reason=wfh_in.reason,
        status=WFHStatus.PENDING
    )
    db.add(wfh)
    db.commit()
    db.refresh(wfh)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="APPLY_WFH",
        entity="WFH",
        entity_id=str(wfh.id),
        new_value={"start": str(wfh.start_date), "end": str(wfh.end_date)},
        ip_address=request.client.host if request.client else None
    )

    return WFHRequestResponse(
        id=wfh.id,
        employee_id=wfh.employee_id,
        start_date=wfh.start_date,
        end_date=wfh.end_date,
        reason=wfh.reason,
        status=wfh.status,
        approved_by=wfh.approved_by,
        comment=wfh.comment,
        created_at=wfh.created_at,
        updated_at=wfh.updated_at,
        employee_name=f"{employee.first_name} {employee.last_name}",
        employee_code=employee.user.employee_id if employee.user else "",
        department=employee.department
    )


@router.get("/me", response_model=List[WFHRequestResponse])
def get_my_wfh(
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    requests = db.query(WorkFromHomeRequest).options(
        joinedload(WorkFromHomeRequest.employee).joinedload(Employee.user)
    ).filter(
        WorkFromHomeRequest.employee_id == employee.id
    ).order_by(desc(WorkFromHomeRequest.created_at)).all()

    return [
        WFHRequestResponse(
            id=r.id,
            employee_id=r.employee_id,
            start_date=r.start_date,
            end_date=r.end_date,
            reason=r.reason,
            status=r.status,
            approved_by=r.approved_by,
            comment=r.comment,
            created_at=r.created_at,
            updated_at=r.updated_at,
            employee_name=f"{employee.first_name} {employee.last_name}",
            employee_code=employee.user.employee_id if employee.user else "",
            department=employee.department
        )
        for r in requests
    ]


@router.get("", response_model=List[WFHRequestResponse])
def get_all_wfh(
    status_filter: Optional[WFHStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    query = db.query(WorkFromHomeRequest).join(Employee).options(
        joinedload(WorkFromHomeRequest.employee).joinedload(Employee.user)
    )
    if status_filter:
        query = query.filter(WorkFromHomeRequest.status == status_filter)

    requests = query.order_by(desc(WorkFromHomeRequest.created_at)).all()

    return [
        WFHRequestResponse(
            id=r.id,
            employee_id=r.employee_id,
            start_date=r.start_date,
            end_date=r.end_date,
            reason=r.reason,
            status=r.status,
            approved_by=r.approved_by,
            comment=r.comment,
            created_at=r.created_at,
            updated_at=r.updated_at,
            employee_name=f"{r.employee.first_name} {r.employee.last_name}" if r.employee else "",
            employee_code=r.employee.user.employee_id if r.employee and r.employee.user else "",
            department=r.employee.department if r.employee else ""
        )
        for r in requests
    ]


@router.patch("/{id}/approve", response_model=WFHRequestResponse)
def approve_wfh(
    id: int,
    action: WFHApprovalAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    wfh = db.query(WorkFromHomeRequest).options(
        joinedload(WorkFromHomeRequest.employee).joinedload(Employee.user)
    ).filter(WorkFromHomeRequest.id == id).first()

    if not wfh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="WFH request not found")

    wfh.status = WFHStatus.APPROVED
    wfh.approved_by = current_user.id
    wfh.comment = action.comment or "Approved"

    cur_d = wfh.start_date
    while cur_d <= wfh.end_date:
        att = db.query(Attendance).filter(
            Attendance.employee_id == wfh.employee_id,
            Attendance.date == cur_d
        ).first()
        if att:
            att.status = AttendanceStatus.WORK_FROM_HOME
            att.remarks = f"Approved WFH"
        else:
            att = Attendance(
                employee_id=wfh.employee_id,
                date=cur_d,
                status=AttendanceStatus.WORK_FROM_HOME,
                working_hours=8.0,
                remarks="Approved WFH"
            )
            db.add(att)
        cur_d += timedelta(days=1)

    db.commit()
    db.refresh(wfh)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="APPROVE_WFH",
        entity="WFH",
        entity_id=str(wfh.id),
        new_value={"status": "APPROVED"},
        ip_address=request.client.host if request.client else None
    )

    return WFHRequestResponse(
        id=wfh.id,
        employee_id=wfh.employee_id,
        start_date=wfh.start_date,
        end_date=wfh.end_date,
        reason=wfh.reason,
        status=wfh.status,
        approved_by=wfh.approved_by,
        comment=wfh.comment,
        created_at=wfh.created_at,
        updated_at=wfh.updated_at,
        employee_name=f"{wfh.employee.first_name} {wfh.employee.last_name}" if wfh.employee else "",
        employee_code=wfh.employee.user.employee_id if wfh.employee and wfh.employee.user else "",
        department=wfh.employee.department if wfh.employee else ""
    )
