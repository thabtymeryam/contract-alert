from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.contract import ExtractionStatus
# Shared with the /obligations API so status (incl. computed OVERDUE) and assignee match
from app.schemas.obligation import ObligationResponse  # noqa: F401


# --- Party ---

class PartyResponse(BaseModel):
    id: int
    contract_id: int
    name: str
    type: str | None
    role: str | None
    registration_number: str | None
    address: str | None
    contact_email: str | None
    contact_phone: str | None

    model_config = ConfigDict(from_attributes=True)


# --- Clause ---

class ClauseResponse(BaseModel):
    id: int
    contract_id: int
    clause_number: str | None
    title: str | None
    type: str | None
    text: str | None
    summary: str | None
    page_start: int | None
    page_end: int | None
    is_important: bool
    confidence: float | None

    model_config = ConfigDict(from_attributes=True)


# --- Event ---

class EventResponse(BaseModel):
    id: int
    contract_id: int
    clause_id: int | None
    type: str
    date: date | None
    description: str | None
    source_text: str | None

    model_config = ConfigDict(from_attributes=True)


# --- Payment Term ---

class PaymentTermResponse(BaseModel):
    id: int
    contract_id: int
    clause_id: int | None
    amount: float | None
    currency: str | None
    payment_type: str | None
    due_date: date | None
    due_days: int | None
    frequency: str | None
    description: str | None
    source_text: str | None

    model_config = ConfigDict(from_attributes=True)


# --- Penalty ---

class PenaltyResponse(BaseModel):
    id: int
    contract_id: int
    clause_id: int | None
    type: str | None
    amount: float | None
    percentage: float | None
    currency: str | None
    trigger: str | None
    description: str | None
    source_text: str | None

    model_config = ConfigDict(from_attributes=True)


# --- Full Contract Details (contract + all extracted data) ---

class ContractDetailsResponse(BaseModel):
    contract: "ContractInDetails"
    parties: list[PartyResponse]
    clauses: list[ClauseResponse]
    events: list[EventResponse]
    obligations: list[ObligationResponse]
    payment_terms: list[PaymentTermResponse]
    penalties: list[PenaltyResponse]


class ContractInDetails(BaseModel):
    id: int
    title: str
    description: str | None
    party_a: str
    party_b: str
    status: str
    start_date: date | None
    end_date: date | None
    renewal_date: date | None
    value: float | None
    user_id: int | None
    file_path: str | None
    extraction_status: ExtractionStatus
    extracted_at: datetime | None
    extraction_error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
