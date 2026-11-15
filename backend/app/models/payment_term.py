import enum

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class PaymentType(str, enum.Enum):
    FIXED = "FIXED"
    INSTALLMENT = "INSTALLMENT"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    MILESTONE = "MILESTONE"
    ADVANCE = "ADVANCE"
    OTHER = "OTHER"


class PaymentTerm(Base):
    __tablename__ = "payment_terms"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("clauses.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    payment_type = Column(Enum(PaymentType), nullable=True)
    due_date = Column(Date, nullable=True)
    due_days = Column(Integer, nullable=True)
    frequency = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    source_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
