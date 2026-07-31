"""
Migration: Add enrollment module tables (programs, cohorts, students)
Created: 2026-04-09
"""

import os
import sys
from sqlalchemy import create_engine, text

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

def run_migration():
    """Add programs, cohorts, and students tables"""
    
    engine = create_engine(settings.database_url)
    
    with engine.connect() as conn:
        print("Starting migration: Add enrollment tables...")
        
        # Create programs table
        print("Creating programs table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS programs (
                id SERIAL PRIMARY KEY,
                institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                degree_level VARCHAR(50),
                expected_duration_years INTEGER,
                minimum_gpa NUMERIC(3, 2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating index on programs.institution_id...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_programs_institution_id 
            ON programs(institution_id);
        """))
        
        # Create cohorts table
        print("Creating cohorts table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cohorts (
                id SERIAL PRIMARY KEY,
                institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                start_year INTEGER NOT NULL,
                start_semester VARCHAR(50),
                program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating index on cohorts.institution_id...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_cohorts_institution_id 
            ON cohorts(institution_id);
        """))
        
        # Create students table
        print("Creating students table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
                student_number VARCHAR(100) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
                cohort_id INTEGER REFERENCES cohorts(id) ON DELETE SET NULL,
                status VARCHAR(50) DEFAULT 'active',
                compliance_status VARCHAR(50) DEFAULT 'green',
                gpa NUMERIC(3, 2),
                credits_completed INTEGER DEFAULT 0,
                enrollment_date DATE NOT NULL,
                expected_graduation DATE,
                address TEXT,
                date_of_birth DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating indexes on students table...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_students_institution_id 
            ON students(institution_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_students_student_number 
            ON students(student_number);
        """))
        
        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_students_institution_student_number 
            ON students(institution_id, student_number);
        """))
        
        conn.commit()
        print("✓ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
