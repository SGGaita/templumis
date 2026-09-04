from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import hash_password, require_role, validate_email_domain, get_current_user
from app.models import User, UserRole, Institution, InstitutionDomain, AuditLog
from app import institution_logos
from app.schemas import (
    DomainCreate, DomainUpdate, DomainOut,
    InstitutionOut, InstitutionUpdate,
    InstitutionUserCreate, UserUpdate, UserOut,
)
from app.institution_modules import (
    normalize_enabled_modules,
    normalize_staff_role_modules,
)

INSTITUTION_ROLES = {
    UserRole.VICE_CHANCELLOR,
    UserRole.REGISTRAR,
    UserRole.SCHOLARSHIP_OFFICE,
    UserRole.STUDENT,
    UserRole.STUDENT_SERVICES,
    UserRole.RESEARCH_OFFICE,
}

router = APIRouter(
    prefix="/api/institution",
    tags=["Institution Admin"],
    dependencies=[Depends(require_role(UserRole.INSTITUTION_ADMIN))],
)

public_router = APIRouter(prefix="/api/public", tags=["Public"])


def _get_admin_institution(current_user: User, db: Session) -> Institution:
    inst = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst


# ── Institution Profile ──────────────────────────────────

@router.get("/profile", response_model=InstitutionOut)
async def get_institution_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    return _get_admin_institution(current_user, db)


@router.patch("/profile", response_model=InstitutionOut)
async def update_institution_profile(
    data: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)

    updates = data.model_dump(exclude_unset=True)
    # Institution-wide module ceiling is managed by global admin
    updates.pop("enabled_modules", None)
    if "is_active" in updates:
        updates.pop("is_active")
    if "staff_role_modules" in updates:
        ceiling = normalize_enabled_modules(inst.enabled_modules)["staff"]
        updates["staff_role_modules"] = normalize_staff_role_modules(
            updates["staff_role_modules"],
            ceiling,
        )

    for field, value in updates.items():
        setattr(inst, field, value)

    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="update_institution_profile",
        entity_type="institution",
        entity_id=inst.id,
        details=updates,
    ))
    db.commit()
    db.refresh(inst)
    return inst


@router.post("/profile/logo", response_model=InstitutionOut)
async def upload_institution_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    content = await file.read()
    mime = file.content_type or ""
    try:
        logo_url = institution_logos.save_logo(inst.id, content=content, mime=mime)
    except ValueError as exc:
        code = str(exc)
        if code == "too_large":
            raise HTTPException(status_code=400, detail="Logo must be 2 MB or smaller") from exc
        if code == "empty":
            raise HTTPException(status_code=400, detail="Logo file is empty") from exc
        raise HTTPException(
            status_code=400, detail="Logo must be a PNG, JPEG, or WebP image"
        ) from exc

    inst.logo_url = logo_url
    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="update_institution_logo",
        entity_type="institution",
        entity_id=inst.id,
        details={"filename": file.filename, "mime": mime},
    ))
    db.commit()
    db.refresh(inst)
    return inst


@router.delete("/profile/logo", response_model=InstitutionOut)
async def delete_institution_logo(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    institution_logos.delete_logo(inst.id)
    inst.logo_url = None
    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="remove_institution_logo",
        entity_type="institution",
        entity_id=inst.id,
        details={},
    ))
    db.commit()
    db.refresh(inst)
    return inst


@public_router.get("/institution-logo/{institution_id}")
async def public_institution_logo(
    institution_id: int,
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    path = institution_logos.resolve_logo(institution_id)
    if not path:
        raise HTTPException(status_code=404, detail="Logo not found")
    return FileResponse(
        path,
        media_type=institution_logos.mime_for(path),
        headers={"Cache-Control": "public, max-age=300"},
    )


# ── Domain Management ────────────────────────────────────

@router.get("/domains", response_model=list[DomainOut])
async def list_domains(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    return db.query(InstitutionDomain).filter(InstitutionDomain.institution_id == inst.id).all()


@router.post("/domains", response_model=DomainOut, status_code=status.HTTP_201_CREATED)
async def add_domain(
    data: DomainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)

    if db.query(InstitutionDomain).filter(InstitutionDomain.domain == data.domain).first():
        raise HTTPException(status_code=400, detail="Domain already registered")

    domain = InstitutionDomain(
        institution_id=inst.id,
        domain=data.domain,
        is_primary=data.is_primary,
    )
    db.add(domain)
    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="add_domain",
        entity_type="institution_domain",
        entity_id=inst.id,
        details={"domain": data.domain},
    ))
    db.commit()
    db.refresh(domain)
    return domain


