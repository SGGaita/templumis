"""Database helpers for scholarship triage configuration."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ScholarshipTriageConfig, User


def _fetch_config(db: Session, institution_id: int | None) -> ScholarshipTriageConfig | None:
    """Institution-specific row first, then global (institution_id IS NULL)."""
    if institution_id is not None:
        row = (
            db.query(ScholarshipTriageConfig)
            .filter(ScholarshipTriageConfig.institution_id == institution_id)
            .first()
        )
        if row:
            return row
    return (
        db.query(ScholarshipTriageConfig)
        .filter(ScholarshipTriageConfig.institution_id.is_(None))
        .first()
    )


def get_or_create_config(
    db: Session, institution_id: int | None, user: User | None = None
) -> ScholarshipTriageConfig:
    row = _fetch_config(db, institution_id)
    if row:
        return row

    row = ScholarshipTriageConfig(
        institution_id=institution_id,
        blind_review_enabled=False,
        min_reviewers_per_application=2,
        cycle_year=datetime.utcnow().year,
        anonymization_salt=settings.backend_secret_key[:32],
    )
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
        return row
    except IntegrityError:
        db.rollback()
        existing = _fetch_config(db, institution_id)
        if existing:
            return existing
        raise


def config_to_dict(cfg: ScholarshipTriageConfig) -> dict:
    return {
        "blind_review_enabled": bool(cfg.blind_review_enabled),
        "min_reviewers_per_application": int(cfg.min_reviewers_per_application or 2),
        "cycle_year": int(cfg.cycle_year or datetime.utcnow().year),
        "anonymization_salt_set": bool(cfg.anonymization_salt),
        "variance_threshold": float(cfg.variance_threshold or 1.25),
        "weight_academic": float(cfg.weight_academic or 0.34),
        "weight_need": float(cfg.weight_need or 0.33),
        "weight_lead": float(cfg.weight_lead or 0.33),
        "award_budget_pool": float(cfg.award_budget_pool) if cfg.award_budget_pool is not None else None,
        "updated_at": cfg.updated_at.isoformat() if cfg.updated_at else None,
    }
