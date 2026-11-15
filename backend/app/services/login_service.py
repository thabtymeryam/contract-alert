from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.login import LoginRequest
from app.core.security import verify_password, create_access_token




def login_user(db: Session, data: LoginRequest):
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Checked after the password so this doesn't reveal which emails exist
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User is inactive"
        )

    access_token = create_access_token(
    data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }
)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
