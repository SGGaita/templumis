"""
Data Seeding Script for TemplumIS
Imports data from templumis_university.xlsx into PostgreSQL database
"""
import openpyxl
from pathlib import Path
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# Add app directory to path to import config
sys.path.insert(0, str(Path(__file__).parent / "app"))
from config import settings

# Use the same database connection as the backend
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)

EXCEL_FILE_PATH = Path(__file__).parent / "data" / "templumis_university.xlsx"

def normalize_key(h):
    """Normalize Excel header to snake_case key"""
    if h is None:
        return None
    return str(h).strip().replace(" ", "_").replace(".", "").lower()

def sheet_to_dict_list(sheet):
    """Convert Excel sheet to list of dictionaries with normalized keys"""
    raw_headers = [cell.value for cell in sheet[1]]
    headers = [normalize_key(h) for h in raw_headers]
    data = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if row[0] is not None:
            row_dict = {}
            for header, value in zip(headers, row):
                if header:
                    if isinstance(value, datetime):
                        row_dict[header] = value.date() if hasattr(value, 'date') else value
                    else:
                        row_dict[header] = value
            data.append(row_dict)
    return data

def parse_date(date_val):
    """Parse date from various formats"""
    if date_val is None:
        return None
    if isinstance(date_val, (date, datetime)):
        return date_val if isinstance(date_val, date) else date_val.date()
    if isinstance(date_val, str):
        try:
            return datetime.strptime(date_val, "%Y-%m-%d").date()
        except:
            try:
                return datetime.strptime(date_val, "%d/%m/%Y").date()
            except:
                return None
    return None

def seed_institutions(cursor):
    """Seed institutions table"""
    print("Seeding institutions...")
    
    # Check if institution exists
    cursor.execute("SELECT COUNT(*) FROM institutions WHERE id = 1")
    if cursor.fetchone()[0] > 0:
        print("  Institution already exists, skipping...")
        return
    
    cursor.execute("""
        INSERT INTO institutions (id, name, code, domain, created_at)
        VALUES (1, 'Templum University', 'TEMPLUM', 'templum.edu', CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
    """)
    print("  ✓ Institution created")

def seed_programs(cursor, wb):
    """Seed programs from Excel data - combining degree and major"""
    print("Seeding programs...")
    
    students_sheet = wb["Students"]
    students = sheet_to_dict_list(students_sheet)
    
    # Extract unique programs (degree + major combinations)
    programs = {}
    for student in students:
        degree = student.get("program", "BSc")  # e.g., "BSc", "BA"
        major = student.get("major", "General")  # e.g., "Computer Science", "Law"
        department = student.get("department", "General")  # e.g., "School of Computing"
        
        # Create full program name: "BSc Computer Science"
        program_name = f"{degree} {major}".strip()
        
        if program_name not in programs:
            programs[program_name] = {
                'name': program_name,
                'degree': degree,
                'major': major,
                'department': department
            }
    
    for prog_name, prog_data in programs.items():
        cursor.execute("""
            INSERT INTO programs (institution_id, name, department, degree_level, expected_duration_semesters, created_at)
            VALUES (1, %s, %s, 'Bachelor', 8, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
        """, (prog_data['name'], prog_data['department']))
    
    print(f"  ✓ {len(programs)} programs created")

def seed_cohorts(cursor, wb):
    """Seed cohorts from Excel data based on enrollment year"""
    print("Seeding cohorts...")
    
    students_sheet = wb["Students"]
    students = sheet_to_dict_list(students_sheet)
    
    # Extract unique enrollment years to create cohorts
    cohorts = {}
    for student in students:
        enrollment_date = parse_date(student.get("enrollment_date"))
        degree = student.get("program", "BSc")
        major = student.get("major", "General")
        program_name = f"{degree} {major}".strip()
        
        if enrollment_date:
            year = enrollment_date.year
            cohort_key = (year, program_name)
            if cohort_key not in cohorts:
                cohorts[cohort_key] = {
                    'name': f"{year} {program_name} Intake",
                    'year': year,
                    'program': program_name
                }
    
    for cohort_data in cohorts.values():
        cursor.execute("""
            INSERT INTO cohorts (institution_id, name, start_year, start_semester, created_at)
            VALUES (1, %s, %s, 'September', CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
        """, (cohort_data['name'], cohort_data['year']))
    
    print(f"  ✓ {len(cohorts)} cohorts created")

