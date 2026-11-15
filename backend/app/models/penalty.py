from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Penalty(Base):
    __tablename__ = "penalties"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    clause_id = Column(Integer, ForeignKey("clauses.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(100), nullable=True)
    amount = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    trigger = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    source_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