@router.patch("/domains/{domain_id}", response_model=DomainOut)
async def update_domain(
    domain_id: int,
    data: DomainUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    domain = db.query(InstitutionDomain).filter(
        InstitutionDomain.id == domain_id,
        InstitutionDomain.institution_id == inst.id,
    ).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(domain, field, value)

    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="update_domain",
        entity_type="institution_domain",
        entity_id=domain_id,
        details=data.model_dump(exclude_unset=True),
    ))
    db.commit()
    db.refresh(domain)
    return domain


@router.delete("/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    domain = db.query(InstitutionDomain).filter(
        InstitutionDomain.id == domain_id,
        InstitutionDomain.institution_id == inst.id,
    ).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="remove_domain",
        entity_type="institution_domain",
        entity_id=domain_id,
        details={"domain": domain.domain},
    ))
    db.delete(domain)
    db.commit()


# ── User Management ─────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    return db.query(User).filter(
        User.institution_id == inst.id,
        User.role != UserRole.GLOBAL_ADMIN,
    ).order_by(User.created_at.desc()).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: InstitutionUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)

    try:
        role = UserRole(data.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {data.role}")

    if role not in INSTITUTION_ROLES:
        raise HTTPException(status_code=400, detail="Cannot assign platform-level roles")

    domains = db.query(InstitutionDomain).filter(
        InstitutionDomain.institution_id == inst.id
    ).all()
    allowed = [d.domain for d in domains]

    if allowed and not validate_email_domain(data.email, allowed):
        raise HTTPException(
            status_code=400,
            detail=f"Email domain must match one of: {', '.join(allowed)}",
        )

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        institution_id=inst.id,
    )
    db.add(user)
    db.flush()

    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="create_user",
        entity_type="user",
        entity_id=user.id,
        details={"email": data.email, "role": data.role},
    ))
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    user = db.query(User).filter(User.id == user_id, User.institution_id == inst.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this institution")

    user.is_active = False
    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="deactivate_user",
        entity_type="user",
        entity_id=user_id,
    ))
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/activate", response_model=UserOut)
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    user = db.query(User).filter(User.id == user_id, User.institution_id == inst.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this institution")

    user.is_active = True
    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="activate_user",
        entity_type="user",
        entity_id=user_id,
    ))
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    user = db.query(User).filter(User.id == user_id, User.institution_id == inst.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this institution")

    if data.role:
        try:
            role = UserRole(data.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {data.role}")
        if role not in INSTITUTION_ROLES:
            raise HTTPException(status_code=400, detail="Cannot assign platform-level roles")
        user.role = role

    if data.full_name:
        user.full_name = data.full_name

    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="update_user",
        entity_type="user",
        entity_id=user_id,
        details=data.model_dump(exclude_unset=True),
    ))
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    user = db.query(User).filter(User.id == user_id, User.institution_id == inst.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this institution")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.add(AuditLog(
        institution_id=inst.id,
        user_id=current_user.id,
        action="delete_user",
        entity_type="user",
        entity_id=user_id,
        details={"email": user.email, "full_name": user.full_name},
    ))
    db.delete(user)
    db.commit()


# ── Institution Stats ────────────────────────────────────

@router.get("/stats")
async def institution_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    users = db.query(User).filter(User.institution_id == inst.id)
    return {
        "institution": inst.name,
        "total_users": users.count(),
        "active_users": users.filter(User.is_active == True).count(),
        "users_by_role": {
            role.value: users.filter(User.role == role).count()
            for role in INSTITUTION_ROLES
        },
        "domains": [d.domain for d in inst.domains],
    }


@router.get("/activity-log")
async def get_institution_activity_log(
    skip: int = 0,
    limit: int = 50,
    action: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.INSTITUTION_ADMIN)),
):
    inst = _get_admin_institution(current_user, db)
    
    query = db.query(AuditLog).filter(AuditLog.institution_id == inst.id)
    
    if action and action != "all":
        query = query.filter(AuditLog.action == action)
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
            } if user else None,
        })
    
    return {
        "total": total,
        "items": result,
    }
