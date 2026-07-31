from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Student, SupportResourceLink, LibraryResource,
    StudentAdvisor
)
from app.schemas import (
    SupportResourceLinkOut, LibraryResourceOut, StudentAdvisorOut
)

router = APIRouter(prefix="/api/student-support", tags=["Student Support"])


@router.get("/resources", response_model=List[SupportResourceLinkOut])
async def get_support_resources(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get support resources filtered by program level and category"""
    
    if current_user.account_category != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access support resources"
        )
    
    # Get student to determine program level
    student = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.email == current_user.email
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found"
        )
    
    # Build query
    query = db.query(SupportResourceLink).filter(
        SupportResourceLink.institution_id == current_user.institution_id,
        SupportResourceLink.is_active == True
    )
    
    # Filter by program level
    if student.program_level:
        query = query.filter(
            (SupportResourceLink.program_level_filter == "all") |
            (SupportResourceLink.program_level_filter == student.program_level)
        )
    else:
        query = query.filter(SupportResourceLink.program_level_filter == "all")
    
    # Filter by category if provided
    if category:
        query = query.filter(SupportResourceLink.resource_category == category)
    
    resources = query.all()
    return resources


@router.get("/library-resources", response_model=List[LibraryResourceOut])
async def get_library_resources(
    resource_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get library resources and databases"""
    
    if current_user.account_category != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access library resources"
        )
    
    query = db.query(LibraryResource).filter(
        LibraryResource.institution_id == current_user.institution_id,
        LibraryResource.is_active == True
    )
    
    if resource_type:
        query = query.filter(LibraryResource.resource_type == resource_type)
    
    resources = query.all()
    return resources


@router.get("/my-advisor", response_model=dict)
async def get_my_advisor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assigned advisor information"""
    
    if current_user.account_category != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access advisor information"
        )
    
    student = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.email == current_user.email
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found"
        )
    
    # Get all active advisors
    advisor_assignments = db.query(StudentAdvisor).filter(
        StudentAdvisor.student_id == student.id,
        StudentAdvisor.is_active == True
    ).all()
    
    advisors = []
    for assignment in advisor_assignments:
        advisor = db.query(User).filter(User.id == assignment.advisor_id).first()
        if advisor:
            advisors.append({
                "id": advisor.id,
                "name": advisor.full_name,
                "email": advisor.email,
                "role": advisor.role,
                "advisor_type": assignment.advisor_type,
                "assignment_date": assignment.assignment_date.isoformat() if assignment.assignment_date else None,
                "notes": assignment.notes
            })
    
    return {
        "advisors": advisors,
        "last_contact_date": student.last_advisor_contact_date.isoformat() if student.last_advisor_contact_date else None
    }


@router.post("/request-advisor-meeting")
async def request_advisor_meeting(
    advisor_id: int,
    message: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request a meeting with advisor (creates a support ticket)"""
    
    if current_user.account_category != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can request advisor meetings"
        )
    
    student = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.email == current_user.email
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found"
        )
    
    # Verify advisor assignment
    assignment = db.query(StudentAdvisor).filter(
        StudentAdvisor.student_id == student.id,
        StudentAdvisor.advisor_id == advisor_id,
        StudentAdvisor.is_active == True
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advisor not assigned to this student"
        )
    
    # In a real implementation, this would create a support ticket or send an email
    # For now, we'll just return a success message
    
    return {
        "message": "Meeting request sent to advisor",
        "advisor_id": advisor_id,
        "student_id": student.id
    }


@router.get("/scholarships/opportunities", response_model=dict)
async def get_scholarship_opportunities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available scholarship opportunities for student"""
    
    if current_user.account_category != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access scholarship opportunities"
        )
    
    student = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.email == current_user.email
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found"
        )
    
    # This would integrate with the scholarships module
    # For now, return a placeholder
    return {
        "message": "Scholarship opportunities endpoint",
        "student_gpa": float(student.gpa) if student.gpa else None,
        "credits_completed": student.credits_completed,
        "note": "Integration with scholarships module pending"
    }


@router.get("/grants/opportunities", response_model=dict)
async def get_grant_opportunities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get research grant opportunities (postgraduate students only)"""
    
    if current_user.account_category != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access grant opportunities"
        )
    
    student = db.query(Student).filter(
        Student.institution_id == current_user.institution_id,
        Student.email == current_user.email
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student record not found"
        )
    
    # Check if postgraduate
    if student.program_level not in ["masters", "phd", "postgraduate"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Grant opportunities are only available to postgraduate students"
        )
    
    # This would integrate with the grants module
    # For now, return a placeholder
    return {
        "message": "Grant opportunities endpoint",
        "program_level": student.program_level,
        "note": "Integration with grants module pending"
    }
