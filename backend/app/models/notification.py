import enum

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, Index, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class NotificationKind(str, enum.Enum):
    DEADLINE = "deadline"
    OBLIGATION_ASSIGNED = "obligation_assigned"
    EXTRACTION_DONE = "extraction_done"
    EXTRACTION_FAILED = "extraction_failed"


class Notification(Base):
    """
    An in-app notification. Text is NOT stored: the UI renders it from `kind`
    and `params` in the viewer's language.
    """

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind = Column(Enum(NotificationKind), nullable=False)
    severity = Column(String(20), nullable=True)  # critical / warning / upcoming, for deadlines
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=True)
    contract_title = Column(String(255), nullable=True)  # snapshot, so the text still reads well if renamed
    params = Column(JSON, nullable=False, default=dict)
    link = Column(String(500), nullable=True)
    # Stops the same reminder being created twice (e.g. "deadline:<event>:<threshold>:<user>")
    dedupe_key = Column(String(255), nullable=True, unique=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (Index("ix_notifications_user_unread", "user_id", "read_at"),)
