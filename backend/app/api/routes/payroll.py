from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.payroll import Payroll, PayrollStatus
from app.schemas.payroll import (
    PayrollCreate, PayrollUpdate, PayrollResponse, SalarySlipResponse
)
from app.api.deps import get_current_user, get_current_active_employee, require_hr_or_admin, require_admin
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.get("/me", response_model=List[PayrollResponse])
def get_my_payroll(
    db: Session = Depends(get_db),
    employee: Employee = Depends(get_current_active_employee)
):
    payrolls = db.query(Payroll).options(
        joinedload(Payroll.employee).joinedload(Employee.user)
    ).filter(
        Payroll.employee_id == employee.id
    ).order_by(desc(Payroll.pay_period)).all()

    result = []
    for p in payrolls:
        result.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            basic_salary=p.basic_salary,
            allowances=p.allowances,
            deductions=p.deductions,
            net_salary=p.net_salary,
            pay_period=p.pay_period,
            payment_date=p.payment_date,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            employee_name=f"{p.employee.first_name} {p.employee.last_name}" if p.employee else "",
            employee_code=p.employee.user.employee_id if p.employee and p.employee.user else "",
            department=p.employee.department if p.employee else "",
            designation=p.employee.designation if p.employee else ""
        ))
    return result


@router.get("", response_model=List[PayrollResponse])
def get_all_payroll(
    pay_period: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[PayrollStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    query = db.query(Payroll).join(Employee).options(
        joinedload(Payroll.employee).joinedload(Employee.user)
    )

    if pay_period:
        query = query.filter(Payroll.pay_period == pay_period)
    if department:
        query = query.filter(Employee.department == department)
    if status_filter:
        query = query.filter(Payroll.status == status_filter)

    payrolls = query.order_by(desc(Payroll.pay_period), desc(Payroll.id)).all()
    result = []
    for p in payrolls:
        result.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            basic_salary=p.basic_salary,
            allowances=p.allowances,
            deductions=p.deductions,
            net_salary=p.net_salary,
            pay_period=p.pay_period,
            payment_date=p.payment_date,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            employee_name=f"{p.employee.first_name} {p.employee.last_name}" if p.employee else "",
            employee_code=p.employee.user.employee_id if p.employee and p.employee.user else "",
            department=p.employee.department if p.employee else "",
            designation=p.employee.designation if p.employee else ""
        ))
    return result


@router.get("/employee/{employee_id}", response_model=List[PayrollResponse])
def get_employee_payroll(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    payrolls = db.query(Payroll).options(
        joinedload(Payroll.employee).joinedload(Employee.user)
    ).filter(
        Payroll.employee_id == employee_id
    ).order_by(desc(Payroll.pay_period)).all()

    result = []
    for p in payrolls:
        result.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            basic_salary=p.basic_salary,
            allowances=p.allowances,
            deductions=p.deductions,
            net_salary=p.net_salary,
            pay_period=p.pay_period,
            payment_date=p.payment_date,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            employee_name=f"{p.employee.first_name} {p.employee.last_name}" if p.employee else "",
            employee_code=p.employee.user.employee_id if p.employee and p.employee.user else "",
            department=p.employee.department if p.employee else "",
            designation=p.employee.designation if p.employee else ""
        ))
    return result


