import enum

from sqlalchemy import Column, Date, DateTime, Enum, Float, Integer, String, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class ExtractionStatus(str, enum.Enum):
    NONE = "none"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    party_a = Column(String(255), nullable=False)
    party_b = Column(String(255), nullable=False)
    status = Column(Enum(ContractStatus), default=ContractStatus.DRAFT)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    renewal_date = Column(Date, nullable=True)
    value = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  
    file_path = Column(String, nullable=True) 
    # AI extraction runs in the background; the UI polls these fields
    extraction_status = Column(
        Enum(ExtractionStatus), nullable=False, default=ExtractionStatus.NONE, server_default=ExtractionStatus.NONE.name
    )
    extracted_at = Column(DateTime, nullable=True)
    extraction_error = Column(Text, nullable=True)

    clauses = relationship(
        "Clause",
        back_populates="contract",
        cascade="all, delete-orphan"
)

    events = relationship(
        "ContractEvent",
        back_populates="contract",
        cascade="all, delete-orphan"
)

    parties = relationship(
        "ContractParty",
        back_populates="contract",
        cascade="all, delete-orphan"
)
