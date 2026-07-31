from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Student, Course, Institution

router = APIRouter(prefix="/api/ranking-metrics", tags=["Ranking Metrics"])


def check_staff_access(current_user: User):
    """Check if user is staff"""
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Only staff can access ranking metrics")


@router.get("/institutional-overview/{institution_id}")
async def get_institutional_overview(
    institution_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get institutional overview metrics for rankings dashboard"""
    check_staff_access(current_user)
    
    # Verify user has access to this institution
    if current_user.institution_id != institution_id:
        raise HTTPException(status_code=403, detail="Cannot access metrics for different institution")
    
    # Get institution details
    institution = db.query(Institution).filter(Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    # Total students
    total_students = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"])
    ).scalar() or 0
    
    # Undergraduate vs Postgraduate breakdown
    ug_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.program_level.in_(["undergraduate", "bachelor"])
    ).scalar() or 0
    
    pg_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.program_level.in_(["postgraduate", "masters", "phd", "doctorate"])
    ).scalar() or 0
    
    # International students (non-Kenyan nationality)
    international_students = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.nationality != "Kenyan",
        Student.nationality.isnot(None)
    ).scalar() or 0
    
    international_percentage = (international_students / total_students * 100) if total_students > 0 else 0
    
    # Active nationalities
    active_nationalities = db.query(func.count(distinct(Student.nationality))).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.nationality.isnot(None)
    ).scalar() or 0
    
    # Female students
    female_students = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.gender == "Female"
    ).scalar() or 0
    
    female_percentage = (female_students / total_students * 100) if total_students > 0 else 0
    
    # Average GPA
    avg_gpa_result = db.query(func.avg(Student.gpa)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.gpa.isnot(None)
    ).scalar()
    
    avg_gpa = float(avg_gpa_result) if avg_gpa_result else 0.0
    
    # Faculty count (instructors)
    faculty_count = db.query(func.count(User.id)).filter(
        User.institution_id == institution_id,
        User.account_category == "staff",
        User.role == "instructor"
    ).scalar() or 0
    
    # Number of schools/departments (distinct from courses)
    schools_count = db.query(func.count(distinct(Course.department))).filter(
        Course.institution_id == institution_id,
        Course.department.isnot(None)
    ).scalar() or 0
    
    # Student:Faculty ratio
    student_faculty_ratio = f"{(total_students / faculty_count):.1f}:1" if faculty_count > 0 else "N/A"
    
    # Research students (postgraduate research)
    research_students = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status.in_(["active", "probation", "academic_warning"]),
        Student.program_level.in_(["masters", "phd", "doctorate"])
    ).scalar() or 0
    
    # Graduated students count
    graduated_count = db.query(func.count(Student.id)).filter(
        Student.institution_id == institution_id,
        Student.status == "graduated"
    ).scalar() or 0
    
    return {
        "institution_name": institution.name,
        "academic_year": "2023/24",
        "semester": "Sem 1",
        "total_students": total_students,
        "ug_count": ug_count,
        "pg_count": pg_count,
        "international_students": international_students,
        "international_percentage": round(international_percentage, 1),
        "active_nationalities": active_nationalities,
        "female_students": female_students,
        "female_percentage": round(female_percentage, 1),
        "avg_gpa": round(avg_gpa, 2),
        "gpa_scale": 4.0,
        "faculty_count": faculty_count,
        "schools_count": schools_count,
        "student_faculty_ratio": student_faculty_ratio,
        "research_students": research_students,
        "graduated_count": graduated_count,
        "data_source": "LMS/SIS/FMS"
    }
