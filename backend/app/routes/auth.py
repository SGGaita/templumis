from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import random
import string

from app.database import get_db
from app.auth import authenticate_user, create_access_token, get_current_user, hash_password, validate_email_domain
from app.schemas import Token, LoginRequest, UserOut, InstitutionUserCreate, EmailVerification
from app.models import User, UserRole, Institution, InstitutionDomain, AuditLog
from app.email import send_verification_email
from app.routes.sis_lms import load_excel_data, sheet_to_dict_list
from app.account_category import sync_account_category
from app.institution_modules import (
    effective_enabled_modules_for_user,
    effective_staff_role_access_for_user,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _role_value(user: User) -> str:
    role = user.role
    return role.value if hasattr(role, "value") else str(role)


@router.post("/login", response_model=Token)
async def login(form: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, form.email, form.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        sync_account_category(user, db)
        token = create_access_token(data={"sub": str(user.id), "role": _role_value(user)})
        return Token(access_token=token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Login failed for %s", form.email)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {exc}",
        ) from exc


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = sync_account_category(current_user, db)
    # Add institution name if user has institution_id
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "institution_id": current_user.institution_id,
        "institution_name": None,
        "institution_logo_url": None,
        "institution_domains": [],
        "institution_primary_domain": None,
        "enabled_modules": None,
        "staff_role_access": None,
        "account_category": category,
        "student_registration_number": current_user.student_registration_number,
        "email_verified": current_user.email_verified,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }
    
    if current_user.institution_id:
        from app.models import Institution, InstitutionDomain
        from app.institution_logos import public_logo_url
        institution = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
        if institution:
            user_dict["institution_name"] = institution.name
            user_dict["institution_logo_url"] = public_logo_url(
                institution.id, institution.logo_url
            )
            user_dict["enabled_modules"] = effective_enabled_modules_for_user(
                institution.enabled_modules,
                getattr(institution, "staff_role_modules", None),
                current_user.role,
                category,
            )
            user_dict["staff_role_access"] = effective_staff_role_access_for_user(
                institution.enabled_modules,
                getattr(institution, "staff_role_modules", None),
                current_user.role,
            )
            domains = (
                db.query(InstitutionDomain)
                .filter(InstitutionDomain.institution_id == institution.id)
                .all()
            )
            user_dict["institution_domains"] = [d.domain for d in domains]
            primary = next((d for d in domains if d.is_primary), None)
            user_dict["institution_primary_domain"] = (
                primary.domain if primary else (domains[0].domain if domains else None)
            )

    return user_dict


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(data: InstitutionUserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    email_domain = data.email.split("@")[1] if "@" in data.email else None
    if not email_domain:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    domain_record = db.query(InstitutionDomain).filter(
        InstitutionDomain.domain == email_domain
    ).first()
    
    if not domain_record:
        raise HTTPException(
            status_code=400,
            detail=f"Email domain @{email_domain} is not registered with any institution. Please contact your institution administrator."
        )
    
    institution = db.query(Institution).filter(
        Institution.id == domain_record.institution_id
    ).first()
    
    if not institution or not institution.is_active:
        raise HTTPException(
            status_code=400,
            detail="Institution is not active. Please contact your institution administrator."
        )
    
    account_category = data.account_category or "student"
    
    if account_category == "student":
        role = UserRole.STUDENT
        if not data.student_registration_number:
            raise HTTPException(
                status_code=400,
                detail="Student registration number is required for student accounts"
            )
        
        # Verify student exists in Excel and email matches
        try:
            wb = load_excel_data()
            students_sheet = wb["Students"]
            students = sheet_to_dict_list(students_sheet)
            wb.close()
            
            # Find student by ID
            student_record = next((s for s in students if s.get("student_id") == data.student_registration_number), None)
            
            if not student_record:
                raise HTTPException(
                    status_code=400,
                    detail="Student ID not found in institutional records. Please contact the registrar's office."
                )
            
            # Verify email matches
            if student_record.get("email", "").lower() != data.email.lower():
                raise HTTPException(
                    status_code=400,
                    detail="Email does not match the student ID in our records. Please use your institutional email."
                )
        except HTTPException:
            raise
        except Exception as e:
            # If Excel check fails, log but allow registration
            print(f"Excel verification failed: {e}")
    elif account_category == "staff":
        try:
            role = UserRole(data.role)
        except ValueError:
            role = UserRole.STUDENT_SERVICES
        
        if role not in {UserRole.VICE_CHANCELLOR, UserRole.REGISTRAR, UserRole.SCHOLARSHIP_OFFICE, 
                        UserRole.STUDENT_SERVICES, UserRole.RESEARCH_OFFICE}:
            role = UserRole.STUDENT_SERVICES
    else:
        role = UserRole.STUDENT
    
    # For students verified against Excel, auto-verify email
    # For staff, require email verification
    if account_category == "student":
        email_verified = True
        verification_code = None
        verification_expires = None
    else:
        email_verified = False
        verification_code = ''.join(random.choices(string.digits, k=6))
        verification_expires = datetime.utcnow() + timedelta(minutes=30)
    
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        institution_id=institution.id,
        account_category=account_category,
        student_registration_number=data.student_registration_number,
        email_verified=email_verified,
        verification_code=verification_code,
        verification_code_expires=verification_expires,
    )
    db.add(user)
    db.flush()
    
    db.add(AuditLog(
        institution_id=institution.id,
        user_id=user.id,
        action="user_signup",
        entity_type="user",
        entity_id=user.id,
        details={
            "email": data.email, 
            "role": role.value,
            "account_category": account_category,
            "student_registration_number": data.student_registration_number
        },
    ))
    db.commit()
    db.refresh(user)
    
    # Send verification email only for staff accounts
    if account_category == "staff" and verification_code:
        try:
            send_verification_email(user.email, user.full_name, verification_code)
        except Exception as e:
            print(f"Failed to send verification email: {e}")
    
    return user


@router.post("/accept-reviewer-invite", response_model=Token)
async def accept_reviewer_invite(body: dict, db: Session = Depends(get_db)):
    """Complete setup for an invited scholarship reviewer account."""
    email = (body.get("email") or "").strip().lower()
    token = (body.get("token") or "").strip()
    password = body.get("password") or ""
    full_name = (body.get("full_name") or "").strip()

    if not email or not token or not password:
        raise HTTPException(status_code=400, detail="Email, token, and password are required")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if user.role != UserRole.SCHOLARSHIP_REVIEWER:
        raise HTTPException(status_code=400, detail="This invitation is not for a reviewer account")
    if user.invite_token != token:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation link")
    if user.invite_token_expires and datetime.utcnow() > user.invite_token_expires:
        raise HTTPException(status_code=400, detail="Invitation link has expired")

    user.hashed_password = hash_password(password)
    if full_name:
        user.full_name = full_name
    user.email_verified = True
    user.invite_token = None
    user.invite_token_expires = None
    user.account_category = "reviewer"
    sync_account_category(user, db)

    db.add(AuditLog(
        institution_id=user.institution_id,
        user_id=user.id,
        action="reviewer_invite_accepted",
        entity_type="user",
        entity_id=user.id,
        details={"email": user.email},
    ))
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id), "role": _role_value(user)})
    return Token(access_token=access_token)


