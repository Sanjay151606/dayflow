from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole
from app.schemas.user import UserResponse


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    profile_picture: Optional[str] = None
    department: str = "General"
    designation: str = "Staff"
    joining_date: date = Field(default_factory=date.today)
    employment_type: str = "Full-Time"
    manager_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    email: EmailStr
    employee_id: str = Field(..., min_length=2, max_length=50)
    role: UserRole = UserRole.EMPLOYEE
    password: Optional[str] = None  # Default initial password if not set


class EmployeeUpdateAdmin(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    profile_picture: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    employment_type: Optional[str] = None
    manager_id: Optional[int] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class EmployeeUpdateSelf(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    items: List[EmployeeResponse]
    total: int
    page: int
    limit: int
