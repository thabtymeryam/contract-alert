import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager

# adjust these imports to your real file names if they differ
from app.models.alert_log import AlertLog
from app.models.contract import Contract, ContractStatus
from app.models.contract_event import ContractEvent
from app.models.notification import NotificationKind
from app.models.obligation import Obligation, ObligationStatus
from app.models.user import User, UserRole
from app.services.alert_rules import ALERT_RULES, MAX_OFFSET, UPCOMING_WINDOW_DAYS, severity_for, threshold_for
from app.services.notification_service import notify
from app.services.email_service import send_email
from app.services.email_template_service import build_digest

logger = logging.getLogger(__name__)
ALERTABLE_STATUSES = (ContractStatus.DRAFT, ContractStatus.ACTIVE)


@dataclass
class DueAlert:
    event: ContractEvent
    recipient: str
    user_id: int
    days_before: int 
    days_left: int


def find_due_alerts(db: Session, today: Optional[date] = None) -> list[DueAlert]:
    today = today or date.today()
    horizon = today + timedelta(days=MAX_OFFSET)
    rows = db.execute(
        select(ContractEvent, User.email, User.id)
        .join(Contract, ContractEvent.contract_id == Contract.id)
        .join(User, Contract.user_id == User.id)
        .options(contains_eager(ContractEvent.contract))
        .where(
            ContractEvent.date.is_not(None),
            ContractEvent.date >= today,
            ContractEvent.date <= horizon,
            ContractEvent.type.in_(list(ALERT_RULES.keys())),
            Contract.status.in_(ALERTABLE_STATUSES),
            User.is_active.is_(True),
        )
        .order_by(ContractEvent.date)
    ).all()
    if not rows:
        return []

    already_sent = {
        (r.event_id, r.days_before)
        for r in db.execute(
            select(AlertLog.event_id, AlertLog.days_before).where(
                AlertLog.event_id.in_([event.id for event, _, _ in rows])
            )
        )
    }

    due = []
    for event, email, user_id in rows:
        days_left = (event.date - today).days
        threshold = threshold_for(event.type, days_left)
        if threshold is None or (event.id, threshold) in already_sent:
            continue
        due.append(DueAlert(event=event, recipient=email, user_id=user_id, days_before=threshold, days_left=days_left))
    return due


def notify_due_alerts(db: Session, alerts: list[DueAlert]) -> int:
    """In-app reminders. Independent of email, so they still appear when SMTP is down or not set up."""
    created = 0
    for a in alerts:
        e = a.event
        created += notify(
            db,
            a.user_id,
            NotificationKind.DEADLINE,
            contract=e.contract,
            params={"event_type": e.type.value, "date": e.date.isoformat(), "days_left": a.days_left},
            severity=severity_for(a.days_left),
            link=f"/contracts/{e.contract_id}?tab=keyDates",
            dedupe_key=f"deadline:{e.id}:{a.days_before}:{a.user_id}",
        )
    return created


def process_alerts(db: Session, today: Optional[date] = None) -> dict[str, int]:
    due = find_due_alerts(db, today)
    notified = notify_due_alerts(db, due)

    by_recipient: dict[str, list[DueAlert]] = defaultdict(list)
    for alert in due:
        by_recipient[alert.recipient].append(alert)

    sent = 0
    for email, alerts in by_recipient.items():
        try:
            subject, text, html = build_digest(alerts)
            send_email(email, subject, text, html)
        except Exception:
            logger.exception("Failed to send alert email to %s", email)
            continue

        try:
            db.add_all(
                AlertLog(event_id=a.event.id, days_before=a.days_before, recipient=email)
                for a in alerts
            )
            db.commit()
            sent += len(alerts)
        except IntegrityError:
            db.rollback()
            logger.warning("Alerts for %s were already logged by another run", email)

    logger.info("Alert run finished: %d alert(s) emailed, %d notification(s) created", sent, notified)
    return {"sent": sent, "notified": notified}


def upcoming_alerts(db: Session, user: User, today: Optional[date] = None) -> list[dict]:
    """
    Key dates and open obligations in the next 90 days (plus overdue obligations),
    with the spec's severity. Admins see everything; users see their own contracts
    and the obligations assigned to them.
    """
    today = today or date.today()
    horizon = today + timedelta(days=UPCOMING_WINDOW_DAYS)
    is_admin = user.role == UserRole.ADMIN
    items: list[dict] = []

    events = (
        db.query(ContractEvent, Contract)
        .join(Contract, ContractEvent.contract_id == Contract.id)
        .filter(
            ContractEvent.date.is_not(None),
            ContractEvent.date >= today,
            ContractEvent.date <= horizon,
            ContractEvent.type.in_(list(ALERT_RULES.keys())),
            Contract.status.in_(ALERTABLE_STATUSES),
        )
    )
    if not is_admin:
        events = events.filter(Contract.user_id == user.id)
    for event, contract in events.all():
        days_left = (event.date - today).days
        items.append({
            "kind": "event", "id": event.id, "contract_id": contract.id, "contract_title": contract.title,
            "type": event.type.value, "title": None, "description": event.description,
            "date": event.date, "days_left": days_left, "severity": severity_for(days_left),
        })

    obligations = (
        db.query(Obligation, Contract)
        .join(Contract, Obligation.contract_id == Contract.id)
        .filter(
            Obligation.status != ObligationStatus.COMPLETED,
            Obligation.due_date.is_not(None),
            Obligation.due_date <= horizon,
        )
    )
    if not is_admin:
        obligations = obligations.filter(
            (Obligation.responsible_user_id == user.id) | (Contract.user_id == user.id)
        )
    for obligation, contract in obligations.all():
        days_left = (obligation.due_date - today).days
        items.append({
            "kind": "obligation", "id": obligation.id, "contract_id": contract.id, "contract_title": contract.title,
            "type": obligation.obligation_type, "title": obligation.title, "description": obligation.description,
            "date": obligation.due_date, "days_left": days_left, "severity": severity_for(days_left),
        })

    return sorted(items, key=lambda i: (i["date"], i["kind"]))
