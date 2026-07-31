from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Student, Program, Cohort, AuditLog, UserRole
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/students", tags=["Students"])


# Schemas
class StudentCreate(BaseModel):
    student_number: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    program_id: int
    cohort_id: int
    enrollment_date: datetime
    gpa: Optional[float] = None
    credits_completed: Optional[int] = 0
    address: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    program_id: Optional[int] = None
    cohort_id: Optional[int] = None
    status: Optional[str] = None
    gpa: Optional[float] = None
    credits_completed: Optional[int] = None
    address: Optional[str] = None


class StudentOut(BaseModel):
    id: int
    student_number: str
    full_name: str
    email: str
    phone: Optional[str]
    program_id: int
    cohort_id: int
    status: str
    compliance_status: str
    gpa: Optional[float]
    credits_completed: int
    enrollment_date: datetime
    expected_graduation: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[StudentOut])
async def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[str] = None,
    compliance_status: Optional[str] = None,
    program_id: Optional[int] = None,
    cohort_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all students with filtering and pagination"""
    
    # Check if user has permission (staff account category)
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Not authorized to view students")
    
    query = db.query(Student).filter(Student.institution_id == current_user.institution_id)
    
    # Apply filters
    if search:
        query = query.filter(
            (Student.full_name.ilike(f"%{search}%")) |
            (Student.email.ilike(f"%{search}%")) |
            (Student.student_number.ilike(f"%{search}%"))
        )
    
    if status:
        query = query.filter(Student.status == status)
    
    if compliance_status:
        query = query.filter(Student.compliance == compliance_status)
    
    if program_id:
        query = query.filter(Student.program_id == program_id)
    
    if cohort_id:
        query = query.filter(Student.cohort_id == cohort_id)
    
    students = query.offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}", response_model=StudentOut)
async def get_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific student by ID"""
    
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student


@router.post("/", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new student"""
    
    # Check if user has permission (staff account category)
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Not authorized to create students")
    
    # Check if student number already exists
    existing = db.query(Student).filter(
        Student.student_number == data.student_number,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student number already exists")
    
    # Verify program and cohort exist and belong to institution
    program = db.query(Program).filter(
        Program.id == data.program_id,
        Program.institution_id == current_user.institution_id
    ).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    cohort = db.query(Cohort).filter(
        Cohort.id == data.cohort_id,
        Cohort.institution_id == current_user.institution_id
    ).first()
    
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    
    # Calculate expected graduation (enrollment_date + program duration)
    expected_graduation = None
    if program.expected_duration_years:
        from dateutil.relativedelta import relativedelta
        expected_graduation = data.enrollment_date + relativedelta(years=program.expected_duration_years)
    
    # Create student
    student = Student(
        institution_id=current_user.institution_id,
        student_number=data.student_number,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        program_id=data.program_id,
        cohort_id=data.cohort_id,
        enrollment_date=data.enrollment_date,
        expected_graduation=expected_graduation,
        gpa=data.gpa,
        credits_completed=data.credits_completed or 0,
        address=data.address,
        date_of_birth=data.date_of_birth,
        status="active",
        compliance="green",
    )
    
    db.add(student)
    db.flush()
    
    # Create audit log
    db.add(AuditLog(
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        action="student_created",
        entity_type="student",
        entity_id=student.id,
        details={
            "student_number": student.student_number,
            "full_name": student.full_name,
            "program_id": student.program_id,
            "cohort_id": student.cohort_id,
        },
    ))
    
    db.commit()
    db.refresh(student)
    
    return student


@router.put("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: int,
    data: StudentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a student"""
    
    # Check if user has permission (staff account category)
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Not authorized to update students")
    
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update fields
    update_data = data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(student, field, value)
    
    # Create audit log
    db.add(AuditLog(
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        action="student_updated",
        entity_type="student",
        entity_id=student.id,
        details=update_data,
    ))
    
    db.commit()
    db.refresh(student)
    
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a student"""
    
    # Check if user has permission (staff account category)
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Not authorized to delete students")
    
    student = db.query(Student).filter(
        Student.id == student_id,
        Student.institution_id == current_user.institution_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create audit log before deletion
    db.add(AuditLog(
        institution_id=current_user.institution_id,
        user_id=current_user.id,
        action="student_deleted",
        entity_type="student",
        entity_id=student.id,
        details={
            "student_number": student.student_number,
            "full_name": student.full_name,
        },
    ))
    
    db.delete(student)
    db.commit()
    
    return None


@router.get("/stats/overview")
async def get_student_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get student statistics overview"""
    
    total_students = db.query(Student).filter(
        Student.institution_id == current_user.institution_id
    ).count()
    
    active_students = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.status == "active"
    ).count()
    
    at_risk_students = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.compliance.in_(["yellow", "red"])
    ).count()
    
    return {
        "total_students": total_students,
        "active_students": active_students,
        "at_risk_students": at_risk_students,
    }
