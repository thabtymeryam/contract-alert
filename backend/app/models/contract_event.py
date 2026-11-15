import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EventType(str, enum.Enum):
    START = "START"
    EXPIRATION = "EXPIRATION"
    RENEWAL = "RENEWAL"
    RENEWAL_NOTICE_DEADLINE = "RENEWAL_NOTICE_DEADLINE"
    PAYMENT = "PAYMENT"
    TERMINATION_NOTICE = "TERMINATION_NOTICE"
    DELIVERY = "DELIVERY"
    MILESTONE = "MILESTONE"
    OTHER = "OTHER"


class ContractEvent(Base):
    __tablename__ = "contract_events"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("clauses.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(Enum(EventType), nullable=False)
    date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    source_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    contract = relationship("Contract", back_populates="events")
    clause = relationship("Clause", back_populates="events")
