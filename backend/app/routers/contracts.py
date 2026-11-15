from datetime import date
from fastapi import APIRouter, Depends, File, UploadFile, status, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contract import ContractStatus
from app.schemas.contract import ContractCreate, ContractResponse, ContractUpdate
from app.services import contract_service
from app.core.security import get_current_user
from app.models.user import User
from app.utils.file_upload import display_name, save_contract_file
router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("/", response_model=list[ContractResponse])
def list_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contract_service.get_all_contracts(db)


@router.get("/me", response_model=list[ContractResponse])
def get_my_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contract_service.get_my_contracts(
        db,
        current_user.id
    )


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contract_service.get_contract_by_id(
        db,
        contract_id
    )


@router.post("/file", response_model=ContractResponse, status_code=201)
def create_contract_with_file(
    title: str = Form(...),
    description: str | None = Form(None),
    party_a: str = Form(...),
    party_b: str = Form(...),
    status: ContractStatus = Form(ContractStatus.DRAFT),
    start_date: date | None = Form(None),
    end_date: date | None = Form(None),
    renewal_date: date | None = Form(None),
    value: float | None = Form(None),
    pdf: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = ContractCreate(
        title=title,
        description=description,
        party_a=party_a,
        party_b=party_b,
        status=status,
        start_date=start_date,
        end_date=end_date,
        renewal_date=renewal_date,
        value=value,
    )

    file_path = None
    if pdf:
        file_path = save_contract_file(pdf)

    return contract_service.create_contract(db, data, file_path, current_user.id)


@router.post("/", response_model=ContractResponse, status_code=201)
def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contract_service.create_contract(
        db,
        data,
        file_path=None,
        user_id=current_user.id
    )


@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    data: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contract_service.update_contract(
        db,
        contract_id,
        data,
        current_user
    )


@router.put("/{contract_id}/file", response_model=ContractResponse)
def replace_contract_file(
    contract_id: int,
    pdf: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contract_service.replace_contract_file(db, contract_id, pdf, current_user)


@router.get("/{contract_id}/file")
def get_contract_file(
    contract_id: int,
    download: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream the contract PDF (inline for the viewer, or as a download)."""
    file_path = contract_service.get_contract_file_path(db, contract_id)
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=display_name(file_path),
        content_disposition_type="attachment" if download else "inline",
    )


@router.delete(
    "/{contract_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_service.delete_contract(
        db,
        contract_id,
        current_user
    )