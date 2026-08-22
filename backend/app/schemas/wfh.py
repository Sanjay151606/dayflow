from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.wfh import WFHStatus


class WFHRequestCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=3, max_length=500)


class WFHApprovalAction(BaseModel):
    comment: Optional[str] = None


class WFHRequestResponse(BaseModel):
    id: int
    employee_id: int
    start_date: date
    end_date: date
    reason: str
    status: WFHStatus
    approved_by: Optional[int] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True
