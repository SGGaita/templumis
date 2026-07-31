from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import hash_password, require_role
from app.models import User, UserRole, Institution, InstitutionDomain, AuditLog, PlatformSetting
from app.schemas import (
    InstitutionCreate, InstitutionOut, InstitutionUpdate,
    DomainCreate, DomainOut,
    InstitutionAdminCreate, UserOut,
    PlatformSettingsOut, PlatformSettingsUpdate,
)

router = APIRouter(
    prefix="/api/global-admin",
    tags=["Global Admin"],
    dependencies=[Depends(require_role(UserRole.GLOBAL_ADMIN))],
)


# ── Institutions ─────────────────────────────────────────

@router.get("/institutions", response_model=list[InstitutionOut])
async def list_institutions(db: Session = Depends(get_db)):
    return db.query(Institution).order_by(Institution.created_at.desc()).all()


@router.post("/institutions", response_model=InstitutionOut, status_code=status.HTTP_201_CREATED)
async def create_institution(
    data: InstitutionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    if db.query(Institution).filter(Institution.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Institution slug already exists")

    institution = Institution(
        name=data.name,
        slug=data.slug,
        contact_email=data.contact_email,
        address=data.address,
    )
    db.add(institution)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="create_institution",
        entity_type="institution",
        entity_id=institution.id,
        details={"name": data.name, "slug": data.slug},
    ))
    db.commit()
    db.refresh(institution)
    return institution


