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
from app.models import User, UserRole, Institution
from app.account_category import sync_account_category


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


def create_staff_user(email: str, full_name: str, password: str, role: str, institution_id: int | None = None):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Error: User with email '{email}' already exists.")
            sys.exit(1)

        try:
            user_role = UserRole(role)
        except ValueError:
            print(f"Error: Invalid role '{role}'. Use one of: {[r.value for r in UserRole]}")
            sys.exit(1)

        if user_role == UserRole.GLOBAL_ADMIN:
            institution_id = None
        elif institution_id is None:
            inst = db.query(Institution).first()
            if not inst:
                print("Error: No institution in database. Pass --institution-id.")
                sys.exit(1)
            institution_id = inst.id

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=user_role,
            institution_id=institution_id,
            is_active=True,
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        sync_account_category(user, db)
        print("Staff user created successfully:")
        print(f"  ID:    {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Name:  {user.full_name}")
        print(f"  Role:  {user.role.value}")
        print(f"  Account category: {user.account_category}")
    except Exception as e:
        db.rollback()
        print(f"Error creating staff user: {e}")
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

    staff_parser = subparsers.add_parser("create-staff-user", help="Create a staff portal user (e.g. Financial Aid Officer)")
    staff_parser.add_argument("--email", required=True)
    staff_parser.add_argument("--name", required=True)
    staff_parser.add_argument("--password", required=True)
    staff_parser.add_argument(
        "--role",
        required=True,
        help="UserRole value, e.g. scholarship_office for Financial Aid Officer",
    )
    staff_parser.add_argument("--institution-id", type=int, default=None)

    subparsers.add_parser(
        "migrate",
        help="Stamp existing DBs if needed, then alembic upgrade head",
    )

    args = parser.parse_args()

    if args.command == "create-global-admin":
        create_global_admin(args.email, args.name, args.password)
    elif args.command == "create-staff-user":
        create_staff_user(args.email, args.name, args.password, args.role, args.institution_id)
    elif args.command == "migrate":
        from migrate import run_pending

        run_pending()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