def seed_students(cursor, wb):
    """Seed students from Excel data"""
    print("Seeding students...")
    
    students_sheet = wb["Students"]
    students = sheet_to_dict_list(students_sheet)
    
    # Get program and cohort mappings
    programs_map = {}
    cursor.execute("SELECT id, name FROM programs WHERE institution_id = 1")
    for row in cursor.fetchall():
        programs_map[row[1]] = row[0]
    
    cohorts_map = {}
    cursor.execute("SELECT id, name FROM cohorts WHERE institution_id = 1")
    for row in cursor.fetchall():
        cohorts_map[row[1]] = row[0]
    
    count = 0
    for student in students:
        student_id = student.get("student_id")
        if not student_id:
            continue
        
        # Build full program name
        degree = student.get("program", "BSc")
        major = student.get("major", "General")
        program_name = f"{degree} {major}".strip()
        program_id = programs_map.get(program_name)
        
        # Find cohort based on enrollment year and full program name
        enrollment_date = parse_date(student.get("enrollment_date"))
        cohort_id = None
        if enrollment_date:
            cohort_name = f"{enrollment_date.year} {program_name} Intake"
            cohort_id = cohorts_map.get(cohort_name)
        
        # Parse dates
        enrollment_date = parse_date(student.get("enrollment_date")) or date(2020, 9, 1)
        expected_grad = parse_date(student.get("expected_graduation"))
        dob = parse_date(student.get("date_of_birth"))
        
        # Determine status
        status_map = {
            'Active': 'active',
            'Graduated': 'graduated',
            'On Leave': 'on_leave',
            'Withdrawn': 'withdrawn',
            'Suspended': 'suspended'
        }
        status = status_map.get(student.get("status"), 'active')
        
        # Set actual_graduation if graduated
        actual_grad = None
        if status == 'graduated':
            actual_grad = expected_grad or date(2024, 6, 30)
        
        try:
            cursor.execute("""
                INSERT INTO students (
                    institution_id, student_number, full_name, email, phone,
                    program_id, cohort_id, status, enrollment_date, expected_graduation,
                    actual_graduation, gpa, credits_completed, credits_required,
                    compliance, date_of_birth, created_at
                )
                VALUES (
                    1, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, 120,
                    'green', %s, CURRENT_TIMESTAMP
                )
                ON CONFLICT (institution_id, student_number) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    email = EXCLUDED.email,
                    status = EXCLUDED.status,
                    gpa = EXCLUDED.gpa,
                    actual_graduation = EXCLUDED.actual_graduation
            """, (
                student_id,
                student.get("full_name", f"Student {student_id}"),
                student.get("email", f"{student_id}@templum.edu"),
                student.get("phone"),
                program_id,
                cohort_id,
                status,
                enrollment_date,
                expected_grad,
                actual_grad,
                float(student.get("gpa", 0)) if student.get("gpa") else None,
                int(student.get("credit_hours_earned", 0)) if student.get("credit_hours_earned") else 0,
                dob
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠ Error inserting student {student_id}: {e}")
    
    print(f"  ✓ {count} students created/updated")

def seed_withdrawals(cursor, wb):
    """Seed student withdrawals"""
    print("Seeding withdrawals...")
    
    students_sheet = wb["Students"]
    students = sheet_to_dict_list(students_sheet)
    
    # Get student ID mappings
    students_map = {}
    cursor.execute("SELECT id, student_number FROM students WHERE institution_id = 1")
    for row in cursor.fetchall():
        students_map[row[1]] = row[0]
    
    count = 0
    for student in students:
        if student.get("status") == "Withdrawn":
            student_number = student.get("student_id")
            student_db_id = students_map.get(student_number)
            
            if student_db_id:
                withdrawal_date = parse_date(student.get("withdrawal_date")) or date(2023, 12, 15)
                
                # Determine withdrawal reason based on data
                reasons = ['financial_difficulties', 'academic_performance', 'personal_reasons', 
                          'transfer', 'health_issues', 'family_obligations']
                reason = reasons[hash(student_number) % len(reasons)]
                
                try:
                    cursor.execute("""
                        INSERT INTO student_withdrawals (
                            student_id, withdrawal_date, withdrawal_reason,
                            gpa_at_withdrawal, credits_at_withdrawal, created_at
                        )
                        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT DO NOTHING
                    """, (
                        student_db_id,
                        withdrawal_date,
                        reason,
                        float(student.get("gpa", 0)) if student.get("gpa") else None,
                        int(student.get("credits_completed", 0)) if student.get("credits_completed") else 0
                    ))
                    count += 1
                except Exception as e:
                    print(f"  ⚠ Error inserting withdrawal for {student_number}: {e}")
    
    print(f"  ✓ {count} withdrawals created")

def seed_milestones(cursor):
    """Seed student milestones for graduated students"""
    print("Seeding milestones...")
    
    # Get graduated students
    cursor.execute("""
        SELECT id, enrollment_date, actual_graduation 
        FROM students 
        WHERE status = 'graduated' AND actual_graduation IS NOT NULL
    """)
    
    count = 0
    for row in cursor.fetchall():
        student_id, enrollment_date, graduation_date = row
        
        # Add enrollment milestone
        cursor.execute("""
            INSERT INTO student_milestones (student_id, milestone_type, milestone_date, created_at)
            VALUES (%s, 'enrolled', %s, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
        """, (student_id, enrollment_date))
        
        # Add graduation milestone
        cursor.execute("""
            INSERT INTO student_milestones (student_id, milestone_type, milestone_date, created_at)
            VALUES (%s, 'graduated', %s, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING
        """, (student_id, graduation_date))
        
        count += 2
    
    print(f"  ✓ {count} milestones created")

def calculate_retention_metrics(cursor):
    """Calculate and store cohort retention metrics"""
    print("Calculating retention metrics...")
    
    # Get cohorts
    cursor.execute("SELECT id, name, start_year FROM cohorts WHERE institution_id = 1")
    cohorts = cursor.fetchall()
    
    count = 0
    snapshot_date = date.today()
    
    for cohort_id, cohort_name, start_year in cohorts:
        # Get total students in cohort
        cursor.execute("""
            SELECT COUNT(*) FROM students 
            WHERE cohort_id = %s
        """, (cohort_id,))
        initial_cohort_size = cursor.fetchone()[0]
        
        if initial_cohort_size == 0:
            continue
        
        # Get current enrolled (active students)
        cursor.execute("""
            SELECT COUNT(*) FROM students 
            WHERE cohort_id = %s AND status = 'active'
        """, (cohort_id,))
        current_enrolled = cursor.fetchone()[0]
        
        # Get graduated students
        cursor.execute("""
            SELECT COUNT(*) FROM students 
            WHERE cohort_id = %s AND status = 'graduated'
        """, (cohort_id,))
        graduated = cursor.fetchone()[0]
        
        # Get withdrawn students
        cursor.execute("""
            SELECT COUNT(*) FROM students 
            WHERE cohort_id = %s AND status = 'withdrawn'
        """, (cohort_id,))
        withdrawn = cursor.fetchone()[0]
        
        # Get students on leave
        cursor.execute("""
            SELECT COUNT(*) FROM students 
            WHERE cohort_id = %s AND status = 'on_leave'
        """, (cohort_id,))
        on_leave = cursor.fetchone()[0]
        
        # Calculate retention rates
        retention_rate = ((current_enrolled + graduated) / initial_cohort_size * 100) if initial_cohort_size > 0 else 0
        graduation_rate = (graduated / initial_cohort_size * 100) if initial_cohort_size > 0 else 0
        
        cursor.execute("""
            INSERT INTO cohort_retention_metrics (
                institution_id, cohort_id, snapshot_date, initial_cohort_size,
                current_enrolled, graduated, withdrawn, on_leave,
                retention_rate_1yr, graduation_rate_4yr, created_at
            )
            VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (cohort_id, program_id, snapshot_date) DO UPDATE SET
                current_enrolled = EXCLUDED.current_enrolled,
                graduated = EXCLUDED.graduated,
                withdrawn = EXCLUDED.withdrawn,
                on_leave = EXCLUDED.on_leave,
                retention_rate_1yr = EXCLUDED.retention_rate_1yr,
                graduation_rate_4yr = EXCLUDED.graduation_rate_4yr
        """, (cohort_id, snapshot_date, initial_cohort_size, current_enrolled, 
              graduated, withdrawn, on_leave, retention_rate, graduation_rate))
        count += 1
    
    print(f"  ✓ {count} retention metrics calculated")

def main():
    """Main seeding function"""
    print("=" * 60)
    print("TemplumIS Data Seeding Script")
    print("=" * 60)
    
    if not EXCEL_FILE_PATH.exists():
        print(f"❌ Excel file not found: {EXCEL_FILE_PATH}")
        return
    
    print(f"📊 Loading data from: {EXCEL_FILE_PATH}")
    wb = openpyxl.load_workbook(EXCEL_FILE_PATH, read_only=True, data_only=True)
    
    db = engine.raw_connection()
    cursor = db.cursor()
    
    try:
        seed_institutions(cursor)
        seed_programs(cursor, wb)
        seed_cohorts(cursor, wb)
        seed_students(cursor, wb)
        seed_withdrawals(cursor, wb)
        seed_milestones(cursor)
        calculate_retention_metrics(cursor)
        
        # Commit all changes
        db.commit()
        
        print("=" * 60)
        print("✅ Data seeding completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        cursor.close()
        db.close()
        wb.close()

if __name__ == "__main__":
    main()