@router.post("", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
def create_payroll(
    payroll_in: PayrollCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == payroll_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Formula: net_salary = basic_salary + allowances - deductions
    net_salary = payroll_in.basic_salary + payroll_in.allowances - payroll_in.deductions
    if net_salary < 0:
        net_salary = 0.0

    payroll = Payroll(
        employee_id=payroll_in.employee_id,
        basic_salary=payroll_in.basic_salary,
        allowances=payroll_in.allowances,
        deductions=payroll_in.deductions,
        net_salary=net_salary,
        pay_period=payroll_in.pay_period,
        payment_date=payroll_in.payment_date,
        status=payroll_in.status
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="CREATE_PAYROLL",
        entity="PAYROLL",
        entity_id=str(payroll.id),
        new_value={"period": payroll.pay_period, "net_salary": net_salary},
        ip_address=request.client.host if request.client else None
    )

    if employee.user:
        create_notification(
            db,
            user_id=employee.user.id,
            title="Salary Slip Generated",
            message=f"Your salary slip for {payroll.pay_period} has been generated. Net Salary: ${net_salary:,.2f}",
            type="INFO"
        )

    return PayrollResponse(
        id=payroll.id,
        employee_id=payroll.employee_id,
        basic_salary=payroll.basic_salary,
        allowances=payroll.allowances,
        deductions=payroll.deductions,
        net_salary=payroll.net_salary,
        pay_period=payroll.pay_period,
        payment_date=payroll.payment_date,
        status=payroll.status,
        created_at=payroll.created_at,
        updated_at=payroll.updated_at,
        employee_name=f"{employee.first_name} {employee.last_name}",
        employee_code=employee.user.employee_id if employee.user else "",
        department=employee.department,
        designation=employee.designation
    )


@router.put("/{id}", response_model=PayrollResponse)
def update_payroll(
    id: int,
    payroll_update: PayrollUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    payroll = db.query(Payroll).options(
        joinedload(Payroll.employee).joinedload(Employee.user)
    ).filter(Payroll.id == id).first()

    if not payroll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll record not found")

    if payroll_update.basic_salary is not None:
        payroll.basic_salary = payroll_update.basic_salary
    if payroll_update.allowances is not None:
        payroll.allowances = payroll_update.allowances
    if payroll_update.deductions is not None:
        payroll.deductions = payroll_update.deductions
    if payroll_update.pay_period is not None:
        payroll.pay_period = payroll_update.pay_period
    if payroll_update.payment_date is not None:
        payroll.payment_date = payroll_update.payment_date
    if payroll_update.status is not None:
        payroll.status = payroll_update.status

    payroll.net_salary = max(0.0, payroll.basic_salary + payroll.allowances - payroll.deductions)
    db.commit()
    db.refresh(payroll)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="UPDATE_PAYROLL",
        entity="PAYROLL",
        entity_id=str(payroll.id),
        new_value={"period": payroll.pay_period, "net_salary": payroll.net_salary, "status": payroll.status.value},
        ip_address=request.client.host if request.client else None
    )

    return PayrollResponse(
        id=payroll.id,
        employee_id=payroll.employee_id,
        basic_salary=payroll.basic_salary,
        allowances=payroll.allowances,
        deductions=payroll.deductions,
        net_salary=payroll.net_salary,
        pay_period=payroll.pay_period,
        payment_date=payroll.payment_date,
        status=payroll.status,
        created_at=payroll.created_at,
        updated_at=payroll.updated_at,
        employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}" if payroll.employee else "",
        employee_code=payroll.employee.user.employee_id if payroll.employee and payroll.employee.user else "",
        department=payroll.employee.department if payroll.employee else "",
        designation=payroll.employee.designation if payroll.employee else ""
    )


@router.get("/{id}/salary-slip", response_model=SalarySlipResponse)
def get_salary_slip(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payroll = db.query(Payroll).options(
        joinedload(Payroll.employee).joinedload(Employee.user)
    ).filter(Payroll.id == id).first()

    if not payroll or not payroll.employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll record not found")

    # Authorization guard: Employee can only view their own
    if current_user.role == UserRole.EMPLOYEE and payroll.employee.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return SalarySlipResponse(
        payroll_id=payroll.id,
        employee_id=payroll.employee.user.employee_id if payroll.employee.user else "",
        employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
        department=payroll.employee.department,
        designation=payroll.employee.designation,
        joining_date=payroll.employee.joining_date,
        pay_period=payroll.pay_period,
        payment_date=payroll.payment_date,
        basic_salary=payroll.basic_salary,
        allowances=payroll.allowances,
        deductions=payroll.deductions,
        net_salary=payroll.net_salary,
        generated_at=datetime.utcnow()
    )
