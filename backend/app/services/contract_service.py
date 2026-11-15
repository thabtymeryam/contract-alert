import os

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import ensure_can_edit_contract
from app.models.contract import Contract
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractUpdate
from app.utils.file_upload import delete_contract_file, save_contract_file


def get_all_contracts(db: Session) -> list[Contract]:
    return db.query(Contract).all()


def get_my_contracts(db: Session, user_id: int) -> list[Contract]:
    return db.query(Contract).filter(
        Contract.user_id == user_id
    ).all()


def get_contract_by_id(db: Session, contract_id: int) -> Contract:
    contract = db.query(Contract).filter(
        Contract.id == contract_id
    ).first()

    if not contract:
        raise HTTPException(
            status_code=404,
            detail="Contract not found"
        )

    return contract


def get_editable_contract(db: Session, contract_id: int, user: User) -> Contract:
    """The contract, if the user may change it or the items extracted from it (owner or admin)."""
    contract = get_contract_by_id(db, contract_id)
    ensure_can_edit_contract(contract, user)
    return contract


def create_contract(
    db: Session,
    data: ContractCreate,
    file_path: str | None = None,
    user_id: int | None = None
) -> Contract:
    contract = Contract(
        **data.model_dump(),
        file_path=file_path,
        user_id=user_id
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return contract


def update_contract(
    db: Session,
    contract_id: int,
    data: ContractUpdate,
    user: User
) -> Contract:
    contract = get_contract_by_id(db, contract_id)
    ensure_can_edit_contract(contract, user)

    # Only fields present in the request body change; an explicit null clears an optional field
    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(contract, field, value)

    db.commit()
    db.refresh(contract)

    return contract


def replace_contract_file(
    db: Session,
    contract_id: int,
    file: UploadFile,
    user: User
) -> Contract:
    contract = get_contract_by_id(db, contract_id)
    ensure_can_edit_contract(contract, user)

    old_path = contract.file_path
    contract.file_path = save_contract_file(file)
    db.commit()
    delete_contract_file(old_path)

    db.refresh(contract)
    return contract


def get_contract_file_path(db: Session, contract_id: int) -> str:
    contract = get_contract_by_id(db, contract_id)
    if not contract.file_path or not os.path.exists(contract.file_path):
        raise HTTPException(status_code=404, detail="This contract has no PDF")
    return contract.file_path


def delete_contract(
    db: Session,
    contract_id: int,
    user: User
) -> None:

    contract = get_contract_by_id(
        db,
        contract_id
    )
    ensure_can_edit_contract(contract, user)

    delete_contract_file(contract.file_path)

    db.delete(contract)
    db.commit()
