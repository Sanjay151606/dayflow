from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, or_
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveType, LeaveStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.leave import (
    LeaveRequestCreate, LeaveRequestResponse,
    LeaveApprovalAction, LeaveSummary
)
from app.api.deps import get_current_user, get_current_active_employee, require_hr_or_admin
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/leaves", tags=["Leaves"])


@router.post("", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(
    leave_in: LeaveRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee),
    current_user: User = Depends(get_current_user)
):
    if leave_in.start_date > leave_in.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date"
        )

    # Check for overlapping approved/pending leaves
    overlapping = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee.id,
        LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
        LeaveRequest.start_date <= leave_in.end_date,
        LeaveRequest.end_date >= leave_in.start_date
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending or approved leave request during these dates"
        )

    new_leave = LeaveRequest(
        employee_id=employee.id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        reason=leave_in.reason,
        status=LeaveStatus.PENDING
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="APPLY_LEAVE",
        entity="LEAVE",
        entity_id=str(new_leave.id),
        new_value={"type": new_leave.leave_type.value, "start": str(new_leave.start_date), "end": str(new_leave.end_date)},
        ip_address=request.client.host if request.client else None
    )

    # Notify HR / Admins
    hr_users = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.HR])).all()
    for hr_u in hr_users:
        create_notification(
            db,
            user_id=hr_u.id,
            title="New Leave Request",
            message=f"{employee.first_name} {employee.last_name} applied for {leave_in.leave_type.value} leave ({leave_in.start_date} to {leave_in.end_date}).",
            type="INFO"
        )

    return LeaveRequestResponse(
        id=new_leave.id,
        employee_id=new_leave.employee_id,
        leave_type=new_leave.leave_type,
        start_date=new_leave.start_date,
        end_date=new_leave.end_date,
        reason=new_leave.reason,
        status=new_leave.status,
        approved_by=new_leave.approved_by,
        approval_comment=new_leave.approval_comment,
        created_at=new_leave.created_at,
        updated_at=new_leave.updated_at,
        employee_name=f"{employee.first_name} {employee.last_name}",
        employee_code=employee.user.employee_id if employee.user else "",
        department=employee.department
    )


@router.get("/me", response_model=List[LeaveRequestResponse])
def get_my_leaves(
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    leaves = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user)
    ).filter(
        LeaveRequest.employee_id == employee.id
    ).order_by(desc(LeaveRequest.created_at)).all()

    result = []
    for l in leaves:
        result.append(LeaveRequestResponse(
            id=l.id,
            employee_id=l.employee_id,
            leave_type=l.leave_type,
            start_date=l.start_date,
            end_date=l.end_date,
            reason=l.reason,
            status=l.status,
            approved_by=l.approved_by,
            approval_comment=l.approval_comment,
            created_at=l.created_at,
            updated_at=l.updated_at,
            employee_name=f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "",
            employee_code=l.employee.user.employee_id if l.employee and l.employee.user else "",
            department=l.employee.department if l.employee else ""
        ))
    return result


@router.get("/me/summary", response_model=LeaveSummary)
def get_my_leave_summary(
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee.id).all()
    total_requested = len(leaves)
    pending = sum(1 for l in leaves if l.status == LeaveStatus.PENDING)
    approved = sum(1 for l in leaves if l.status == LeaveStatus.APPROVED)
    rejected = sum(1 for l in leaves if l.status == LeaveStatus.REJECTED)

    # Calculate used days for balances
    used_paid_days = 0
    used_sick_days = 0
    for l in leaves:
        if l.status == LeaveStatus.APPROVED:
            days = (l.end_date - l.start_date).days + 1
            if l.leave_type == LeaveType.PAID:
                used_paid_days += days
            elif l.leave_type == LeaveType.SICK:
                used_sick_days += days

    return {
        "total_requested": total_requested,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "paid_leave_balance": max(0, 15 - used_paid_days),
        "sick_leave_balance": max(0, 10 - used_sick_days)
    }


@router.get("", response_model=List[LeaveRequestResponse])
def get_all_leaves(
    status_filter: Optional[LeaveStatus] = None,
    employee_id: Optional[int] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    query = db.query(LeaveRequest).join(Employee).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user)
    )

    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    if department:
        query = query.filter(Employee.department == department)

    leaves = query.order_by(desc(LeaveRequest.created_at)).all()
    result = []
    for l in leaves:
        result.append(LeaveRequestResponse(
            id=l.id,
            employee_id=l.employee_id,
            leave_type=l.leave_type,
            start_date=l.start_date,
            end_date=l.end_date,
            reason=l.reason,
            status=l.status,
            approved_by=l.approved_by,
            approval_comment=l.approval_comment,
            created_at=l.created_at,
            updated_at=l.updated_at,
            employee_name=f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "",
            employee_code=l.employee.user.employee_id if l.employee and l.employee.user else "",
            department=l.employee.department if l.employee else ""
        ))
    return result


