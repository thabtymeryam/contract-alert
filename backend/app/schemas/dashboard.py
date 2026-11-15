from typing import Literal

from pydantic import BaseModel

from app.schemas.notification import AlertItem
from app.schemas.obligation import ObligationResponse


class ContractCounts(BaseModel):
    total: int
    active: int
    # Draft or active contracts whose end date is within the next 30 days
    expiring_soon: int


class ObligationCounts(BaseModel):
    # "all" for admins (company-wide), "mine" for users (assigned to them)
    scope: Literal["all", "mine"]
    pending: int
    overdue: int
    mine_open: int


class AlertCounts(BaseModel):
    critical: int
    warning: int
    upcoming: int


class DashboardSummary(BaseModel):
    contracts: ContractCounts
    obligations: ObligationCounts
    alerts: AlertCounts
    upcoming: list[AlertItem]
    my_obligations: list[ObligationResponse]
