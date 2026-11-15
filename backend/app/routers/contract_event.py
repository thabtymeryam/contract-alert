from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User

from app.schemas.contract_event import (
    ContractEventCreate,
    ContractEventUpdate,
    ContractEventResponse,
)

from app.services.contract_event_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete,
)


router = APIRouter(
    prefix="/events",
    tags=["Contract Events"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[ContractEventResponse])
def get_events(
    contract_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_all(db, contract_id)


@router.get("/{event_id}", response_model=ContractEventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    return get_by_id(db, event_id)


# Writes are limited to the contract's owner or an admin (checked in the service)
@router.post("/", response_model=ContractEventResponse)
def create_event(
    data: ContractEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create(db, data, current_user)


@router.put("/{event_id}", response_model=ContractEventResponse)
def update_event(
    event_id: int,
    data: ContractEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update(db, event_id, data, current_user)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete(db, event_id, current_user)
