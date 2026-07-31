"""
Direct database script to delete ALL scholarship applications for a specific student.
This bypasses the application-level restrictions and allows deletion of any status.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection settings - read from environment variables
POSTGRES_USER = os.getenv("POSTGRES_USER", "templumis")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "changeme_secure_password")
POSTGRES_DB = os.getenv("POSTGRES_DB", "templumis")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

def delete_student_scholarships(student_number: str):
    """Delete all scholarship applications for a given student."""
    
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # First, query to see what will be deleted
        query = text("""
            SELECT id, student_number, scholarship_external_id, status, award_amount, applied_date
            FROM student_scholarship_applications
            WHERE student_number = :student_number
        """)
        
        result = session.execute(query, {"student_number": student_number})
        applications = result.fetchall()
        
        if not applications:
            print(f"No scholarship applications found for student: {student_number}")
            return
        
        print(f"\nFound {len(applications)} scholarship application(s) for student {student_number}:")
        print("-" * 100)
        for app in applications:
            print(f"ID: {app[0]}, Scholarship: {app[2]}, Status: {app[3]}, Amount: {app[4]}, Applied: {app[5]}")
        print("-" * 100)
        
        # Confirm deletion
        confirmation = input(f"\nAre you sure you want to DELETE all {len(applications)} application(s)? (yes/no): ")
        
        if confirmation.lower() != 'yes':
            print("Deletion cancelled.")
            return
        
        # Perform the deletion
        delete_query = text("""
            DELETE FROM student_scholarship_applications
            WHERE student_number = :student_number
        """)
        
        result = session.execute(delete_query, {"student_number": student_number})
        session.commit()
        
        print(f"\n✓ Successfully deleted {result.rowcount} scholarship application(s) for student {student_number}")
        print("The student can now apply for scholarships again.")
        
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        student_id = sys.argv[1]
    else:
        student_id = "TU-2023-0025"  # Default student ID
    
    print(f"Deleting scholarship applications for student: {student_id}")
    delete_student_scholarships(student_id)
