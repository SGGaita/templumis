"""Student-facing scholarship application status and review progress."""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.awards import student_pipeline_label
from app.evaluation import EVAL_DISPUTED, EVAL_PENDING, EVAL_RECONCILED, assignment_is_scored
from app.models import StudentScholarshipApplication
from app.scholarship_db import app_to_dict


def _step_state(done: bool, current: bool, failed: bool = False) -> str:
    if failed:
        return "failed"
    if current:
        return "current"
    if done:
        return "complete"
    return "pending"


def _review_status_label(row: StudentScholarshipApplication, assigned: int, completed: int) -> str:
    triage = row.triage_queue or "pending_triage"
    eval_status = row.evaluation_status or EVAL_PENDING

    if triage == "rejection_automated":
        return "Application did not meet eligibility requirements"
    if triage in ("pending_triage", "ready_for_committee") and assigned == 0:
        return "Awaiting committee reviewer assignment"
    if assigned > 0 and completed == 0:
        return "Committee review in progress"
    if assigned > 0 and completed < assigned:
        return f"{completed} of {assigned} committee review(s) complete"
    if assigned > 0 and completed >= assigned:
        if eval_status == EVAL_DISPUTED:
            return "Committee scores being reconciled"
        if eval_status == EVAL_RECONCILED:
            return "Committee review complete — final ranking in progress"
        if row.award_stage:
            return "Committee review complete"
        return "Committee review complete — awaiting award decision"
    if triage == "document_verification":
        if row.documents_verified:
            return "Documents verified — awaiting reviewer assignment"
        return "Supporting documents under verification"
    return "Under administrative review"


def build_pipeline_steps(row: StudentScholarshipApplication) -> list[dict]:
    status = str(row.status or "").lower()
    triage = row.triage_queue or "pending_triage"
    award = row.award_stage
    assigned = len(row.review_assignments or [])
    completed = sum(1 for a in (row.review_assignments or []) if assignment_is_scored(a))

    if status == "draft":
        return [
            {"key": "draft", "label": "Complete application", "state": "current"},
            {"key": "submitted", "label": "Submit for review", "state": "pending"},
            {"key": "triage", "label": "Administrative review", "state": "pending"},
            {"key": "committee", "label": "Committee review", "state": "pending"},
            {"key": "decision", "label": "Award decision", "state": "pending"},
        ]

    if triage == "rejection_automated":
        return [
            {"key": "submitted", "label": "Application submitted", "state": "complete"},
            {"key": "triage", "label": "Eligibility screening", "state": "failed"},
        ]

    submitted_done = status in ("submitted for review", "awarded") or bool(row.applied_date)
    triage_done = triage not in ("pending_triage", "document_verification") or (
        triage == "document_verification" and row.documents_verified
    )
    triage_current = triage in ("pending_triage", "document_verification") and not (
        triage == "document_verification" and row.documents_verified
    )
    committee_current = triage == "assigned" and completed < assigned
    committee_done = completed >= assigned and assigned > 0
    decision_current = committee_done and not award and (row.evaluation_status or EVAL_PENDING) != EVAL_DISPUTED
    decision_done = bool(award) or str(row.status or "").lower() == "awarded"
    offer_current = award in ("offer_sent",)
    offer_done = award in ("offer_accepted", "credited") or str(row.status or "").lower() == "awarded"
    credited_done = award == "credited" or str(row.status or "").lower() == "awarded"

    steps = [
        {
            "key": "submitted",
            "label": "Application submitted",
            "state": _step_state(submitted_done, not submitted_done),
        },
        {
            "key": "triage",
            "label": "Administrative review",
            "state": _step_state(triage_done, triage_current),
        },
        {
            "key": "committee",
            "label": "Committee review",
            "state": _step_state(committee_done, committee_current),
        },
        {
            "key": "decision",
            "label": "Award decision",
            "state": _step_state(decision_done, decision_current),
        },
        {
            "key": "offer",
            "label": "Offer response",
            "state": _step_state(offer_done, offer_current),
        },
        {
            "key": "credited",
            "label": "Tuition credit",
            "state": _step_state(credited_done, award == "offer_accepted"),
        },
    ]
    return steps


def _review_progress(row: StudentScholarshipApplication) -> dict:
    assigned = len(row.review_assignments or [])
    completed = sum(1 for a in (row.review_assignments or []) if assignment_is_scored(a))
    return {
        "reviewers_assigned": assigned,
        "reviews_completed": completed,
        "status_label": _review_status_label(row, assigned, completed),
    }


def pipeline_progress_percent(steps: list[dict]) -> int:
    if not steps:
        return 0
    weights = {"complete": 1.0, "current": 0.5, "failed": 1.0, "pending": 0.0}
    total = sum(weights.get(s.get("state"), 0) for s in steps)
    return min(100, round((total / len(steps)) * 100))


def build_student_application_list_item(
    row: StudentScholarshipApplication,
    scholarship_details: Optional[dict],
) -> dict:
    """Lightweight list payload with pipeline and review summary."""
    schol = scholarship_details or {}
    steps = build_pipeline_steps(row)
    review = _review_progress(row)
    base = app_to_dict(row, scholarship_details)
    current = next((s for s in steps if s["state"] == "current"), None)
    if not current and steps:
        failed = next((s for s in steps if s["state"] == "failed"), None)
        current = failed or steps[-1]
    return {
        **base,
        "scholarship_name": schol.get("scholarship_name") or row.scholarship_external_id,
        "scholarship_type": schol.get("type"),
        "pipeline_steps": steps,
        "pipeline_progress_pct": pipeline_progress_percent(steps),
        "current_pipeline_step": current,
        "review_progress": review,
        "documents_verified": bool(row.documents_verified),
        "triage_queue": row.triage_queue,
    }


def build_student_application_detail(
    row: StudentScholarshipApplication,
    scholarship_details: Optional[dict],
) -> dict:
    review = _review_progress(row)
    steps = build_pipeline_steps(row)
    base = app_to_dict(row, scholarship_details)
    schol = scholarship_details or {}

    return {
        **base,
        "scholarship_name": schol.get("scholarship_name") or row.scholarship_external_id,
        "scholarship_type": schol.get("type"),
        "scholarship_description": schol.get("description") or schol.get("criteria"),
        "triage_queue": row.triage_queue,
        "evaluation_status": row.evaluation_status,
        "documents_verified": bool(row.documents_verified),
        "auto_reject_reason": row.auto_reject_reason if (row.triage_queue or "") == "rejection_automated" else None,
        "anonymized_id": row.anonymized_id,
        "review_progress": review,
        "pipeline_steps": steps,
        "pipeline_progress_pct": pipeline_progress_percent(steps),
        "current_pipeline_step": next((s for s in steps if s["state"] == "current"), steps[-1] if steps else None),
        "references_submitted": len(row.references_data or []),
        "supporting_documents_count": len((row.form_data or {}).get("supporting_documents") or []),
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def get_student_application_detail(
    db: Session,
    student_number: str,
    scholarship_external_id: str,
    scholarship_details: Optional[dict],
) -> Optional[dict]:
    from sqlalchemy.orm import joinedload

    row = (
        db.query(StudentScholarshipApplication)
        .options(joinedload(StudentScholarshipApplication.review_assignments))
        .filter(
            StudentScholarshipApplication.student_number == str(student_number),
            StudentScholarshipApplication.scholarship_external_id == str(scholarship_external_id),
        )
        .first()
    )
    if not row:
        return None
    return build_student_application_detail(row, scholarship_details)
