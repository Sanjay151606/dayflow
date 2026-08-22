from datetime import date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class AttendanceReportItem(BaseModel):
    date: date
    present_count: int
    absent_count: int
    half_day_count: int
    leave_count: int
    total_employees: int
    attendance_rate: float


class LeaveReportItem(BaseModel):
    leave_type: str
    count: int
    approved: int
    pending: int
    rejected: int


class DepartmentHeadcountItem(BaseModel):
    department: str
    count: int


class PayrollReportItem(BaseModel):
    pay_period: str
    total_basic: float
    total_allowances: float
    total_deductions: float
    total_net: float
    employee_count: int


class DashboardMetrics(BaseModel):
    total_employees: int
    present_today: int
    absent_today: int
    half_day_today: int
    pending_leaves: int
    approved_leaves_month: int
    total_payroll_month: float
    department_distribution: List[DepartmentHeadcountItem]
    weekly_attendance: List[Dict[str, Any]]
    monthly_attendance: List[Dict[str, Any]]
    leave_distribution: List[Dict[str, Any]]
