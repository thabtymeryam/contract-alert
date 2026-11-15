from typing import Optional

from pydantic import BaseModel

from app.models.contract_party import PartyRole, PartyType


class ContractPartyCreate(BaseModel):
    contract_id: int
    name: str
    type: PartyType
    role: PartyRole
    registration_number: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class ContractPartyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[PartyType] = None
    role: Optional[PartyRole] = None
    registration_number: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class ContractPartyResponse(BaseModel):
    id: int
    contract_id: int
    name: str
    type: Optional[str] = None
    role: Optional[str] = None
    registration_number: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True