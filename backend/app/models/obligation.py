import enum
from datetime import date

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ObligationStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    # Not stored: a PENDING obligation past its due date is reported as OVERDUE (see current_status)
    OVERDUE = "OVERDUE"


class Obligation(Base):
    __tablename__ = "obligations"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("clauses.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    obligation_type = Column(String(100), nullable=True)
    responsible_party_id = Column(Integer, ForeignKey("contract_parties.id", ondelete="SET NULL"), nullable=True)
    responsible_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    due_date = Column(Date, nullable=True)
    frequency = Column(String(50), nullable=True)
    source_text = Column(Text, nullable=True)
    status = Column(Enum(ObligationStatus), default=ObligationStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    contract = relationship("Contract")

    @property
    def current_status(self) -> ObligationStatus:
        """Status as of today, so "overdue" never goes stale."""
        if self.status == ObligationStatus.COMPLETED:
            return ObligationStatus.COMPLETED
        if self.due_date and self.due_date < date.today():
            return ObligationStatus.OVERDUE
        return ObligationStatus.PENDING

    @property
    def contract_title(self) -> str | None:
        return self.contract.title if self.contract else None
