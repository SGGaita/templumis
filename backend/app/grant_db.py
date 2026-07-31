"""PostgreSQL persistence for student grant applications."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app import grant_lifecycle as lc
from app.models import Student, StudentAdvisor, StudentGrantApplication, User, UserRole
from app.scholarship_catalog import get_grant_program

GRANT_STATUSES = frozenset({
    "draft", "submitted for review", "pending clearance", "compliance review",
    "osp routing", "peer review", "approved", "rejected", "awarded", "active award",
})


def _lifecycle_from_row(row: StudentGrantApplication) -> dict:
    form = row.form_data or {}
    return lc.merge_lifecycle(form.get("lifecycle"))


def _persist_lifecycle(row: StudentGrantApplication, lifecycle: dict) -> None:
    form = dict(row.form_data or {})
    form["lifecycle"] = lifecycle
    row.form_data = form
    row.lifecycle_stage = lifecycle.get("stage_key") or "proposal_budget"
    row.status = lc.status_from_lifecycle(lifecycle)
    budget = lifecycle.get("budget") or {}
    if budget.get("total_requested"):
        row.amount_requested = budget["total_requested"]
    if lifecycle.get("post_award", {}).get("award_amount"):
        row.award_amount = lifecycle["post_award"]["award_amount"]


def app_to_dict(row: StudentGrantApplication, grant_details: Optional[dict] = None) -> dict:
    lifecycle = _lifecycle_from_row(row)
    return {
        "application_id": f"GDB-{row.id}",
        "id": row.id,
        "student_id": row.student_number,
        "grant_id": row.grant_external_id,
        "schol_id": row.grant_external_id,
        "project_title": row.project_title,
        "status": row.status,
        "lifecycle_stage": row.lifecycle_stage or lifecycle.get("stage_key"),
        "lifecycle": lifecycle,
        "lifecycle_summary": lc.lifecycle_summary(lifecycle),
        "applied_date": row.applied_date.isoformat() if row.applied_date else None,
        "amount_requested": float(row.amount_requested) if row.amount_requested is not None else None,
        "award_amount_(kes)": float(row.award_amount) if row.award_amount is not None else None,
        "form_data": row.form_data or {},
        "review_notes": row.review_notes,
        "grant_details": grant_details,
        "source": "database",
    }


def get_application(
    db: Session, student_number: str, grant_external_id: str
) -> Optional[StudentGrantApplication]:
    return (
        db.query(StudentGrantApplication)
        .filter(
            StudentGrantApplication.student_number == str(student_number),
            StudentGrantApplication.grant_external_id == str(grant_external_id),
        )
        .first()
    )


def get_application_by_id(db: Session, application_id: int) -> Optional[StudentGrantApplication]:
    return db.query(StudentGrantApplication).filter(StudentGrantApplication.id == application_id).first()


def get_or_create_draft(
    db: Session,
    student_number: str,
    grant_external_id: str,
    *,
    institution_id: Optional[int] = None,
) -> StudentGrantApplication:
    row = get_application(db, student_number, grant_external_id)
    if row:
        return row
    row = StudentGrantApplication(
        student_number=str(student_number),
        grant_external_id=str(grant_external_id),
        institution_id=institution_id,
        status="draft",
        lifecycle_stage="proposal_budget",
        form_data={"lifecycle": lc.default_lifecycle()},
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def save_proposal_draft(
    db: Session,
    student_number: str,
    grant_external_id: str,
    *,
    project_title: str = "",
    proposal: Optional[dict] = None,
    budget_lines: Optional[list] = None,
    candidate: Optional[dict] = None,
    recruitment: Optional[dict] = None,
    institution_id: Optional[int] = None,
) -> StudentGrantApplication:
    row = get_or_create_draft(db, student_number, grant_external_id, institution_id=institution_id)
    if row.lifecycle_stage not in ("proposal_budget",) and row.status not in ("draft",):
        raise ValueError("Cannot edit proposal after routing has started")

    lifecycle = _lifecycle_from_row(row)
    lifecycle = _apply_pi_program_defaults(db, grant_external_id, lifecycle)
    if project_title:
        row.project_title = project_title
    if proposal:
        lifecycle["proposal"] = {**lifecycle["proposal"], **proposal}
    if candidate:
        lifecycle["candidate"] = {**lifecycle.get("candidate", {}), **candidate}
    if recruitment:
        lifecycle["recruitment"] = {**lifecycle.get("recruitment", {}), **recruitment}
    if budget_lines is not None:
        lifecycle["budget"]["lines"] = budget_lines
        lifecycle["budget"] = lc.calculate_budget(lifecycle["budget"])
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def confirm_pi_sponsorship(
    db: Session,
    application_id: int,
    *,
    confirmed: bool = True,
) -> StudentGrantApplication:
    return respond_pi_sponsorship(db, application_id, confirmed=confirmed)


def _pi_from_grant(db: Session, grant_external_id: str) -> dict:
    program = get_grant_program(db, grant_external_id)
    if not program:
        return {}
    rules = program.eligibility_rules or {}
    return {
        "pi_name": rules.get("pi_name") or "",
        "pi_department": rules.get("pi_department") or "",
        "scope_of_work": rules.get("scope_of_work") or {},
    }


def _apply_pi_program_defaults(db: Session, grant_external_id: str, lifecycle: dict) -> dict:
    if not str(grant_external_id or "").startswith("pi-"):
        return lifecycle
    pi = _pi_from_grant(db, grant_external_id)
    proposal = lifecycle.setdefault("proposal", {})
    if pi.get("pi_name") and not proposal.get("pi_name"):
        proposal["pi_name"] = pi["pi_name"]
    return lifecycle


def _proposal_from_row(row: StudentGrantApplication) -> dict:
    return (_lifecycle_from_row(row).get("proposal") or {})


def _is_pi_grant(row: StudentGrantApplication) -> bool:
    return str(row.grant_external_id or "").startswith("pi-")


def _advised_student_numbers(db: Session, advisor_user_id: int) -> set[str]:
    assignments = (
        db.query(StudentAdvisor)
        .filter(StudentAdvisor.advisor_id == advisor_user_id, StudentAdvisor.is_active == True)  # noqa: E712
        .all()
    )
    if not assignments:
        return set()
    student_ids = [a.student_id for a in assignments]
    students = db.query(Student).filter(Student.id.in_(student_ids)).all()
    return {str(s.student_number) for s in students if s.student_number}


def user_can_access_sponsorship_request(db: Session, user: User, row: StudentGrantApplication) -> bool:
    if not _is_pi_grant(row):
        return False
    proposal = _proposal_from_row(row)
    if not proposal.get("application_submitted") and not proposal.get("pi_email"):
        return False

    program_pi = _pi_from_grant(db, row.grant_external_id)
    pi_email = (proposal.get("pi_email") or "").strip().lower()
    pi_name = (proposal.get("pi_name") or program_pi.get("pi_name") or "").strip()
    if not pi_email and not pi_name:
        return False

    role = user.role if isinstance(user.role, UserRole) else UserRole(str(user.role))
    if role == UserRole.RESEARCH_OFFICE:
        if user.institution_id and row.institution_id and row.institution_id != user.institution_id:
            return False
        return True
    if user.account_category in ("advisor", "sponsor"):
        return True
    if pi_email and pi_email == (user.email or "").strip().lower():
        return True
    advised = _advised_student_numbers(db, user.id)
    return str(row.student_number) in advised


def _sponsorship_status(proposal: dict) -> str:
    if proposal.get("pi_confirmed"):
        return "confirmed"
    if proposal.get("pi_declined"):
        return "declined"
    return "pending"


def list_sponsorship_requests_for_user(
    db: Session,
    user: User,
    *,
    status_filter: Optional[str] = None,
) -> list[StudentGrantApplication]:
    rows = (
        db.query(StudentGrantApplication)
        .filter(StudentGrantApplication.grant_external_id.like("pi-%"))
        .order_by(StudentGrantApplication.updated_at.desc())
        .all()
    )
    result: list[StudentGrantApplication] = []
    for row in rows:
        if not user_can_access_sponsorship_request(db, user, row):
            continue
        proposal = _proposal_from_row(row)
        status = _sponsorship_status(proposal)
        if status_filter and status_filter != "all" and status != status_filter:
            continue
        result.append(row)
    return result


def respond_pi_sponsorship(
    db: Session,
    application_id: int,
    *,
    confirmed: bool = True,
    comments: str = "",
    responder_name: str = "",
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    proposal = lifecycle.setdefault("proposal", {})
    now = datetime.utcnow().isoformat()
    if confirmed:
        proposal["pi_confirmed"] = True
        proposal["pi_confirmed_at"] = now
        proposal["pi_declined"] = False
        proposal["pi_declined_at"] = None
        lifecycle = lc.advance_pi_after_endorsement(lifecycle)
    else:
        proposal["pi_confirmed"] = False
        proposal["pi_confirmed_at"] = None
        proposal["pi_declined"] = True
        proposal["pi_declined_at"] = now
        lifecycle.setdefault("budget", {})["budget_unlocked"] = False
    if comments:
        proposal["pi_response_comments"] = comments
    if responder_name:
        proposal["pi_responder"] = responder_name
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def acknowledge_pi_brief(
    db: Session,
    student_number: str,
    grant_external_id: str,
    *,
    institution_id: Optional[int] = None,
) -> StudentGrantApplication:
    row = get_or_create_draft(db, student_number, grant_external_id, institution_id=institution_id)
    lifecycle = _lifecycle_from_row(row)
    lifecycle = _apply_pi_program_defaults(db, grant_external_id, lifecycle)
    pi_meta = _pi_from_grant(db, grant_external_id)
    pos = (pi_meta.get("scope_of_work") or {}).get("position_type") or "phd"
    lifecycle = lc.acknowledge_pi_brief(lifecycle, position_type=pos)
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def submit_pi_application(
    db: Session,
    student_number: str,
    grant_external_id: str,
    *,
    institution_id: Optional[int] = None,
) -> StudentGrantApplication:
    row = get_or_create_draft(db, student_number, grant_external_id, institution_id=institution_id)
    lifecycle = _lifecycle_from_row(row)
    lifecycle = _apply_pi_program_defaults(db, grant_external_id, lifecycle)
    pi_meta = _pi_from_grant(db, grant_external_id)
    pos = (pi_meta.get("scope_of_work") or {}).get("position_type") or lifecycle.get("recruitment", {}).get("position_type") or "phd"
    lifecycle = lc.submit_pi_application(lifecycle, position_type=pos)
    _persist_lifecycle(row, lifecycle)
    row.status = "submitted for review"
    row.applied_date = date.today()
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def update_compliance_review(
    db: Session,
    application_id: int,
    patch: dict,
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.update_compliance_review(lifecycle, patch)
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def issue_offer(
    db: Session,
    application_id: int,
    *,
    letter_ref: str = "",
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.issue_offer(lifecycle, letter_ref=letter_ref)
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def accept_offer(db: Session, application_id: int, student_number: str) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    if str(row.student_number) != str(student_number):
        raise ValueError("Not your application")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.accept_offer(lifecycle)
    _persist_lifecycle(row, lifecycle)
    row.status = "active award"
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def accept_pi_invite(
    db: Session,
    student_number: str,
    grant_external_id: str,
    *,
    institution_id: Optional[int] = None,
) -> StudentGrantApplication:
    row = get_or_create_draft(db, student_number, grant_external_id, institution_id=institution_id)
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.accept_pi_invite(lifecycle)
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def update_onboarding(
    db: Session,
    application_id: int,
    patch: dict,
) -> StudentGrantApplication:
    """Legacy alias — maps to compliance_review."""
    return update_compliance_review(db, application_id, patch)


def submit_proposal(db: Session, student_number: str, grant_external_id: str) -> StudentGrantApplication:
    row = get_application(db, student_number, grant_external_id)
    if not row:
        raise ValueError("Start a proposal draft before submitting")
    lifecycle = _lifecycle_from_row(row)
    is_pi = _is_pi_grant(row)
    lifecycle = lc.advance_to_compliance(lifecycle, is_pi_grant=is_pi)
    _persist_lifecycle(row, lifecycle)
    row.applied_date = date.today()
    row.progress_pct = 20
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def update_compliance(db: Session, application_id: int, compliance: dict) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle["compliance"] = {**lifecycle["compliance"], **compliance}
    lifecycle["compliance"] = lc.evaluate_compliance(lifecycle["compliance"])
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def submit_compliance(db: Session, application_id: int) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.advance_to_routing(lifecycle)
    _persist_lifecycle(row, lifecycle)
    row.progress_pct = 40
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def routing_signoff(
    db: Session,
    application_id: int,
    role: str,
    *,
    signer: str = "",
    approved: bool = True,
    comments: str = "",
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.sign_routing_step(lifecycle, role, signer=signer, approved=approved, comments=comments)
    _persist_lifecycle(row, lifecycle)
    row.progress_pct = 60 if lifecycle["stage_key"] == "peer_review" else 45
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def submit_peer_review(
    db: Session,
    application_id: int,
    scores: dict,
    *,
    reviewer: str = "",
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.submit_peer_review(lifecycle, scores, reviewer=reviewer)
    _persist_lifecycle(row, lifecycle)
    row.progress_pct = 75
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def setup_post_award(
    db: Session,
    application_id: int,
    *,
    wbs_code: str,
    award_amount: float,
    category_balances: Optional[dict] = None,
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    lifecycle = lc.setup_post_award(
        lifecycle,
        wbs_code=wbs_code,
        award_amount=award_amount,
        category_balances=category_balances or {},
    )
    _persist_lifecycle(row, lifecycle)
    row.progress_pct = 90
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def add_procurement_request(
    db: Session,
    application_id: int,
    request: dict,
) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    pa = lifecycle["post_award"]
    category = str(request.get("category") or "materials")
    amount = float(request.get("amount") or 0)
    balances = dict(pa.get("category_balances") or {})
    available = float(balances.get(category) or 0)
    if amount > available:
        raise ValueError(f"Insufficient {category} balance (KES {available:,.0f} available)")
    balances[category] = available - amount
    pa["category_balances"] = balances
    reqs = list(pa.get("procurement_requests") or [])
    reqs.append({**request, "submitted_at": datetime.utcnow().isoformat(), "status": "approved"})
    pa["procurement_requests"] = reqs
    lifecycle["post_award"] = pa
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def submit_effort_report(db: Session, application_id: int, report: dict) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    reports = list(lifecycle["closeout"].get("effort_reports") or [])
    reports.append({**report, "submitted_at": datetime.utcnow().isoformat()})
    lifecycle["closeout"]["effort_reports"] = reports
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def sign_milestone(db: Session, application_id: int, milestone_id: str) -> StudentGrantApplication:
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    lifecycle = _lifecycle_from_row(row)
    milestones = lifecycle["closeout"]["milestones"]
    for i, m in enumerate(milestones):
        if m["id"] == milestone_id:
            m["status"] = "complete"
            m["pi_signed"] = True
            if i + 1 < len(milestones):
                milestones[i + 1]["status"] = "pending"
            break
    lifecycle["closeout"]["milestones"] = milestones
    _persist_lifecycle(row, lifecycle)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def review_application(
    db: Session,
    application_id: int,
    *,
    status: str,
    award_amount: Optional[float] = None,
    review_notes: Optional[str] = None,
) -> StudentGrantApplication:
    st = str(status or "").strip().lower()
    if st not in GRANT_STATUSES:
        raise ValueError(f"Invalid status: {status}")
    row = get_application_by_id(db, application_id)
    if not row:
        raise ValueError("Application not found")
    row.status = st
    if award_amount is not None:
        row.award_amount = award_amount
    if review_notes is not None:
        row.review_notes = review_notes
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def delete_draft_application(
    db: Session,
    application_id: int,
    student_number: str,
) -> bool:
    """Remove a draft grant application and its uploaded documents."""
    row = get_application_by_id(db, application_id)
    if not row:
        return False
    if str(row.student_number) != str(student_number):
        raise ValueError("Not your application")
    if str(row.status or "").strip().lower() != "draft":
        raise ValueError("Only draft applications can be deleted")
    if str(row.lifecycle_stage or "") != "proposal_budget":
        raise ValueError("Only proposal-stage drafts can be deleted")

    from app import grant_documents as grant_docs

    grant_docs.delete_all_documents(row.student_number, row.grant_external_id)
    db.delete(row)
    db.commit()
    return True


def list_grant_applications(db: Session, student_number: Optional[str] = None) -> list[StudentGrantApplication]:
    q = db.query(StudentGrantApplication).order_by(StudentGrantApplication.updated_at.desc())
    if student_number:
        q = q.filter(StudentGrantApplication.student_number == str(student_number))
    return q.all()
