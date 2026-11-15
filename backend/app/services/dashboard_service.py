from collections import Counter
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.contract import Contract, ContractStatus
from app.models.obligation import Obligation, ObligationStatus
from app.models.user import User, UserRole
from app.services.alert_service import upcoming_alerts

UPCOMING_LIMIT = 8
MY_OBLIGATIONS_LIMIT = 5


def get_summary(db: Session, user: User) -> dict:
    today = date.today()
    is_admin = user.role == UserRole.ADMIN

    # Everyone can see every contract, so contract counts are company-wide
    contracts_total = db.query(func.count(Contract.id)).scalar()
    contracts_active = db.query(func.count(Contract.id)).filter(Contract.status == ContractStatus.ACTIVE).scalar()
    expiring_soon = (
        db.query(func.count(Contract.id))
        .filter(
            Contract.status.in_((ContractStatus.DRAFT, ContractStatus.ACTIVE)),
            Contract.end_date >= today,
            Contract.end_date <= today + timedelta(days=30),
        )
        .scalar()
    )

    open_obligations = db.query(Obligation).filter(Obligation.status != ObligationStatus.COMPLETED)
    scoped = open_obligations if is_admin else open_obligations.filter(Obligation.responsible_user_id == user.id)
    overdue = scoped.filter(Obligation.due_date.is_not(None), Obligation.due_date < today).count()
    pending = scoped.count() - overdue

    my_open = (
        open_obligations.options(joinedload(Obligation.contract))
        .filter(Obligation.responsible_user_id == user.id)
        .order_by(Obligation.due_date.is_(None), Obligation.due_date, Obligation.id)
    )

    alerts = upcoming_alerts(db, user, today)
    severity_counts = Counter(a["severity"] for a in alerts)

    return {
        "contracts": {"total": contracts_total, "active": contracts_active, "expiring_soon": expiring_soon},
        "obligations": {
            "scope": "all" if is_admin else "mine",
            "pending": pending,
            "overdue": overdue,
            "mine_open": my_open.count(),
        },
        "alerts": {s: severity_counts.get(s, 0) for s in ("critical", "warning", "upcoming")},
        "upcoming": alerts[:UPCOMING_LIMIT],
        "my_obligations": my_open.limit(MY_OBLIGATIONS_LIMIT).all(),
    }
