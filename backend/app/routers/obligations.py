from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.obligation import ObligationCreate, ObligationResponse, ObligationUpdate
from app.services import obligation_service

router = APIRouter(prefix="/obligations", tags=["Obligations"])


@router.get("/", response_model=list[ObligationResponse])
def list_obligations(
    contract_id: int | None = None,
    assigned_to: str | None = None,
    status: Literal["pending", "overdue", "completed"] | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    assigned_to: "me" or a user id. status: pending (not done, not past due),
    overdue (not done, past due) or completed.
    """
    assignee_id = None
    if assigned_to == "me":
        assignee_id = current_user.id
    elif assigned_to is not None:
        if not assigned_to.isdigit():
            raise HTTPException(status_code=422, detail='assigned_to must be "me" or a user id')
        assignee_id = int(assigned_to)
    return obligation_service.get_all(db, contract_id, assignee_id, status)


@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(
    obligation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return obligation_service.get_by_id(db, obligation_id)


@router.post("/", response_model=ObligationResponse, status_code=201)
def create_obligation(
    data: ObligationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return obligation_service.create(db, data, current_user)


@router.put("/{obligation_id}", response_model=ObligationResponse)
def update_obligation(
    obligation_id: int,
    data: ObligationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return obligation_service.update(db, obligation_id, data, current_user)


@router.delete("/{obligation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_obligation(
    obligation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obligation_service.delete(db, obligation_id, current_user)
