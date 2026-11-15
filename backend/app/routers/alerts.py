from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.database import get_db
from app.models.user import User
from app.schemas.notification import AlertItem, AlertRunResult
from app.services.alert_service import process_alerts, upcoming_alerts

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/upcoming", response_model=list[AlertItem])
def list_upcoming_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return upcoming_alerts(db, current_user)


@router.post("/run", response_model=AlertRunResult, dependencies=[Depends(require_admin)])
def run_alerts_now(db: Session = Depends(get_db)):
    return process_alerts(db)
