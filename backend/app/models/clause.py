import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ClauseType(str, enum.Enum):
    GENERAL = "GENERAL"
    SCOPE = "SCOPE"
    PAYMENT = "PAYMENT"
    PRICE = "PRICE"
    DELIVERY = "DELIVERY"
    CONFIDENTIALITY = "CONFIDENTIALITY"
    DATA_PROTECTION = "DATA_PROTECTION"
    INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY"
    LIABILITY = "LIABILITY"
    WARRANTY = "WARRANTY"
    PENALTY = "PENALTY"
    TERMINATION = "TERMINATION"
    RENEWAL = "RENEWAL"
    NOTICE = "NOTICE"
    GOVERNING_LAW = "GOVERNING_LAW"
    DISPUTE_RESOLUTION = "DISPUTE_RESOLUTION"
    FORCE_MAJEURE = "FORCE_MAJEURE"
    INSURANCE = "INSURANCE"
    AUDIT = "AUDIT"
    NON_COMPETE = "NON_COMPETE"
    NON_SOLICITATION = "NON_SOLICITATION"
    OTHER = "OTHER"


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_number = Column(String(50), nullable=True)
    title = Column(String(255), nullable=True)
    type = Column(Enum(ClauseType), default=ClauseType.OTHER)
    text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    is_important = Column(Boolean, default=False)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    contract = relationship("Contract", back_populates="clauses")
    events = relationship("ContractEvent", back_populates="clause")
