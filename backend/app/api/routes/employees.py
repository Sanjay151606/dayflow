from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeResponse, EmployeeCreate, EmployeeUpdateAdmin,
    EmployeeUpdateSelf, EmployeeListResponse
)
from app.api.deps import get_current_user, require_hr_or_admin, require_admin
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("", response_model=EmployeeListResponse)
def get_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    department: Optional[str] = None,
    employment_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    query = db.query(Employee).join(Employee.user).options(joinedload(Employee.user))

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_fmt)) |
            (Employee.last_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt)) |
            (User.employee_id.ilike(search_fmt)) |
            (Employee.department.ilike(search_fmt)) |
            (Employee.designation.ilike(search_fmt))
        )
    if department:
        query = query.filter(Employee.department == department)
    if employment_type:
        query = query.filter(Employee.employment_type == employment_type)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    items = query.order_by(Employee.id.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/me", response_model=EmployeeResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return employee


@router.put("/me", response_model=EmployeeResponse)
def update_my_profile(
    profile_in: EmployeeUpdateSelf,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")

    old_val = {"phone": employee.phone, "address": employee.address}
    
    if profile_in.phone is not None:
        employee.phone = profile_in.phone
    if profile_in.address is not None:
        employee.address = profile_in.address
    if profile_in.profile_picture is not None:
        employee.profile_picture = profile_in.profile_picture

    db.commit()
    db.refresh(employee)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="UPDATE_SELF_PROFILE",
        entity="EMPLOYEE",
        entity_id=str(employee.id),
        old_value=old_val,
        new_value={"phone": employee.phone, "address": employee.address},
        ip_address=request.client.host if request.client else None
    )

    return employee


@router.get("/{id}", response_model=EmployeeResponse)
def get_employee_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if db.query(User).filter(User.email == emp_in.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if db.query(User).filter(User.employee_id == emp_in.employee_id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID already taken")

    default_password = emp_in.password or "DayFlow@2026"
    new_user = User(
        employee_id=emp_in.employee_id,
        email=emp_in.email,
        password_hash=get_password_hash(default_password),
        role=emp_in.role,
        is_verified=True,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_emp = Employee(
        user_id=new_user.id,
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        phone=emp_in.phone,
        address=emp_in.address,
        date_of_birth=emp_in.date_of_birth,
        gender=emp_in.gender,
        profile_picture=emp_in.profile_picture,
        department=emp_in.department,
        designation=emp_in.designation,
        joining_date=emp_in.joining_date,
        employment_type=emp_in.employment_type,
        manager_id=emp_in.manager_id
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="CREATE_EMPLOYEE",
        entity="EMPLOYEE",
        entity_id=str(new_emp.id),
        new_value={"employee_id": emp_in.employee_id, "email": emp_in.email, "role": emp_in.role.value},
        ip_address=request.client.host if request.client else None
    )

    create_notification(
        db,
        user_id=new_user.id,
        title="Welcome to DAYFLOW",
        message="Your employee account has been created. Please explore your dashboard.",
        type="SUCCESS"
    )

    return new_emp


@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    emp_update: EmployeeUpdateAdmin,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if emp_update.first_name is not None:
        employee.first_name = emp_update.first_name
    if emp_update.last_name is not None:
        employee.last_name = emp_update.last_name
    if emp_update.phone is not None:
        employee.phone = emp_update.phone
    if emp_update.address is not None:
        employee.address = emp_update.address
    if emp_update.date_of_birth is not None:
        employee.date_of_birth = emp_update.date_of_birth
    if emp_update.gender is not None:
        employee.gender = emp_update.gender
    if emp_update.profile_picture is not None:
        employee.profile_picture = emp_update.profile_picture
    if emp_update.department is not None:
        employee.department = emp_update.department
    if emp_update.designation is not None:
        employee.designation = emp_update.designation
    if emp_update.joining_date is not None:
        employee.joining_date = emp_update.joining_date
    if emp_update.employment_type is not None:
        employee.employment_type = emp_update.employment_type
    if emp_update.manager_id is not None:
        employee.manager_id = emp_update.manager_id

    # Update user role or status if provided
    if employee.user:
        if emp_update.role is not None:
            employee.user.role = emp_update.role
        if emp_update.is_active is not None:
            employee.user.is_active = emp_update.is_active

    db.commit()
    db.refresh(employee)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="UPDATE_EMPLOYEE",
        entity="EMPLOYEE",
        entity_id=str(employee.id),
        new_value=emp_update.dict(exclude_unset=True),
        ip_address=request.client.host if request.client else None
    )

    return employee


@router.patch("/{id}/status")
def toggle_employee_status(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    employee = db.query(Employee).options(joinedload(Employee.user)).filter(Employee.id == id).first()
    if not employee or not employee.user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    employee.user.is_active = not employee.user.is_active
    db.commit()

    log_audit_event(
        db,
        user_id=current_user.id,
        action="TOGGLE_STATUS",
        entity="USER",
        entity_id=str(employee.user.id),
        new_value={"is_active": employee.user.is_active},
        ip_address=request.client.host if request.client else None
    )

    return {"message": f"Employee is now {'active' if employee.user.is_active else 'deactivated'}", "is_active": employee.user.is_active}
