import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    user_id: Optional[int],
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    ip_address: Optional[str] = None
):
    try:
        old_val_str = json.dumps(old_value, default=str) if isinstance(old_value, (dict, list)) else (str(old_value) if old_value is not None else None)
        new_val_str = json.dumps(new_value, default=str) if isinstance(new_value, (dict, list)) else (str(new_value) if new_value is not None else None)
        
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            old_value=old_val_str,
            new_value=new_val_str,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Error recording audit log: {e}")