@router.post("/verify-email", response_model=UserOut)
async def verify_email(data: EmailVerification, db: Session = Depends(get_db)):
    """Verify user email with verification code"""
    
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    if not user.verification_code:
        raise HTTPException(status_code=400, detail="No verification code found")
    
    if user.verification_code_expires and datetime.utcnow() > user.verification_code_expires:
        raise HTTPException(status_code=400, detail="Verification code has expired")
    
    if user.verification_code != data.verification_code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark email as verified
    user.email_verified = True
    user.verification_code = None
    user.verification_code_expires = None
    
    db.add(AuditLog(
        institution_id=user.institution_id,
        user_id=user.id,
        action="email_verified",
        entity_type="user",
        entity_id=user.id,
        details={"email": user.email},
    ))
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(email: str, db: Session = Depends(get_db)):
    """Resend verification code"""
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new verification code
    verification_code = ''.join(random.choices(string.digits, k=6))
    verification_expires = datetime.utcnow() + timedelta(minutes=30)
    
    user.verification_code = verification_code
    user.verification_code_expires = verification_expires
    db.commit()
    
    # Send verification email
    try:
        send_verification_email(user.email, user.full_name, verification_code)
        return {"message": "Verification code sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.get("/validate-email/{email}")
async def validate_email(email: str, db: Session = Depends(get_db)):
    """Validate if email domain is registered and email is not already taken"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return {
            "valid": False,
            "available": False,
            "message": "Email already registered",
            "domain_valid": True
        }
    
    # Extract domain
    if "@" not in email:
        return {
            "valid": False,
            "available": True,
            "message": "Invalid email format",
            "domain_valid": False
        }
    
    email_domain = email.split("@")[1]
    
    # Check if domain is registered
    domain_record = db.query(InstitutionDomain).filter(
        InstitutionDomain.domain == email_domain
    ).first()
    
    if not domain_record:
        return {
            "valid": False,
            "available": True,
            "message": f"Domain @{email_domain} is not registered with any institution",
            "domain_valid": False
        }
    
    # Check if institution is active
    institution = db.query(Institution).filter(
        Institution.id == domain_record.institution_id
    ).first()
    
    if not institution or not institution.is_active:
        return {
            "valid": False,
            "available": True,
            "message": "Institution is not active",
            "domain_valid": False
        }
    
    # Check against Excel file for student emails
    try:
        wb = load_excel_data()
        students_sheet = wb["Students"]
        students = sheet_to_dict_list(students_sheet)
        wb.close()
        
        # Find student by email in Excel
        student_record = next((s for s in students if s.get("email", "").lower() == email.lower()), None)
        
        if student_record:
            return {
                "valid": True,
                "available": True,
                "message": f"Email verified - {student_record.get('full_name', 'Student')}",
                "domain_valid": True,
                "institution_name": institution.name,
                "student_found": True,
                "student_name": student_record.get("full_name")
            }
    except Exception as e:
        # If Excel check fails, continue with domain validation
        pass
    
    return {
        "valid": True,
        "available": True,
        "message": "Email is valid and available",
        "domain_valid": True,
        "institution_name": institution.name
    }


@router.get("/validate-student-id/{student_id}")
async def validate_student_id(student_id: str, db: Session = Depends(get_db)):
    """Validate if student ID exists in the system"""
    
    # For now, since we don't have a students table yet, we'll check if the ID
    # is already used by another user
    existing_user = db.query(User).filter(
        User.student_registration_number == student_id
    ).first()
    
    if existing_user:
        return {
            "valid": False,
            "available": False,
            "message": "Student ID already registered"
        }
    
    # Basic format validation (alphanumeric, 6-20 characters)
    if not student_id or len(student_id) < 6 or len(student_id) > 20:
        return {
            "valid": False,
            "available": True,
            "message": "Student ID must be 6-20 characters"
        }
    
    # Check against Excel file
    try:
        wb = load_excel_data()
        students_sheet = wb["Students"]
        students = sheet_to_dict_list(students_sheet)
        wb.close()
        
        # Find student in Excel
        student_record = next((s for s in students if s.get("student_id") == student_id), None)
        
        if not student_record:
            return {
                "valid": False,
                "available": True,
                "message": "Student ID not found in institutional records"
            }
        
        return {
            "valid": True,
            "available": True,
            "message": "Student ID is valid",
            "student_name": student_record.get("full_name"),
            "student_email": student_record.get("email")
        }
    except Exception as e:
        # If Excel check fails, allow registration (fallback)
        return {
            "valid": True,
            "available": True,
            "message": "Student ID format is valid"
        }
