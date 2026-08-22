from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class DesignationBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    level: str = "Mid-Level"
    description: Optional[str] = None
    status: str = "ACTIVE"


class DesignationCreate(DesignationBase):
    department_id: int


class DesignationResponse(DesignationBase):
    id: int
    department_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None
    manager_id: Optional[int] = None
    status: str = "ACTIVE"


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[int] = None
    status: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    manager_name: Optional[str] = None
    employee_count: int = 0
    designations: List[DesignationResponse] = []

    class Config:
        from_attributes = True