@router.get("/institutions/{institution_id}", response_model=InstitutionOut)
async def get_institution(institution_id: int, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst


@router.patch("/institutions/{institution_id}", response_model=InstitutionOut)
async def update_institution(
    institution_id: int,
    data: InstitutionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inst, field, value)

    db.add(AuditLog(
        user_id=current_user.id,
        action="update_institution",
        entity_type="institution",
        entity_id=institution_id,
        details=data.model_dump(exclude_unset=True),
    ))
    db.commit()
    db.refresh(inst)
    return inst


@router.post("/institutions/{institution_id}/deactivate", response_model=InstitutionOut)
async def deactivate_institution(
    institution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    inst.is_active = False
    db.add(AuditLog(
        user_id=current_user.id,
        action="deactivate_institution",
        entity_type="institution",
        entity_id=institution_id,
        details={"name": inst.name},
    ))
    db.commit()
    db.refresh(inst)
    return inst


@router.post("/institutions/{institution_id}/activate", response_model=InstitutionOut)
async def activate_institution(
    institution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    inst.is_active = True
    db.add(AuditLog(
        user_id=current_user.id,
        action="activate_institution",
        entity_type="institution",
        entity_id=institution_id,
        details={"name": inst.name},
    ))
    db.commit()
    db.refresh(inst)
    return inst


@router.delete("/institutions/{institution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_institution(
    institution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    # Check if institution has users
    user_count = db.query(User).filter(User.institution_id == institution_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete institution with {user_count} users. Deactivate instead or remove users first."
        )
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="delete_institution",
        entity_type="institution",
        entity_id=institution_id,
        details={"name": inst.name, "slug": inst.slug},
    ))
    db.delete(inst)
    db.commit()


# ── Institution Domains ──────────────────────────────────

@router.post("/institutions/{institution_id}/domains", response_model=DomainOut, status_code=status.HTTP_201_CREATED)
async def add_domain(
    institution_id: int,
    data: DomainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    if db.query(InstitutionDomain).filter(InstitutionDomain.domain == data.domain).first():
        raise HTTPException(status_code=400, detail="Domain already registered")

    domain = InstitutionDomain(
        institution_id=institution_id,
        domain=data.domain,
        is_primary=data.is_primary,
    )
    db.add(domain)
    db.add(AuditLog(
        user_id=current_user.id,
        action="add_domain",
        entity_type="institution_domain",
        entity_id=institution_id,
        details={"domain": data.domain},
    ))
    db.commit()
    db.refresh(domain)
    return domain


@router.delete("/institutions/{institution_id}/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_domain(
    institution_id: int,
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    domain = db.query(InstitutionDomain).filter(
        InstitutionDomain.id == domain_id,
        InstitutionDomain.institution_id == institution_id,
    ).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    db.add(AuditLog(
        user_id=current_user.id,
        action="remove_domain",
        entity_type="institution_domain",
        entity_id=domain_id,
        details={"domain": domain.domain},
    ))
    db.delete(domain)
    db.commit()


# ── Institution Admins ───────────────────────────────────

@router.post("/institutions/{institution_id}/admins", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_institution_admin(
    institution_id: int,
    data: InstitutionAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.INSTITUTION_ADMIN,
        institution_id=institution_id,
    )
    db.add(user)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="create_institution_admin",
        entity_type="user",
        entity_id=user.id,
        details={"email": data.email, "institution_id": institution_id},
    ))
    db.commit()
    db.refresh(user)
    return user


# ── Institution Users ───────────────────────────────────

@router.get("/institutions/{institution_id}/users", response_model=list[UserOut])
async def list_institution_users(institution_id: int, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    users = db.query(User).filter(User.institution_id == institution_id).all()
    return users


@router.get("/institutions/{institution_id}/activities")
async def get_institution_activities(
    institution_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    # Get activities related to this specific institution
    # For institution entity_type, match the entity_id
    # For institution_domain entity_type, check if the domain belongs to this institution
    institution_logs = db.query(AuditLog).filter(
        AuditLog.entity_id == institution_id,
        AuditLog.entity_type == "institution"
    ).all()
    
    # Get domain-related activities for this institution
    domain_ids = [d.id for d in inst.domains]
    domain_logs = []
    if domain_ids:
        domain_logs = db.query(AuditLog).filter(
            AuditLog.entity_id.in_(domain_ids),
            AuditLog.entity_type == "institution_domain"
        ).all()
    
    # Get user-related activities for this institution (admin creation)
    user_logs = db.query(AuditLog).filter(
        AuditLog.entity_type == "user",
        AuditLog.action == "create_institution_admin"
    ).all()
    
    # Filter user logs to only include those for this institution
    user_logs = [log for log in user_logs if log.details and log.details.get("institution_id") == institution_id]
    
    # Combine and sort all logs
    all_logs = institution_logs + domain_logs + user_logs
    all_logs.sort(key=lambda x: x.created_at, reverse=True)
    all_logs = all_logs[:limit]
    
    result = []
    for log in all_logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
            "user": {
                "full_name": user.full_name,
                "email": user.email,
            } if user else None,
        })
    
    return result


# ── Activity Log ────────────────────────────────────────

@router.get("/activity-log")
async def get_activity_log(
    skip: int = 0,
    limit: int = 50,
    action: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog).join(User, AuditLog.user_id == User.id)
    
    if action and action != "all":
        query = query.filter(AuditLog.action == action)
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich logs with user information
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


# ── Platform Stats ───────────────────────────────────────

@router.get("/stats")
async def platform_stats(db: Session = Depends(get_db)):
    total_domains = db.query(InstitutionDomain).count()
    return {
        "total_institutions": db.query(Institution).count(),
        "active_institutions": db.query(Institution).filter(Institution.is_active == True).count(),
        "total_users": db.query(User).count(),
        "total_domains": total_domains,
        "users_by_role": {
            role.value: db.query(User).filter(User.role == role).count()
            for role in UserRole
        },
    }


# ── Platform Settings ────────────────────────────────────

def _get_setting_value(db: Session, key: str, default: str = "") -> str:
    """Helper to get a setting value from database"""
    setting = db.query(PlatformSetting).filter(PlatformSetting.setting_key == key).first()
    return setting.setting_value if setting else default


def _set_setting_value(db: Session, key: str, value: str, user_id: int):
    """Helper to set a setting value in database"""
    setting = db.query(PlatformSetting).filter(PlatformSetting.setting_key == key).first()
    if setting:
        setting.setting_value = value
        setting.updated_by = user_id
    else:
        setting = PlatformSetting(setting_key=key, setting_value=value, updated_by=user_id)
        db.add(setting)


@router.get("/settings", response_model=PlatformSettingsOut)
async def get_settings(db: Session = Depends(get_db)):
    """Get platform settings"""
    return PlatformSettingsOut(
        platform_name=_get_setting_value(db, "platform_name", "TemplumIS"),
        support_email=_get_setting_value(db, "support_email", "support@templumis.com"),
        allow_registration=_get_setting_value(db, "allow_registration", "true") == "true",
        require_email_verification=_get_setting_value(db, "require_email_verification", "true") == "true",
        maintenance_mode=_get_setting_value(db, "maintenance_mode", "false") == "true",
    )


@router.put("/settings", response_model=PlatformSettingsOut)
async def update_settings(
    data: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.GLOBAL_ADMIN)),
):
    """Update platform settings"""
    changes = {}
    
    if data.platform_name is not None:
        _set_setting_value(db, "platform_name", data.platform_name, current_user.id)
        changes["platform_name"] = data.platform_name
    
    if data.support_email is not None:
        _set_setting_value(db, "support_email", data.support_email, current_user.id)
        changes["support_email"] = data.support_email
    
    if data.allow_registration is not None:
        _set_setting_value(db, "allow_registration", str(data.allow_registration).lower(), current_user.id)
        changes["allow_registration"] = data.allow_registration
    
    if data.require_email_verification is not None:
        _set_setting_value(db, "require_email_verification", str(data.require_email_verification).lower(), current_user.id)
        changes["require_email_verification"] = data.require_email_verification
    
    if data.maintenance_mode is not None:
        _set_setting_value(db, "maintenance_mode", str(data.maintenance_mode).lower(), current_user.id)
        changes["maintenance_mode"] = data.maintenance_mode
    
    # Log the settings change
    if changes:
        db.add(AuditLog(
            user_id=current_user.id,
            action="update_platform_settings",
            entity_type="platform_settings",
            details=changes,
        ))
    
    db.commit()
    
    # Return updated settings
    return PlatformSettingsOut(
        platform_name=_get_setting_value(db, "platform_name", "TemplumIS"),
        support_email=_get_setting_value(db, "support_email", "support@templumis.com"),
        allow_registration=_get_setting_value(db, "allow_registration", "true") == "true",
        require_email_verification=_get_setting_value(db, "require_email_verification", "true") == "true",
        maintenance_mode=_get_setting_value(db, "maintenance_mode", "false") == "true",
    )
