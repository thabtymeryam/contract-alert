from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

from app.models.notification import NotificationKind


class NotificationResponse(BaseModel):
    id: int
    kind: NotificationKind
    severity: str | None
    contract_id: int | None
    contract_title: str | None
    params: dict[str, Any]
    link: str | None
    read_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCount(BaseModel):
    count: int


class AlertItem(BaseModel):
    """An upcoming key date or an open obligation, with its deadline severity."""
    kind: Literal["event", "obligation"]
    id: int
    contract_id: int
    contract_title: str
    type: str | None
    title: str | None
    description: str | None
    date: date
    days_left: int
    severity: Literal["critical", "warning", "upcoming"]


class AlertRunResult(BaseModel):
    sent: int
    notified: int
