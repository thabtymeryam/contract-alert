"""
Create the first admin, or promote an existing user to admin.

    docker compose exec backend python scripts/create_admin.py admin@company.tn

Prompts for a password when the user doesn't exist yet. For an existing user,
the role is set to admin and the account is re-activated; pass --reset-password
to also set a new password.
"""

import argparse
import getpass
import sys

from app.core.security import hash_password
from app.database import SessionLocal
import app.models  # noqa: F401  (registers all models so relationships resolve)
from app.models.user import User, UserRole


def prompt_password() -> str:
    password = getpass.getpass("Password (min 8 characters): ")
    if len(password) < 8:
        sys.exit("Password must be at least 8 characters.")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("Passwords do not match.")
    return password


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("email")
    parser.add_argument("--reset-password", action="store_true", help="set a new password for an existing user")
    args = parser.parse_args()
    email = args.email.strip().lower()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = UserRole.ADMIN
            user.is_active = True
            if args.reset_password:
                user.hashed_password = hash_password(prompt_password())
            action = "Promoted existing user"
        else:
            user = User(email=email, hashed_password=hash_password(prompt_password()), role=UserRole.ADMIN)
            db.add(user)
            action = "Created admin"
        db.commit()
        print(f"{action}: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
