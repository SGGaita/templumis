from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import authenticate_user, create_access_token, get_current_user, hash_password, validate_email_domain
from app.schemas import Token, LoginRequest, UserOut, InstitutionUserCreate
from app.models import User, UserRole, Institution, InstitutionDomain, AuditLog

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(form: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, form.email, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


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
    
    try:
        role = UserRole(data.role)
    except ValueError:
        role = UserRole.STUDENT
    
    if role not in {UserRole.VICE_CHANCELLOR, UserRole.REGISTRAR, UserRole.SCHOLARSHIP_OFFICE, 
                    UserRole.STUDENT, UserRole.STUDENT_SERVICES, UserRole.RESEARCH_OFFICE}:
        role = UserRole.STUDENT
    
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        institution_id=institution.id,
    )
    db.add(user)
    db.flush()
    
    db.add(AuditLog(
        institution_id=institution.id,
        user_id=user.id,
        action="user_signup",
        entity_type="user",
        entity_id=user.id,
        details={"email": data.email, "role": role.value},
    ))
    db.commit()
    db.refresh(user)
    return user
