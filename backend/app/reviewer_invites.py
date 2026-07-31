"""Invite external scholarship reviewers and notify them of assignments."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import settings
from app.email import send_review_task_email, send_reviewer_invite_email
from app.models import ScholarshipReviewAssignment, StudentScholarshipApplication, User, UserRole
from app.triage import COMMITTEE_ROLES

INVITE_EXPIRY_DAYS = 7
REVIEWER_ASSIGNABLE_ROLES = COMMITTEE_ROLES


def _role_value(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def _can_receive_review_assignments(user: User) -> bool:
    return _role_value(user) in REVIEWER_ASSIGNABLE_ROLES


def _app_base_url() -> str:
    return (settings.app_base_url or settings.cors_origins[0]).rstrip("/")


def resolve_or_invite_reviewer(
    db: Session,
    *,
    email: str,
    full_name: str | None,
    institution_id: int | None,
    invited_by: User,
) -> tuple[User, bool]:
    """Return an existing reviewer-capable user or create a pending reviewer invite."""
    normalized = email.strip().lower()
    if not normalized or "@" not in normalized:
        raise ValueError("A valid email address is required")

    existing = db.query(User).filter(User.email == normalized).first()
    if existing:
        if not existing.is_active:
            raise ValueError(f"Account for {normalized} is inactive")
        if not _can_receive_review_assignments(existing):
            raise ValueError(
                f"{normalized} is registered as {_role_value(existing)} and cannot receive scholarship review tasks"
            )
        return existing, False

    token = secrets.token_urlsafe(32)
    display_name = (full_name or normalized.split("@")[0]).strip() or "Scholarship Reviewer"
    user = User(
        email=normalized,
        hashed_password=hash_password(secrets.token_urlsafe(24)),
        full_name=display_name,
        role=UserRole.SCHOLARSHIP_REVIEWER,
        institution_id=institution_id,
        account_category="reviewer",
        email_verified=False,
        invite_token=token,
        invite_token_expires=datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS),
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user, True


def append_reviewers_to_application(
    db: Session,
    app: StudentScholarshipApplication,
    reviewers: list[User],
) -> list[ScholarshipReviewAssignment]:
    """Add reviewers to one application without removing existing assignments."""
    from app.evaluation import EVAL_PENDING
    from app.triage import QUEUE_ASSIGNED

    existing_ids = {
        a.reviewer_user_id
        for a in (app.review_assignments or [])
    }
    next_slot = max((a.assignment_slot for a in (app.review_assignments or [])), default=0) + 1
    created: list[ScholarshipReviewAssignment] = []

    for reviewer in reviewers:
        if reviewer.id in existing_ids:
            continue
        assignment = ScholarshipReviewAssignment(
            application_id=app.id,
            reviewer_user_id=reviewer.id,
            assignment_slot=next_slot,
            status="pending",
        )
        db.add(assignment)
        created.append(assignment)
        existing_ids.add(reviewer.id)
        next_slot += 1

    if created:
        app.triage_queue = QUEUE_ASSIGNED
        app.evaluation_status = EVAL_PENDING

    return created


def notify_reviewer_assignment(
    *,
    reviewer: User,
    application: StudentScholarshipApplication,
    assignment: ScholarshipReviewAssignment,
    scholarship_name: str,
    invited_by_name: str,
    is_new_account: bool,
) -> bool:
    base = _app_base_url()
    if is_new_account and reviewer.invite_token:
        invite_url = f"{base}/reviewer-invite?token={reviewer.invite_token}&email={reviewer.email}"
        return send_reviewer_invite_email(
            to_email=reviewer.email,
            full_name=reviewer.full_name,
            invite_url=invite_url,
            scholarship_name=scholarship_name,
            anonymized_id=application.anonymized_id or f"APP-{application.id}",
            invited_by=invited_by_name,
        )

    task_url = f"{base}/reviewer/tasks?assignment={assignment.id}"
    return send_review_task_email(
        to_email=reviewer.email,
        full_name=reviewer.full_name,
        scholarship_name=scholarship_name,
        anonymized_id=application.anonymized_id or f"APP-{application.id}",
        task_url=task_url,
        invited_by=invited_by_name,
    )
