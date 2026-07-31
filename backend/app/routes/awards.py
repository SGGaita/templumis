"""Stage 6–7 API: award approval, offers, acceptance, tuition crediting."""

import logging
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.awards import (
    AWARD_OFFER_ACCEPTED,
    AWARD_OFFER_SENT,
    AWARD_CREDITED,
    approve_and_send_offers,
    build_offer_letter,
    expire_stale_offers,
)

logger = logging.getLogger(__name__)
from app.database import get_db
from app.evaluation import build_stack_ranking
from app.models import ScholarshipProgram, StudentScholarshipApplication, User
from app.permissions import assert_staff_portal
from app import triage_db
from app.triage import QUEUE_ASSIGNED

router = APIRouter(prefix="/api/sis-lms/financial-aid/awards", tags=["Scholarship Awards"])

DECISION_ROLES = frozenset({"scholarship_office", "global_admin", "vice_chancellor", "institution_admin"})


def _role(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def _assert_decision_maker(user: User) -> None:
    assert_staff_portal(user)
    if _role(user) not in DECISION_ROLES:
        raise HTTPException(status_code=403, detail="Decision-maker access required")


def _programs_by_external_id(db: Session) -> dict[str, ScholarshipProgram]:
    return {str(p.external_id): p for p in db.query(ScholarshipProgram).all()}


@router.post("/approve-and-send-offers")
def send_offers(
    body: dict | None = Body(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stage 6: FAO approves stack-ranked list and sends formal offers."""
    _assert_decision_maker(current_user)
    body = body or {}

    try:
        expire_stale_offers(db)

        cfg = triage_db.get_or_create_config(db, current_user.institution_id)
        programs = _programs_by_external_id(db)
        budget = body.get("budget")
        if budget is None:
            if cfg.award_budget_pool is not None:
                budget = float(cfg.award_budget_pool)
            else:
                budget = sum(float(p.budget_total_allocated or 0) for p in programs.values()) or 100000.0
        else:
            budget = float(budget)

        rows = (
            db.query(StudentScholarshipApplication)
            .filter(StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED)
            .all()
        )
        ranking = build_stack_ranking(rows, programs, budget=budget)
        within_rows = [r for r in ranking["rows"] if r["within_budget"]]
        within_ids = {r["application_id"] for r in within_rows}
        if not within_ids:
            raise HTTPException(status_code=400, detail="No applications within budget to approve")

        proposed_by_id = {r["application_id"]: float(r["proposed_award"]) for r in within_rows}

        apps = (
            db.query(StudentScholarshipApplication)
            .filter(StudentScholarshipApplication.id.in_(within_ids))
            .all()
        )
        pending_apps = [
            app
            for app in apps
            if app.award_stage not in (AWARD_OFFER_SENT, AWARD_OFFER_ACCEPTED, AWARD_CREDITED)
        ]
        if not pending_apps:
            raise HTTPException(
                status_code=400,
                detail="All ranked applications already have active or completed offers.",
            )

        for app in pending_apps:
            if app.id in proposed_by_id:
                app.award_amount = proposed_by_id[app.id]

        result = approve_and_send_offers(db, pending_apps, programs, current_user, budget=budget)
        if result.get("offers_sent", 0) == 0:
            raise HTTPException(
                status_code=400,
                detail="No new offers were sent. Refresh the ranking and try again.",
            )
        result["message"] = f"Sent {result['offers_sent']} offer(s) to students"
        return result
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("approve-and-send-offers failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send offers: {exc}",
        ) from exc


@router.get("/applications/{application_id}/offer-letter")
def preview_offer_letter(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_decision_maker(current_user)
    app = db.query(StudentScholarshipApplication).filter_by(id=application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    program = (
        db.query(ScholarshipProgram)
        .filter(ScholarshipProgram.external_id == str(app.scholarship_external_id))
        .first()
    )
    letter = app.offer_data or build_offer_letter(app, program)
    return {
        "application_id": app.id,
        "student_number": app.student_number,
        "award_stage": app.award_stage,
        "offer_letter": letter,
        "offer_deadline": app.offer_deadline.isoformat() if app.offer_deadline else None,
    }
