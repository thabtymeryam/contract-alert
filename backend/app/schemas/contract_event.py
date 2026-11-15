from datetime import date as dt_date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.contract_event import EventType


class ContractEventCreate(BaseModel):
    contract_id: int
    clause_id: Optional[int] = None
    type: EventType
    date: dt_date
    description: Optional[str] = None
    source_text: Optional[str] = None


class ContractEventUpdate(BaseModel):
    clause_id: Optional[int] = None
    type: Optional[EventType] = None
    date: Optional[dt_date] = None
    description: Optional[str] = None
    source_text: Optional[str] = None


class ContractEventResponse(BaseModel):
    id: int
    contract_id: int
    clause_id: Optional[int] = None
    type: EventType
    date: Optional[dt_date] = None
    description: Optional[str] = None
    source_text: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True