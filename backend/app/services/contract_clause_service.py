from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.clause import Clause
from app.models.user import User
from app.schemas.contract_clause import (
    ContractClauseCreate,
    ContractClauseUpdate,
)
from app.services.contract_service import get_editable_contract


def get_all(db: Session, contract_id: int | None = None):
    query = db.query(Clause)
    if contract_id is not None:
        query = query.filter(Clause.contract_id == contract_id)
    return query.order_by(Clause.id).all()


def get_by_id(db: Session, clause_id: int):
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

    return clause


def create(db: Session, clause_data: ContractClauseCreate, user: User):
    get_editable_contract(db, clause_data.contract_id, user)

    clause = Clause(**clause_data.model_dump())

    db.add(clause)
    db.commit()
    db.refresh(clause)

    return clause


def update(
    db: Session,
    clause_id: int,
    clause_data: ContractClauseUpdate,
    user: User
):
    clause = get_by_id(db, clause_id)
    get_editable_contract(db, clause.contract_id, user)

    update_data = clause_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(clause, key, value)

    db.commit()
    db.refresh(clause)

    return clause


def delete(db: Session, clause_id: int, user: User):
    clause = get_by_id(db, clause_id)
    get_editable_contract(db, clause.contract_id, user)

    db.delete(clause)
    db.commit()

    return {"message": "Contract clause deleted successfully"}
