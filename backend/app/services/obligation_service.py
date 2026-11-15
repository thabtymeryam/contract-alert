from datetime import date

from fastapi import HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app.core.security import can_edit_contract
from app.models.notification import NotificationKind
from app.models.obligation import Obligation, ObligationStatus
from app.models.user import User
from app.schemas.obligation import ObligationCreate, ObligationUpdate
from app.services.contract_service import get_contract_by_id, get_editable_contract
from app.services.notification_service import notify


def get_all(
    db: Session,
    contract_id: int | None = None,
    assigned_to: int | None = None,
    status: str | None = None,
) -> list[Obligation]:
    query = db.query(Obligation).options(joinedload(Obligation.contract))
    if contract_id is not None:
        query = query.filter(Obligation.contract_id == contract_id)
    if assigned_to is not None:
        query = query.filter(Obligation.responsible_user_id == assigned_to)

    today = date.today()
    past_due = and_(Obligation.due_date.is_not(None), Obligation.due_date < today)
    if status == "completed":
        query = query.filter(Obligation.status == ObligationStatus.COMPLETED)
    elif status == "overdue":
        query = query.filter(Obligation.status != ObligationStatus.COMPLETED, past_due)
    elif status == "pending":
        query = query.filter(Obligation.status != ObligationStatus.COMPLETED, or_(Obligation.due_date.is_(None), ~past_due))

    return query.order_by(Obligation.due_date.is_(None), Obligation.due_date, Obligation.id).all()


def get_by_id(db: Session, obligation_id: int) -> Obligation:
    obligation = db.query(Obligation).filter(Obligation.id == obligation_id).first()
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return obligation


def _notify_assignee(db: Session, obligation: Obligation, actor: User) -> None:
    """Tell the new assignee, unless they assigned it to themselves."""
    if not obligation.responsible_user_id or obligation.responsible_user_id == actor.id:
        return
    notify(
        db,
        obligation.responsible_user_id,
        NotificationKind.OBLIGATION_ASSIGNED,
        contract=obligation.contract,
        params={"obligation_title": obligation.title, "assigned_by": actor.email},
        link=f"/contracts/{obligation.contract_id}?tab=obligations",
    )


def _ensure_assignable(db: Session, user_id: int | None) -> None:
    if user_id is None:
        return
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Obligations can only be assigned to active users")


def create(db: Session, data: ObligationCreate, user: User) -> Obligation:
    get_editable_contract(db, data.contract_id, user)
    _ensure_assignable(db, data.responsible_user_id)

    obligation = Obligation(**data.model_dump(), status=ObligationStatus.PENDING)
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    _notify_assignee(db, obligation, user)
    return obligation


def update(db: Session, obligation_id: int, data: ObligationUpdate, user: User) -> Obligation:
    obligation = get_by_id(db, obligation_id)
    changes = data.model_dump(exclude_unset=True)

    # The assignee may tick their own obligation done (or reopen it); anything else needs edit rights
    contract = get_contract_by_id(db, obligation.contract_id)
    is_assignee = obligation.responsible_user_id == user.id
    if not can_edit_contract(contract, user) and not (is_assignee and set(changes) <= {"status"}):
        raise HTTPException(
            status_code=403,
            detail="Only the contract owner, an admin or the assignee (status only) can change this obligation",
        )

    previous_assignee = obligation.responsible_user_id
    if "responsible_user_id" in changes:
        _ensure_assignable(db, changes["responsible_user_id"])

    for field, value in changes.items():
        setattr(obligation, field, value)

    db.commit()
    db.refresh(obligation)
    if obligation.responsible_user_id != previous_assignee:
        _notify_assignee(db, obligation, user)
    return obligation


def delete(db: Session, obligation_id: int, user: User) -> None:
    obligation = get_by_id(db, obligation_id)
    get_editable_contract(db, obligation.contract_id, user)
    db.delete(obligation)
    db.commit()
