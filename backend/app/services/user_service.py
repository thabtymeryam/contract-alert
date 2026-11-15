from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import PasswordChange, UserCreate, UserUpdate
from app.core.security import hash_password, verify_password

def get_all_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at).all()

def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def create_user(db: Session, data: UserCreate) -> User:
    email = data.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    hashed_password = hash_password(data.password)
    user = User(email=email, hashed_password=hashed_password, role=data.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, data: UserUpdate, current_user: User) -> User:
    user = get_user_by_id(db, user_id)
    changes = data.model_dump(exclude_unset=True, exclude_none=True)

    # An admin can't lock themselves out; this also guarantees at least one active admin remains
    if user.id == current_user.id and changes:
        raise HTTPException(status_code=400, detail="You can't change your own role or status")

    for field, value in changes.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

def change_password(db: Session, user: User, data: PasswordChange) -> None:
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.commit()

def delete_user(db: Session, user_id: int, current_user: User) -> None:
    user = get_user_by_id(db, user_id)
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't delete your own account")
    db.delete(user)
    db.commit()
