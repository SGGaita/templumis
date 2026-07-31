"""
Migration: Add account_category and student_registration_number to users table

Usage:
    python migrations/add_account_fields.py
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


def run_migration():
    """Add account_category and student_registration_number columns to users table"""
    
    print("Starting migration: Adding account fields to users table...")
    
    with engine.connect() as conn:
        try:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('account_category', 'student_registration_number')
            """))
            existing_columns = [row[0] for row in result]
            
            if 'account_category' in existing_columns and 'student_registration_number' in existing_columns:
                print("✓ Columns already exist. Migration skipped.")
                return
            
            # Add account_category column if it doesn't exist
            if 'account_category' not in existing_columns:
                print("Adding account_category column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN account_category VARCHAR(50)
                """))
                conn.commit()
                print("✓ account_category column added")
            
            # Add student_registration_number column if it doesn't exist
            if 'student_registration_number' not in existing_columns:
                print("Adding student_registration_number column...")
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN student_registration_number VARCHAR(100)
                """))
                conn.commit()
                print("✓ student_registration_number column added")
            
            # Update existing student users to have account_category = 'student'
            print("Updating existing student users...")
            conn.execute(text("""
                UPDATE users 
                SET account_category = 'student' 
                WHERE role = 'student' AND account_category IS NULL
            """))
            conn.commit()
            
            # Update existing staff users to have account_category = 'staff'
            print("Updating existing staff users...")
            conn.execute(text("""
                UPDATE users 
                SET account_category = 'staff' 
                WHERE role IN ('vice_chancellor', 'registrar', 'scholarship_office', 'student_services', 'research_office') 
                AND account_category IS NULL
            """))
            conn.commit()
            
            print("✓ Migration completed successfully!")
            
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            conn.rollback()
            raise


if __name__ == "__main__":
    run_migration()
