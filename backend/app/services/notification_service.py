from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "INFO"
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def broadcast_notification(
    db: Session,
    user_ids: List[int],
    title: str,
    message: str,
    type: str = "INFO"
):
    for uid in user_ids:
        create_notification(db, user_id=uid, title=title, message=message, type=type)
