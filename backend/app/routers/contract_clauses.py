from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User

from app.schemas.contract_clause import (
    ContractClauseCreate,
    ContractClauseUpdate,
    ContractClauseResponse,
)

from app.services.contract_clause_service import (
    get_all,
    get_by_id,
    create,
    update,
    delete,
)


router = APIRouter(
    prefix="/clauses",
    tags=["Contract Clauses"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[ContractClauseResponse])
def get_clauses(
    contract_id: int | None = None,
    db: Session = Depends(get_db),
):
    return get_all(db, contract_id)


@router.get("/{clause_id}", response_model=ContractClauseResponse)
def get_clause(
    clause_id: int,
    db: Session = Depends(get_db)
):
    return get_by_id(db, clause_id)


# Writes are limited to the contract's owner or an admin (checked in the service)
@router.post("/", response_model=ContractClauseResponse)
def create_clause(
    data: ContractClauseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create(db, data, current_user)


@router.put("/{clause_id}", response_model=ContractClauseResponse)
def update_clause(
    clause_id: int,
    data: ContractClauseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update(db, clause_id, data, current_user)


@router.delete("/{clause_id}")
def delete_clause(
    clause_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete(db, clause_id, current_user)
