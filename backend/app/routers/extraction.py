from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.contract import ContractResponse
from app.schemas.extraction import ContractDetailsResponse
from app.services import contract_service, extraction_service

router = APIRouter(prefix="/extraction", tags=["AI Extraction"])


@router.post("/{contract_id}/extract", response_model=ContractResponse, status_code=status.HTTP_202_ACCEPTED)
def extract_contract(
    contract_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run AI extraction on a contract's PDF.

    This reads the PDF, sends the text to the AI provider, and saves
    the extracted parties, clauses, events, etc. to the database.

    You can call this multiple times — it will replace old extracted data.

    Returns right away with extraction_status="running"; poll GET /api/contracts/{id}
    until it becomes "done" or "failed" (with extraction_error).
    """
    contract = contract_service.get_editable_contract(db, contract_id, current_user)
    contract = extraction_service.start_extraction(db, contract)
    background_tasks.add_task(extraction_service.run_extraction_job, contract_id)
    return contract


@router.get("/{contract_id}/details", response_model=ContractDetailsResponse)
def get_contract_details(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a contract with all its extracted data.

    Returns the contract info plus all parties, clauses, events,
    obligations, payment terms, and penalties that were extracted.
    """
    return extraction_service.get_contract_details(db, contract_id)
