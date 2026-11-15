from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(
        Integer,
        ForeignKey("contract_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    days_before = Column(Integer, nullable=False)  
    recipient = Column(String(255), nullable=False)
    sent_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "days_before", name="uq_alert_event_threshold"),
    )