from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.settings import SystemSetting
from app.schemas.settings import SystemSettingResponse, SystemSettingUpdate
from app.api.deps import require_admin, get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/settings", tags=["System Settings"])


DEFAULT_SETTINGS = [
    {"key": "company_name", "value": "DAYFLOW Technologies Inc.", "category": "GENERAL", "description": "Legal company name"},
    {"key": "work_week_days", "value": "Monday,Tuesday,Wednesday,Thursday,Friday", "category": "ATTENDANCE", "description": "Standard business days"},
    {"key": "daily_standard_hours", "value": "8.0", "category": "ATTENDANCE", "description": "Expected daily working hours"},
    {"key": "annual_paid_leave_quota", "value": "15", "category": "LEAVE", "description": "Default annual paid leave allowance"},
    {"key": "annual_sick_leave_quota", "value": "10", "category": "LEAVE", "description": "Default annual sick leave allowance"},
    {"key": "overtime_rate_multiplier", "value": "1.5", "category": "PAYROLL", "description": "Overtime compensation rate factor"},
    {"key": "email_notifications_enabled", "value": "true", "category": "NOTIFICATION", "description": "Broadcast automated transactional emails"}
]


def ensure_default_settings(db: Session):
    for s in DEFAULT_SETTINGS:
        existing = db.query(SystemSetting).filter(SystemSetting.key == s["key"]).first()
        if not existing:
            db.add(SystemSetting(
                key=s["key"],
                value=s["value"],
                category=s["category"],
                description=s["description"]
            ))
    db.commit()


@router.get("", response_model=List[SystemSettingResponse])
def get_all_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_default_settings(db)
    return db.query(SystemSetting).all()


@router.put("", response_model=List[SystemSettingResponse])
def update_settings(
    update_data: SystemSettingUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    ensure_default_settings(db)
    for k, v in update_data.settings.items():
        record = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if record:
            record.value = str(v)
        else:
            db.add(SystemSetting(key=k, value=str(v), category="GENERAL"))
    db.commit()

    log_audit_event(
        db,
        user_id=current_user.id,
        action="UPDATE_SYSTEM_SETTINGS",
        entity="SYSTEM_SETTINGS",
        new_value=update_data.settings,
        ip_address=request.client.host if request.client else None
    )

    return db.query(SystemSetting).all()
