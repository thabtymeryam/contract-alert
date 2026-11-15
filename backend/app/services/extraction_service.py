import enum
import logging
import os
from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.clause import Clause, ClauseType
from app.models.contract import Contract, ExtractionStatus
from app.models.contract_event import ContractEvent, EventType
from app.models.contract_party import ContractParty, PartyRole, PartyType
from app.models.notification import NotificationKind
from app.models.obligation import Obligation
from app.models.payment_term import PaymentTerm, PaymentType
from app.models.penalty import Penalty
from app.services.ai_service import extract_contract_data
from app.services.notification_service import notify
from app.services.pdf_service import extract_text_from_pdf

logger = logging.getLogger(__name__)


# Models (local ones especially) don't always follow the requested format,
# and a single bad value would fail the whole commit, so every field is coerced.

def _enum(value, enum_cls: type[enum.Enum], default=None):
    """Map a string like "company" or "Service Provider" to an enum member, or return default."""
    if isinstance(value, str):
        key = value.strip().upper().replace(" ", "_").replace("-", "_")
        if key in enum_cls.__members__:
            return enum_cls[key]
    return default


def _date(value) -> date | None:
    """Parse a YYYY-MM-DD string; anything else becomes None."""
    if isinstance(value, str):
        try:
            return date.fromisoformat(value.strip())
        except ValueError:
            return None
    return None


def _number(value) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str):
        try:
            return float(value.replace(",", "").strip())
        except ValueError:
            return None
    return None


def _int(value) -> int | None:
    number = _number(value)
    return int(number) if number is not None else None


def _text(value, max_length: int | None = None) -> str | None:
    if value is None:
        return None
    text = str(value)
    return text[:max_length] if max_length else text


def run_extraction(db: Session, contract_id: int) -> dict:
    """Read the contract's PDF, run it through the AI provider and replace the extracted data."""
    logger.info("Extraction started for contract %d", contract_id)

    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if not contract.file_path:
        raise HTTPException(status_code=400, detail="Contract has no PDF file. Upload a PDF first.")

    # Paths are relative to the backend's working directory (see utils/file_upload.py)
    pdf_path = contract.file_path.lstrip("/")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF file not found on disk: {contract.file_path}")

    contract_text = extract_text_from_pdf(pdf_path)
    if not contract_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the PDF.")

    try:
        extracted = extract_contract_data(contract_text)
    except (RuntimeError, ValueError) as e:
        logger.error("AI extraction failed for contract %d: %s", contract_id, e)
        raise HTTPException(status_code=502, detail=f"AI extraction failed: {e}") from e

    # Re-running replaces everything extracted before
    db.query(ContractParty).filter(ContractParty.contract_id == contract_id).delete()
    db.query(ContractEvent).filter(ContractEvent.contract_id == contract_id).delete()
    db.query(Obligation).filter(Obligation.contract_id == contract_id).delete()
    db.query(PaymentTerm).filter(PaymentTerm.contract_id == contract_id).delete()
    db.query(Penalty).filter(Penalty.contract_id == contract_id).delete()
    db.query(Clause).filter(Clause.contract_id == contract_id).delete()

    for party_data in extracted.get("parties") or []:
        db.add(ContractParty(
            contract_id=contract_id,
            name=_text(party_data.get("name"), 255) or "Unknown",
            type=_enum(party_data.get("type"), PartyType, PartyType.OTHER),
            role=_enum(party_data.get("role"), PartyRole, PartyRole.OTHER),
            registration_number=_text(party_data.get("registration_number"), 255),
            address=_text(party_data.get("address")),
            contact_email=_text(party_data.get("contact_email"), 255),
            contact_phone=_text(party_data.get("contact_phone"), 100),
        ))

    for clause_data in extracted.get("clauses") or []:
        db.add(Clause(
            contract_id=contract_id,
            clause_number=_text(clause_data.get("clause_number"), 50),
            title=_text(clause_data.get("title"), 255),
            type=_enum(clause_data.get("type"), ClauseType, ClauseType.OTHER),
            text=_text(clause_data.get("text")),
            summary=_text(clause_data.get("summary")),
            page_start=_int(clause_data.get("page_start")),
            page_end=_int(clause_data.get("page_end")),
            is_important=bool(clause_data.get("is_important")),
            confidence=_number(clause_data.get("confidence")),
        ))

    for event_data in extracted.get("events") or []:
        db.add(ContractEvent(
            contract_id=contract_id,
            type=_enum(event_data.get("type"), EventType, EventType.OTHER),
            date=_date(event_data.get("date")),
            description=_text(event_data.get("description")),
            source_text=_text(event_data.get("source_text")),
        ))

    for obligation_data in extracted.get("obligations") or []:
        db.add(Obligation(
            contract_id=contract_id,
            title=_text(obligation_data.get("title"), 255) or "Untitled",
            description=_text(obligation_data.get("description")),
            obligation_type=_text(obligation_data.get("obligation_type"), 100),
            frequency=_text(obligation_data.get("frequency"), 50),
            source_text=_text(obligation_data.get("source_text")),
        ))

    for payment_data in extracted.get("payment_terms") or []:
        db.add(PaymentTerm(
            contract_id=contract_id,
            amount=_number(payment_data.get("amount")),
            currency=_text(payment_data.get("currency"), 10),
            payment_type=_enum(payment_data.get("payment_type"), PaymentType, PaymentType.OTHER),
            due_date=_date(payment_data.get("due_date")),
            due_days=_int(payment_data.get("due_days")),
            frequency=_text(payment_data.get("frequency"), 50),
            description=_text(payment_data.get("description")),
            source_text=_text(payment_data.get("source_text")),
        ))

    for penalty_data in extracted.get("penalties") or []:
        db.add(Penalty(
            contract_id=contract_id,
            type=_text(penalty_data.get("type"), 100),
            amount=_number(penalty_data.get("amount")),
            percentage=_number(penalty_data.get("percentage")),
            currency=_text(penalty_data.get("currency"), 10),
            trigger=_text(penalty_data.get("trigger")),
            description=_text(penalty_data.get("description")),
            source_text=_text(penalty_data.get("source_text")),
        ))

    # Only fields the AI actually found overwrite the contract
    metadata = extracted.get("metadata") or {}
    if metadata.get("title"):
        contract.title = _text(metadata["title"], 255)
    if metadata.get("description"):
        contract.description = _text(metadata["description"])
    if _date(metadata.get("start_date")):
        contract.start_date = _date(metadata["start_date"])
    if _date(metadata.get("end_date")):
        contract.end_date = _date(metadata["end_date"])
    if _number(metadata.get("value")):
        contract.value = _number(metadata["value"])

    db.commit()
    logger.info("Extraction finished for contract %d", contract_id)

    return {
        "contract_id": contract_id,
        "metadata": metadata,
        "parties": extracted.get("parties") or [],
        "clauses": extracted.get("clauses") or [],
        "events": extracted.get("events") or [],
        "obligations": extracted.get("obligations") or [],
        "payment_terms": extracted.get("payment_terms") or [],
        "penalties": extracted.get("penalties") or [],
    }


