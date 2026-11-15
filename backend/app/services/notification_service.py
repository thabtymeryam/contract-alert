from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.notification import Notification, NotificationKind
from app.models.user import User


def notify(
    db: Session,
    user_id: int,
    kind: NotificationKind,
    contract: Contract | None = None,
    params: dict | None = None,
    severity: str | None = None,
    link: str | None = None,
    dedupe_key: str | None = None,
) -> bool:
    """Create a notification. Returns False if one with the same dedupe_key already exists."""
    if dedupe_key and db.query(Notification.id).filter(Notification.dedupe_key == dedupe_key).first():
        return False

    db.add(Notification(
        user_id=user_id,
        kind=kind,
        severity=severity,
        contract_id=contract.id if contract else None,
        contract_title=contract.title if contract else None,
        params=params or {},
        link=link,
        dedupe_key=dedupe_key,
    ))
    try:
        db.commit()
    except IntegrityError:  # a concurrent run created the same dedupe_key
        db.rollback()
        return False
    return True


def list_for_user(db: Session, user: User, unread_only: bool = False, limit: int = 50) -> list[Notification]:
    query = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        query = query.filter(Notification.read_at.is_(None))
    return query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(limit).all()


def unread_count(db: Session, user: User) -> int:
    return db.query(Notification).filter(Notification.user_id == user.id, Notification.read_at.is_(None)).count()


def mark_read(db: Session, user: User, notification_id: int) -> Notification:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.read_at is None:
        notification.read_at = datetime.now()
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_read(db: Session, user: User) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.read_at.is_(None))
        .update({Notification.read_at: datetime.now()}, synchronize_session=False)
    )
    db.commit()
    return updated
