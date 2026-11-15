from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.contract import ContractStatus, ExtractionStatus


class ContractCreate(BaseModel):
    title: str
    description: str | None = None
    party_a: str
    party_b: str
    status: ContractStatus = ContractStatus.DRAFT
    start_date: date | None = None
    end_date: date | None = None
    renewal_date: date | None = None
    value: float | None = None


class ContractUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    party_a: str | None = None
    party_b: str | None = None
    status: ContractStatus | None = None
    start_date: date | None = None
    end_date: date | None = None
    renewal_date: date | None = None
    value: float | None = None

    @field_validator("title", "party_a", "party_b", "status")
    @classmethod
    def required_fields_not_null(cls, value):
        # Omit a field to leave it unchanged; only optional fields can be cleared with null
        if value is None:
            raise ValueError("This field can't be empty")
        return value


class ContractResponse(BaseModel):
    id: int
    title: str
    description: str | None
    party_a: str
    party_b: str
    status: ContractStatus
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