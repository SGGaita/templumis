"""
TemplumIS CLI Management Tool

Usage:
    python manage.py create-global-admin --email admin@templumis.com --name "Global Admin" --password SecurePass123
"""

import argparse
import sys

from app.config import settings
from app.database import SessionLocal
from app.auth import hash_password
from app.models import User, UserRole


def create_global_admin(email: str, full_name: str, password: str):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Error: User with email '{email}' already exists.")
            sys.exit(1)

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role="global_admin",
            institution_id=None,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Global Admin created successfully:")
        print(f"  ID:    {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Name:  {user.full_name}")
        print(f"  Role:  {user.role.value}")
    except Exception as e:
        db.rollback()
        print(f"Error creating Global Admin: {e}")
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="TemplumIS Management CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    ga_parser = subparsers.add_parser("create-global-admin", help="Create a Global Admin account")
    ga_parser.add_argument("--email", required=True, help="Admin email address")
    ga_parser.add_argument("--name", required=True, help="Admin full name")
    ga_parser.add_argument("--password", required=True, help="Admin password")

    args = parser.parse_args()

    if args.command == "create-global-admin":
        create_global_admin(args.email, args.name, args.password)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
