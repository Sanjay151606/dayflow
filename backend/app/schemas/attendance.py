from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.attendance import AttendanceStatus


class AttendanceCheckIn(BaseModel):
    remarks: Optional[str] = None


class AttendanceCheckOut(BaseModel):
    remarks: Optional[str] = None


class AttendanceUpdateAdmin(BaseModel):
    status: Optional[AttendanceStatus] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    working_hours: Optional[float] = None
    remarks: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: AttendanceStatus
    working_hours: float
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    total_days: int
    present_days: int
    absent_days: int
    half_days: int
    leave_days: int
    attendance_rate: float
    total_hours: float
