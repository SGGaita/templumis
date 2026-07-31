"""
Migration: Add email verification fields to users table

Usage:
    python migrations/add_email_verification.py
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


def run_migration():
    """Add email_verified, verification_code, and verification_code_expires columns to users table"""
    
    print("Starting migration: Adding email verification fields to users table...")
    
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('email_verified', 'verification_code', 'verification_code_expires')
            """))
            existing_columns = [row[0] for row in result]
            
            if len(existing_columns) == 3:
                print("✓ Columns already exist. Migration skipped.")
                return
            
            # Add email_verified column if it doesn't exist
            if 'email_verified' not in existing_columns:
                print("Adding email_verified column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
                """))
                conn.commit()
                print("✓ email_verified column added")
            
            # Add verification_code column if it doesn't exist
            if 'verification_code' not in existing_columns:
                print("Adding verification_code column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN verification_code VARCHAR(10)
                """))
                conn.commit()
                print("✓ verification_code column added")
            
            # Add verification_code_expires column if it doesn't exist
            if 'verification_code_expires' not in existing_columns:
                print("Adding verification_code_expires column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN verification_code_expires TIMESTAMP
                """))
                conn.commit()
                print("✓ verification_code_expires column added")
            
            # Set existing users as verified (they registered before email verification was implemented)
            print("Marking existing users as verified...")
            conn.execute(text("""
                UPDATE users 
                SET email_verified = TRUE 
                WHERE email_verified IS NULL OR email_verified = FALSE
            """))
            conn.commit()
            
            print("✓ Migration completed successfully!")
            
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            conn.rollback()
            raise


if __name__ == "__main__":
    run_migration()
