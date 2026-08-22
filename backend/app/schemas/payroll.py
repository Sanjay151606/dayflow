from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.payroll import PayrollStatus


class PayrollBase(BaseModel):
    employee_id: int
    basic_salary: float = Field(..., ge=0)
    allowances: float = Field(default=0.0, ge=0)
    deductions: float = Field(default=0.0, ge=0)
    pay_period: str = Field(..., min_length=4, max_length=20)  # "2026-08"
    payment_date: Optional[date] = None
    status: PayrollStatus = PayrollStatus.PENDING


class PayrollCreate(PayrollBase):
    pass


class PayrollUpdate(BaseModel):
    basic_salary: Optional[float] = Field(None, ge=0)
    allowances: Optional[float] = Field(None, ge=0)
    deductions: Optional[float] = Field(None, ge=0)
    pay_period: Optional[str] = None
    payment_date: Optional[date] = None
    status: Optional[PayrollStatus] = None


class PayrollResponse(PayrollBase):
    id: int
    net_salary: float
    created_at: datetime
    updated_at: datetime
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None

    class Config:
        from_attributes = True


class SalarySlipResponse(BaseModel):
    payroll_id: int
    employee_id: str
    employee_name: str
    department: str
    designation: str
    joining_date: date
    pay_period: str
    payment_date: Optional[date]
    basic_salary: float
    allowances: float
    deductions: float
    net_salary: float
    generated_at: datetime
