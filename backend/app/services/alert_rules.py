from typing import Optional

from app.models.contract_event import EventType

# Days before an event when a reminder goes out
ALERT_RULES: dict[EventType, list[int]] = {
    EventType.EXPIRATION: [90, 60, 30, 7, 1],
    EventType.RENEWAL: [90, 60, 30, 7, 1],
    EventType.RENEWAL_NOTICE_DEADLINE: [30, 14, 7, 1],
    EventType.TERMINATION_NOTICE: [30, 14, 7, 1],
    EventType.PAYMENT: [7, 3, 1],
    EventType.DELIVERY: [7, 1],
    EventType.MILESTONE: [7, 1],
}

MAX_OFFSET = max(max(v) for v in ALERT_RULES.values())

# Severity tiers from the product spec: critical < 7 days, warning 7-30, upcoming 30-90
UPCOMING_WINDOW_DAYS = 90


def threshold_for(event_type: EventType, days_left: int) -> Optional[int]:
    reached = [o for o in ALERT_RULES.get(event_type, []) if days_left <= o]
    return min(reached) if reached else None


def severity_for(days_left: int) -> Optional[str]:
    """Spec tier for a deadline; anything already past due is critical."""
    if days_left < 7:
        return "critical"
    if days_left <= 30:
        return "warning"
    if days_left <= UPCOMING_WINDOW_DAYS:
        return "upcoming"
    return None
