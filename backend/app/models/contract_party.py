import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PartyType(str, enum.Enum):
    COMPANY = "COMPANY"
    INDIVIDUAL = "INDIVIDUAL"
    GOVERNMENT = "GOVERNMENT"
    OTHER = "OTHER"


class PartyRole(str, enum.Enum):
    CLIENT = "CLIENT"
    SERVICE_PROVIDER = "SERVICE_PROVIDER"
    SUPPLIER = "SUPPLIER"
    CUSTOMER = "CUSTOMER"
    PARTNER = "PARTNER"
    EMPLOYER = "EMPLOYER"
    EMPLOYEE = "EMPLOYEE"
    LANDLORD = "LANDLORD"
    TENANT = "TENANT"
    OTHER = "OTHER"


class ContractParty(Base):
    __tablename__ = "contract_parties"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(PartyType), nullable=True)
    role = Column(Enum(PartyRole), nullable=True)
    registration_number = Column(String(255), nullable=True)
    address = Column(String, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    contract = relationship("Contract", back_populates="parties")