@router.get("/{id}", response_model=LeaveRequestResponse)
def get_leave_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    leave = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user)
    ).filter(LeaveRequest.id == id).first()

    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    # Authorization: only own leave unless HR or Admin
    if current_user.role == UserRole.EMPLOYEE and (not leave.employee or leave.employee.user_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return LeaveRequestResponse(
        id=leave.id,
        employee_id=leave.employee_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        approved_by=leave.approved_by,
        approval_comment=leave.approval_comment,
        created_at=leave.created_at,
        updated_at=leave.updated_at,
        employee_name=f"{leave.employee.first_name} {leave.employee.last_name}" if leave.employee else "",
        employee_code=leave.employee.user.employee_id if leave.employee and leave.employee.user else "",
        department=leave.employee.department if leave.employee else ""
    )


@router.patch("/{id}/approve", response_model=LeaveRequestResponse)
def approve_leave(
    id: int,
    action: LeaveApprovalAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    leave = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user)
    ).filter(LeaveRequest.id == id).first()

    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    leave.status = LeaveStatus.APPROVED
    leave.approved_by = current_user.id
    leave.approval_comment = action.comment or "Approved"

    # Reflect leave in attendance records for the date range
    cur_d = leave.start_date
    while cur_d <= leave.end_date:
        att = db.query(Attendance).filter(
            Attendance.employee_id == leave.employee_id,
            Attendance.date == cur_d
        ).first()
        if att:
            att.status = AttendanceStatus.LEAVE
            att.remarks = f"Approved Leave ({leave.leave_type.value})"
        else:
            att = Attendance(
                employee_id=leave.employee_id,
                date=cur_d,
                status=AttendanceStatus.LEAVE,
                working_hours=0.0,
                remarks=f"Approved Leave ({leave.leave_type.value})"
            )
            db.add(att)
        cur_d += timedelta(days=1)

    db.commit()
    db.refresh(leave)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="APPROVE_LEAVE",
        entity="LEAVE",
        entity_id=str(leave.id),
        new_value={"status": "APPROVED", "comment": leave.approval_comment},
        ip_address=request.client.host if request.client else None
    )

    if leave.employee and leave.employee.user:
        create_notification(
            db,
            user_id=leave.employee.user.id,
            title="Leave Request Approved",
            message=f"Your {leave.leave_type.value} leave request for {leave.start_date} to {leave.end_date} has been approved.",
            type="SUCCESS"
        )

    return LeaveRequestResponse(
        id=leave.id,
        employee_id=leave.employee_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        approved_by=leave.approved_by,
        approval_comment=leave.approval_comment,
        created_at=leave.created_at,
        updated_at=leave.updated_at,
        employee_name=f"{leave.employee.first_name} {leave.employee.last_name}" if leave.employee else "",
        employee_code=leave.employee.user.employee_id if leave.employee and leave.employee.user else "",
        department=leave.employee.department if leave.employee else ""
    )


@router.patch("/{id}/reject", response_model=LeaveRequestResponse)
def reject_leave(
    id: int,
    action: LeaveApprovalAction,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    leave = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee).joinedload(Employee.user)
    ).filter(LeaveRequest.id == id).first()

    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    leave.status = LeaveStatus.REJECTED
    leave.approved_by = current_user.id
    leave.approval_comment = action.comment or "Rejected"

    db.commit()
    db.refresh(leave)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="REJECT_LEAVE",
        entity="LEAVE",
        entity_id=str(leave.id),
        new_value={"status": "REJECTED", "comment": leave.approval_comment},
        ip_address=request.client.host if request.client else None
    )

    if leave.employee and leave.employee.user:
        create_notification(
            db,
            user_id=leave.employee.user.id,
            title="Leave Request Rejected",
            message=f"Your {leave.leave_type.value} leave request was rejected. Reason: {leave.approval_comment}",
            type="DANGER"
        )

    return LeaveRequestResponse(
        id=leave.id,
        employee_id=leave.employee_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        approved_by=leave.approved_by,
        approval_comment=leave.approval_comment,
        created_at=leave.created_at,
        updated_at=leave.updated_at,
        employee_name=f"{leave.employee.first_name} {leave.employee.last_name}" if leave.employee else "",
        employee_code=leave.employee.user.employee_id if leave.employee and leave.employee.user else "",
        department=leave.employee.department if leave.employee else ""
    )
