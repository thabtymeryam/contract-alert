from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.login import LoginRequest, Token
from app.services import login_service


router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/", response_model=Token)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    return login_service.login_user(db, data)