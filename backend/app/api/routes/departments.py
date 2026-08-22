from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.user import User
from app.models.department import Department, Designation
from app.models.employee import Employee
from app.schemas.department import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    DesignationCreate, DesignationResponse
)
from app.api.deps import require_admin, require_hr_or_admin
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/departments", tags=["Departments & Designations"])


@router.get("", response_model=List[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_or_admin)
):
    depts = db.query(Department).options(
        joinedload(Department.designations),
        joinedload(Department.manager)
    ).all()

    result = []
    for d in depts:
        emp_count = db.query(Employee).filter(Employee.department == d.name).count()
        result.append(DepartmentResponse(
            id=d.id,
            name=d.name,
            code=d.code,
            description=d.description,
            manager_id=d.manager_id,
            status=d.status,
            created_at=d.created_at,
            updated_at=d.updated_at,
            manager_name=f"{d.manager.first_name} {d.manager.last_name}" if d.manager else None,
            employee_count=emp_count,
            designations=[
                DesignationResponse(
                    id=des.id,
                    department_id=des.department_id,
                    title=des.title,
                    level=des.level,
                    description=des.description,
                    status=des.status,
                    created_at=des.created_at
                )
                for des in d.designations
            ]
        ))
    return result


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if db.query(Department).filter(Department.name == dept_in.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department name already exists")
    if db.query(Department).filter(Department.code == dept_in.code).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department code already exists")

    new_dept = Department(
        name=dept_in.name,
        code=dept_in.code,
        description=dept_in.description,
        manager_id=dept_in.manager_id,
        status=dept_in.status
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    log_audit_event(
        db,
        user_id=current_user.id,
        action="CREATE_DEPARTMENT",
        entity="DEPARTMENT",
        entity_id=str(new_dept.id),
        new_value={"name": new_dept.name, "code": new_dept.code},
        ip_address=request.client.host if request.client else None
    )

    return DepartmentResponse(
        id=new_dept.id,
        name=new_dept.name,
        code=new_dept.code,
        description=new_dept.description,
        manager_id=new_dept.manager_id,
        status=new_dept.status,
        created_at=new_dept.created_at,
        updated_at=new_dept.updated_at,
        employee_count=0,
        designations=[]
    )


@router.post("/designations", response_model=DesignationResponse, status_code=status.HTTP_201_CREATED)
def create_designation(
    des_in: DesignationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    dept = db.query(Department).filter(Department.id == des_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    new_des = Designation(
        department_id=des_in.department_id,
        title=des_in.title,
        level=des_in.level,
        description=des_in.description,
        status=des_in.status
    )
    db.add(new_des)
    db.commit()
    db.refresh(new_des)
    return new_des