def get_contract_details(db: Session, contract_id: int) -> dict:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    parties = db.query(ContractParty).filter(ContractParty.contract_id == contract_id).all()
    clauses = db.query(Clause).filter(Clause.contract_id == contract_id).all()
    events = db.query(ContractEvent).filter(ContractEvent.contract_id == contract_id).all()
    obligations = db.query(Obligation).filter(Obligation.contract_id == contract_id).all()
    payment_terms = db.query(PaymentTerm).filter(PaymentTerm.contract_id == contract_id).all()
    penalties = db.query(Penalty).filter(Penalty.contract_id == contract_id).all()

    return {
        "contract": contract,
        "parties": parties,
        "clauses": clauses,
        "events": events,
        "obligations": obligations,
        "payment_terms": payment_terms,
        "penalties": penalties,
    }


# Extraction can take minutes (Gemini rate-limit retries, local Ollama), so the API
# only marks the contract as running and the work happens in a background task.

def start_extraction(db: Session, contract: Contract) -> Contract:
    if not contract.file_path:
        raise HTTPException(status_code=400, detail="Contract has no PDF file. Upload a PDF first.")
    if contract.extraction_status == ExtractionStatus.RUNNING:
        raise HTTPException(status_code=409, detail="Extraction is already running for this contract")

    contract.extraction_status = ExtractionStatus.RUNNING
    contract.extraction_error = None
    db.commit()
    db.refresh(contract)
    return contract


def run_extraction_job(contract_id: int) -> None:
    db = SessionLocal()
    try:
        try:
            run_extraction(db, contract_id)
            status, error = ExtractionStatus.DONE, None
        except HTTPException as e:
            db.rollback()
            status, error = ExtractionStatus.FAILED, str(e.detail)
        except Exception as e:  # noqa: BLE001
            db.rollback()
            logger.exception("Extraction crashed for contract %d", contract_id)
            status, error = ExtractionStatus.FAILED, f"Unexpected error: {e}"

        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract:
            contract.extraction_status = status
            contract.extraction_error = error
            if status == ExtractionStatus.DONE:
                contract.extracted_at = datetime.now()
            db.commit()
            _notify_owner(db, contract, status, error)
    finally:
        db.close()


def _notify_owner(db: Session, contract: Contract, status: ExtractionStatus, error: str | None) -> None:
    if not contract.user_id:
        return
    done = status == ExtractionStatus.DONE
    notify(
        db,
        contract.user_id,
        NotificationKind.EXTRACTION_DONE if done else NotificationKind.EXTRACTION_FAILED,
        contract=contract,
        params={} if done else {"error": error},
        link=f"/contracts/{contract.id}" + ("?tab=clauses" if done else ""),
    )


def reset_interrupted_extractions(db: Session) -> None:
    """Jobs still "running" at startup were cut off by a restart."""
    count = (
        db.query(Contract)
        .filter(Contract.extraction_status == ExtractionStatus.RUNNING)
        .update(
            {Contract.extraction_status: ExtractionStatus.FAILED,
             Contract.extraction_error: "Interrupted by a server restart. Run the extraction again."},
            synchronize_session=False,
        )
    )
    db.commit()
    if count:
        logger.warning("Marked %d interrupted extraction(s) as failed", count)
