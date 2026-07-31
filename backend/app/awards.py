"""Stage 6–7: Award approval, offers, acceptance, and tuition crediting."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models import ScholarshipProgram, StudentScholarshipApplication, User

# Award pipeline (after committee scoring)
AWARD_PROPOSED = "proposed"
AWARD_APPROVED = "approved"
AWARD_OFFER_SENT = "offer_sent"
AWARD_OFFER_ACCEPTED = "offer_accepted"
AWARD_OFFER_DECLINED = "offer_declined"
AWARD_OFFER_EXPIRED = "offer_expired"
AWARD_CREDITED = "credited"

OFFER_DEADLINE_BUSINESS_DAYS = 14

STUDENT_STATUS_LABELS = {
    None: "Under review",
    "": "Under review",
    AWARD_PROPOSED: "Awaiting final approval",
    AWARD_APPROVED: "Approved — preparing offer",
    AWARD_OFFER_SENT: "Offer received — action required",
    AWARD_OFFER_ACCEPTED: "Offer accepted",
    AWARD_OFFER_DECLINED: "Offer declined",
    AWARD_OFFER_EXPIRED: "Offer expired",
    AWARD_CREDITED: "Applied to tuition",
}

STAFF_AWARD_LABELS = {
    None: "In review",
    "": "In review",
    AWARD_PROPOSED: "Proposed",
    AWARD_APPROVED: "Approved",
    AWARD_OFFER_SENT: "Offer sent",
    AWARD_OFFER_ACCEPTED: "Accepted",
    AWARD_OFFER_DECLINED: "Declined",
    AWARD_OFFER_EXPIRED: "Expired",
    AWARD_CREDITED: "Credited to tuition",
}


def _business_days_from(now: datetime, days: int) -> datetime:
    d = now
    added = 0
    while added < days:
        d += timedelta(days=1)
        if d.weekday() < 5:
            added += 1
    return d


def student_pipeline_label(app: StudentScholarshipApplication) -> str:
    """Student-facing status across the full pipeline."""
    stage = app.award_stage
    if stage == AWARD_CREDITED:
        return "Applied to tuition"
    if stage == AWARD_OFFER_ACCEPTED:
        return "Offer accepted — crediting fees"
    if stage == AWARD_OFFER_SENT:
        return "Offer received — please respond"
    if stage in (AWARD_APPROVED, AWARD_PROPOSED):
        return STUDENT_STATUS_LABELS.get(stage, "Awaiting decision")

    triage = app.triage_queue or "pending_triage"
    if triage == "assigned":
        if app.evaluation_status == "pending_scores":
            return "Committee review in progress"
        if app.evaluation_status == "disputed":
            return "Committee calibration"
        return "Committee review complete"
    if triage == "ready_for_committee":
        return "Ready for committee assignment"
    if triage == "document_verification":
        return "Document verification"
    if triage == "rejection_automated":
        return "Not eligible"
    if str(app.status or "").lower() == "submitted for review":
        return "Submitted — under review"
    return str(app.status or "Under review")


def build_offer_letter(app: StudentScholarshipApplication, program: Optional[ScholarshipProgram]) -> dict:
    amount = float(app.award_amount or 0)
    min_gpa = float(program.min_gpa) if program and program.min_gpa else 3.0
    name = program.title if program else app.scholarship_external_id
    return {
        "title": f"Scholarship Award Offer — {name}",
        "amount_kes": amount,
        "terms": [
            f"Maintain a minimum GPA of {min_gpa:.1f} for renewal consideration.",
            "Enrolment must remain active for the award period.",
            "Award is applied as a tuition credit on your student ledger (not cash disbursement).",
            f"Respond within {OFFER_DEADLINE_BUSINESS_DAYS} business days to accept or decline.",
        ],
        "body": (
            f"Congratulations. You have been selected to receive a scholarship award of "
            f"KES {amount:,.0f} for {name}. "
            f"Please review the terms and accept or decline this offer in your student portal."
        ),
    }


def approve_and_send_offers(
    db: Session,
    applications: list[StudentScholarshipApplication],
    programs: dict[str, ScholarshipProgram],
    approver: User,
    *,
    budget: float,
) -> dict:
    """Stage 6: FAO signs off and sends offers to students within budget."""
    now = datetime.utcnow()
    deadline = _business_days_from(now, OFFER_DEADLINE_BUSINESS_DAYS)
    sent = 0
    skipped = 0

    for app in applications:
        if app.award_stage in (AWARD_OFFER_SENT, AWARD_OFFER_ACCEPTED, AWARD_CREDITED):
            skipped += 1
            continue
        program = programs.get(str(app.scholarship_external_id))
        amount = float(app.award_amount or (program.value_kes if program else 0) or 0)
        app.award_amount = amount
        app.award_stage = AWARD_OFFER_SENT
        app.offer_sent_at = now
        app.offer_deadline = deadline
        app.approved_at = now
        app.approved_by = approver.id
        app.offer_data = build_offer_letter(app, program)
        app.status = "submitted for review"
        sent += 1

    db.commit()
    return {
        "offers_sent": sent,
        "skipped": skipped,
        "offer_deadline": deadline.isoformat(),
        "budget": budget,
    }


def accept_offer(db: Session, app: StudentScholarshipApplication) -> dict:
    if app.award_stage != AWARD_OFFER_SENT:
        raise ValueError("No pending offer for this application")
    if app.offer_deadline and datetime.utcnow() > app.offer_deadline:
        app.award_stage = AWARD_OFFER_EXPIRED
        db.commit()
        raise ValueError("Offer deadline has passed")

    app.award_stage = AWARD_OFFER_ACCEPTED
    app.offer_accepted_at = datetime.utcnow()
    app.offer_data = {**(app.offer_data or {}), "accepted_at": app.offer_accepted_at.isoformat()}
    db.commit()
    return credit_tuition(db, app)


def decline_offer(
    db: Session,
    app: StudentScholarshipApplication,
    *,
    programs: Optional[dict[str, ScholarshipProgram]] = None,
    approver: Optional[User] = None,
) -> dict:
    if app.award_stage != AWARD_OFFER_SENT:
        raise ValueError("No pending offer to decline")
    app.award_stage = AWARD_OFFER_DECLINED
    app.offer_declined_at = datetime.utcnow()
    db.commit()

    runner_up = _next_runner_up(db, app)
    notified = False
    if runner_up and programs is not None:
        now = datetime.utcnow()
        deadline = _business_days_from(now, OFFER_DEADLINE_BUSINESS_DAYS)
        program = programs.get(str(runner_up.scholarship_external_id))
        amount = float(runner_up.award_amount or (program.value_kes if program else 0) or 0)
        runner_up.award_amount = amount
        runner_up.award_stage = AWARD_OFFER_SENT
        runner_up.offer_sent_at = now
        runner_up.offer_deadline = deadline
        runner_up.offer_data = build_offer_letter(runner_up, program)
        if approver:
            runner_up.approved_by = approver.id
        db.commit()
        notified = True
    return {"message": "Offer declined", "runner_up_notified": notified}


def _next_runner_up(
    db: Session,
    declined_app: StudentScholarshipApplication,
    *,
    programs: Optional[dict[str, ScholarshipProgram]] = None,
) -> Optional[StudentScholarshipApplication]:
    """First reconciled application without an active offer, ranked after decliner."""
    from app.evaluation import EVAL_RECONCILED
    from app.triage import QUEUE_ASSIGNED

    rows = (
        db.query(StudentScholarshipApplication)
        .filter(
            StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED,
            StudentScholarshipApplication.evaluation_status == EVAL_RECONCILED,
            StudentScholarshipApplication.consensus_score.isnot(None),
        )
        .order_by(StudentScholarshipApplication.consensus_score.desc())
        .all()
    )
    found_declined = False
    for row in rows:
        if row.id == declined_app.id:
            found_declined = True
            continue
        if not found_declined:
            continue
        if row.award_stage in (None, "", AWARD_PROPOSED, AWARD_OFFER_DECLINED, AWARD_OFFER_EXPIRED):
            return row
    return None


def credit_tuition(db: Session, app: StudentScholarshipApplication) -> dict:
    """Stage 7: Apply scholarship as tuition ledger credit."""
    amount = float(app.award_amount or 0)
    if amount <= 0:
        raise ValueError("Award amount is missing")

    app.award_stage = AWARD_CREDITED
    app.credited_at = datetime.utcnow()
    app.status = "awarded"
    app.offer_data = {
        **(app.offer_data or {}),
        "credited_at": app.credited_at.isoformat(),
        "credit_type": "tuition_ledger",
    }
    db.commit()
    return {
        "message": "Scholarship credited to tuition ledger",
        "amount_kes": amount,
        "student_number": app.student_number,
        "credited_at": app.credited_at.isoformat(),
    }


def expire_stale_offers(db: Session) -> int:
    now = datetime.utcnow()
    rows = (
        db.query(StudentScholarshipApplication)
        .filter(
            StudentScholarshipApplication.award_stage == AWARD_OFFER_SENT,
            StudentScholarshipApplication.offer_deadline < now,
        )
        .all()
    )
    for row in rows:
        row.award_stage = AWARD_OFFER_EXPIRED
    if rows:
        db.commit()
    return len(rows)


def credited_total_for_student(db: Session, student_number: str) -> float:
    rows = (
        db.query(StudentScholarshipApplication)
        .filter(
            StudentScholarshipApplication.student_number == str(student_number),
            StudentScholarshipApplication.award_stage == AWARD_CREDITED,
        )
        .all()
    )
    return sum(float(r.award_amount or 0) for r in rows)
