# Data Seeding Guide

This document explains how to seed the TemplumIS database with data from the Excel file.

## Overview

The data seeding script (`backend/seed_data.py`) imports data from `data/templumis_university.xlsx` into the PostgreSQL database. This provides real student data for testing and development.

## What Gets Seeded

The script imports the following data:

1. **Institutions** - Templum University
2. **Programs** - Academic programs from the Students sheet
3. **Cohorts** - Student cohorts/intake years
4. **Students** - Student records with demographics, enrollment, and academic data
5. **Withdrawals** - Records for withdrawn students
6. **Milestones** - Enrollment and graduation milestones
7. **Retention Metrics** - Calculated cohort retention statistics

## Running the Seeding Script

### Method 1: Using Docker (Recommended)

```bash
# From the project root
docker exec templumis-backend python seed_data.py
```

### Method 2: Locally (if running backend outside Docker)

```bash
cd backend
python seed_data.py
```

## Data Source

The script reads from: `data/templumis_university.xlsx`

This Excel file contains sheets for:
- **Students** - Student demographic and academic information
- **Attendance** - Student attendance records
- **Fee Records** - Financial records
- **Payments** - Payment history
- **Scholarships** - Scholarship information
- **Scholarship Apps** - Scholarship applications

## Dual Data Access

The system supports **two modes** of data access:

### 1. Database Mode (After Seeding)
- Data is stored in PostgreSQL
- Faster queries and better performance
- Supports complex analytics and reporting
- Used by retention analytics endpoints

### 2. Excel Mode (Fallback)
- Data is read directly from Excel file
- Used by `/api/sis-lms/*` endpoints
- Useful when database is unavailable
- No database setup required

## API Endpoints

After seeding, you can use both:

**Database-backed endpoints:**
- `/api/students/*` - Student management (uses database)
- `/api/retention/*` - Retention analytics (uses database)

**Excel-backed endpoints:**
- `/api/sis-lms/students` - Student list (uses Excel)
- `/api/sis-lms/stats` - Statistics (uses Excel)

## Verification

After seeding, verify the data:

```bash
# Check student count
docker exec templumis-db psql -U templumis -d templumis_db -c "SELECT COUNT(*) FROM students;"

# Check programs
docker exec templumis-db psql -U templumis -d templumis_db -c "SELECT name FROM programs;"

# Check retention metrics
docker exec templumis-db psql -U templumis -d templumis_db -c "SELECT COUNT(*) FROM cohort_retention_metrics;"
```

## Re-seeding

The script uses `ON CONFLICT` clauses, so it's safe to run multiple times:
- Existing institutions are skipped
- Programs and cohorts are not duplicated
- Students are updated if they already exist

To completely reset and re-seed:

```bash
# Clear all data (WARNING: This deletes everything!)
docker exec templumis-db psql -U templumis -d templumis_db -c "TRUNCATE students, programs, cohorts, student_milestones, student_withdrawals, cohort_retention_metrics CASCADE;"

# Re-run seeding
docker exec templumis-backend python seed_data.py
```

## Troubleshooting

### Excel file not found
Ensure `data/templumis_university.xlsx` exists in the backend directory.

### Database connection error
Check that the database container is running:
```bash
docker ps | grep templumis-db
```

### Permission errors
Ensure the backend container has access to the data directory.

## Next Steps

After seeding:
1. Visit `http://localhost/staff/retention` to see the retention dashboard
2. Check `/api/students` endpoints for student data
3. Explore `/api/retention/*` endpoints for analytics

The retention dashboard will now display real data from your seeded database! 🎉
