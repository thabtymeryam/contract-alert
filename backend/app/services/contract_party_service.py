from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.contract_party import ContractParty
from app.models.user import User
from app.schemas.contract_party import (
    ContractPartyCreate,
    ContractPartyUpdate,
)
from app.services.contract_service import get_editable_contract


def get_all(db: Session, contract_id: int | None = None):
    query = db.query(ContractParty)
    if contract_id is not None:
        query = query.filter(ContractParty.contract_id == contract_id)
    return query.order_by(ContractParty.id).all()


def get_by_id(db: Session, party_id: int):
    party = (
        db.query(ContractParty)
        .filter(ContractParty.id == party_id)
        .first()
    )

    if not party:
        raise HTTPException(
            status_code=404,
            detail="Contract party not found"
        )

    return party


def create(db: Session, party_data: ContractPartyCreate, user: User):
    get_editable_contract(db, party_data.contract_id, user)

    party = ContractParty(
        contract_id=party_data.contract_id,
        name=party_data.name,
        type=party_data.type,
        role=party_data.role,
        registration_number=party_data.registration_number,
        address=party_data.address,
        contact_email=party_data.contact_email,
        contact_phone=party_data.contact_phone,
    )

    db.add(party)
    db.commit()
    db.refresh(party)

    return party


def update(
    db: Session,
    party_id: int,
    party_data: ContractPartyUpdate,
    user: User
):
    party = get_by_id(db, party_id)
    get_editable_contract(db, party.contract_id, user)

    update_data = party_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(party, key, value)

    db.commit()
    db.refresh(party)

    return party


def delete(db: Session, party_id: int, user: User):
    party = get_by_id(db, party_id)
    get_editable_contract(db, party.contract_id, user)

    db.delete(party)
    db.commit()

    return {"message": "Contract party deleted successfully"}
