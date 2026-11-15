from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.obligation import ObligationStatus


class ObligationCreate(BaseModel):
    contract_id: int
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    obligation_type: str | None = Field(default=None, max_length=100)
    frequency: str | None = Field(default=None, max_length=50)
    due_date: date | None = None
    responsible_user_id: int | None = None


class ObligationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    obligation_type: str | None = Field(default=None, max_length=100)
    frequency: str | None = Field(default=None, max_length=50)
    due_date: date | None = None
    responsible_user_id: int | None = None
    status: ObligationStatus | None = None

    @field_validator("status")
    @classmethod
    def status_is_settable(cls, value):
        # OVERDUE follows from the due date; clients can only open or complete an obligation
        if value not in (ObligationStatus.PENDING, ObligationStatus.COMPLETED):
            raise ValueError("Status can only be PENDING or COMPLETED")
        return value

    @field_validator("title")
    @classmethod
    def title_not_null(cls, value):
        if value is None:
            raise ValueError("Title can't be empty")
        return value


class ObligationResponse(BaseModel):
    id: int
    contract_id: int
    contract_title: str | None = None
    clause_id: int | None
    title: str
    description: str | None
    obligation_type: str | None
    responsible_party_id: int | None
    responsible_user_id: int | None
    due_date: date | None
    frequency: str | None
    source_text: str | None
    # Read from the model's current_status, so it reports OVERDUE when past due
    status: ObligationStatus = Field(validation_alias="current_status")

    model_config = ConfigDict(from_attributes=True)
