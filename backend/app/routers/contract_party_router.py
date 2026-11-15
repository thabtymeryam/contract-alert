from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User

from app.schemas.contract_party import (
    ContractPartyCreate,
    ContractPartyUpdate,
    ContractPartyResponse,
)

from app.services.contract_party_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete,
)


router = APIRouter(
    prefix="/parties",
    tags=["Contract Parties"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[ContractPartyResponse])
def get_parties(
    contract_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_all(db, contract_id)


@router.get("/{party_id}", response_model=ContractPartyResponse)
def get_party(
    party_id: int,
    db: Session = Depends(get_db)
):
    return get_by_id(db, party_id)


# Writes are limited to the contract's owner or an admin (checked in the service)
@router.post("/", response_model=ContractPartyResponse)
def create_party(
    data: ContractPartyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create(db, data, current_user)


@router.put("/{party_id}", response_model=ContractPartyResponse)
def update_party(
    party_id: int,
    data: ContractPartyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update(db, party_id, data, current_user)


@router.delete("/{party_id}")
def delete_party(
    party_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete(db, party_id, current_user)
