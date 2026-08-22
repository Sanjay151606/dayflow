from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.leave import LeaveType, LeaveStatus


class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType = LeaveType.PAID
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=3, max_length=500)

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, v: date, info) -> date:
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("End date cannot be earlier than start date")
        return v


class LeaveApprovalAction(BaseModel):
    comment: Optional[str] = None


class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str
    status: LeaveStatus
    approved_by: Optional[int] = None
    approval_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveSummary(BaseModel):
    total_requested: int
    pending: int
    approved: int
    rejected: int
    paid_leave_balance: int = 15
    sick_leave_balance: int = 10
