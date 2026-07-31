"""
Script to reset a user's password in the database.
Usage: python reset_user_password.py <email> <new_password>
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Database connection settings - read from environment or use defaults
import os
POSTGRES_USER = os.getenv("POSTGRES_USER", "templumis")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Waxmangme86")
POSTGRES_DB = os.getenv("POSTGRES_DB", "templumis_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Password hashing context (same as used in the app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password(email: str, new_password: str):
    """Reset a user's password."""
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if user exists
        query = text("SELECT id, email, full_name, role FROM users WHERE email = :email")
        result = session.execute(query, {"email": email})
        user = result.fetchone()
        
        if not user:
            print(f"❌ User not found: {email}")
            return
        
        print(f"\n✓ Found user:")
        print(f"  ID: {user[0]}")
        print(f"  Email: {user[1]}")
        print(f"  Name: {user[2]}")
        print(f"  Role: {user[3]}")
        print()
        
        # Hash the new password
        hashed_password = pwd_context.hash(new_password)
        
        # Update the password
        update_query = text("""
            UPDATE users 
            SET hashed_password = :hashed_password 
            WHERE email = :email
        """)
        
        session.execute(update_query, {
            "hashed_password": hashed_password,
            "email": email
        })
        session.commit()
        
        print(f"✓ Password updated successfully for {email}")
        print(f"  New password: {new_password}")
        print()
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        session.close()

def list_users():
    """List all users in the system."""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        query = text("SELECT id, email, full_name, role FROM users ORDER BY id")
        result = session.execute(query)
        users = result.fetchall()
        
        if not users:
            print("No users found in the database.")
            return
        
        print("\n" + "=" * 80)
        print("Users in the system:")
        print("=" * 80)
        for user in users:
            print(f"ID: {user[0]:3d} | Email: {user[1]:35s} | Name: {user[2]:25s} | Role: {user[3]}")
        print("=" * 80 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    if len(sys.argv) == 1 or sys.argv[1] == "list":
        list_users()
    elif len(sys.argv) == 3:
        email = sys.argv[1]
        new_password = sys.argv[2]
        reset_password(email, new_password)
    else:
        print("Usage:")
        print("  List all users:")
        print("    python reset_user_password.py list")
        print()
        print("  Reset password:")
        print("    python reset_user_password.py <email> <new_password>")
        print()
        print("Example:")
        print("    python reset_user_password.py financialaid@templumis.ac newpassword123")
