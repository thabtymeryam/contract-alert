from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.clause import Clause
from app.models.contract_event import ContractEvent
from app.models.user import User
from app.schemas.contract_event import (
    ContractEventCreate,
    ContractEventUpdate,
)
from app.services.contract_service import get_editable_contract


def get_all(db: Session, contract_id: int | None = None):
    query = db.query(ContractEvent)
    if contract_id is not None:
        query = query.filter(ContractEvent.contract_id == contract_id)
    return query.order_by(ContractEvent.date, ContractEvent.id).all()


def get_by_id(db: Session, event_id: int):
    event = (
        db.query(ContractEvent)
        .filter(ContractEvent.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Contract event not found"
        )

    return event


def _ensure_clause_in_contract(db: Session, clause_id: int, contract_id: int) -> None:
    clause = (
        db.query(Clause)
        .filter(Clause.id == clause_id)
        .first()
    )

    if not clause:
        raise HTTPException(
            status_code=404,
            detail="Contract clause not found"
        )

    if clause.contract_id != contract_id:
        raise HTTPException(
            status_code=400,
            detail="Clause does not belong to the specified contract"
        )


def create(db: Session, event_data: ContractEventCreate, user: User):
    get_editable_contract(db, event_data.contract_id, user)

    if event_data.clause_id is not None:
        _ensure_clause_in_contract(db, event_data.clause_id, event_data.contract_id)

    event = ContractEvent(
        contract_id=event_data.contract_id,
        clause_id=event_data.clause_id,
        type=event_data.type,
        date=event_data.date,
        description=event_data.description,
        source_text=event_data.source_text,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


def update(
    db: Session,
    event_id: int,
    event_data: ContractEventUpdate,
    user: User
):
    event = get_by_id(db, event_id)
    get_editable_contract(db, event.contract_id, user)

    update_data = event_data.model_dump(exclude_unset=True)

    if update_data.get("clause_id") is not None:
        _ensure_clause_in_contract(db, update_data["clause_id"], event.contract_id)

    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)

    return event


def delete(db: Session, event_id: int, user: User):
    event = get_by_id(db, event_id)
    get_editable_contract(db, event.contract_id, user)

    db.delete(event)
    db.commit()

    return {"message": "Contract event deleted successfully"}
