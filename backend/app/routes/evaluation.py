"""Stage 5 — Committee scoring, consensus disputes, and stack ranking."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app import scholarship_catalog as catalog
from app import triage_db
from app.evaluation import (
    EVAL_DISPUTED,
    EVAL_PENDING,
    EVAL_RECONCILED,
    assignment_is_scored,
    build_stack_ranking,
    composite_score,
    compute_recommended_awards,
    get_rubric_weights,
    proposed_award,
    refresh_application_evaluation,
    variance_threshold,
)
from app.models import ScholarshipProgram, ScholarshipReviewAssignment, StudentScholarshipApplication, User
from app.permissions import (
    SCHOLARSHIP_COMMITTEE_ROLES,
    assert_financial_aid_officer,
    assert_reviewer_portal,
    assert_staff_portal,
)
from app.routes.scholarship_programs import _load_students_index
from app.routes.sis_lms import _compute_credit_statistics, load_excel_data, sheet_to_dict_list
from app.triage import (
    QUEUE_ASSIGNED,
    build_blind_payload,
    build_financial_need_summary,
    ensure_anonymized_ids,
    is_need_based_program,
)

def _user_is_assigned_reviewer(db: Session, user_id: int, application_id: int) -> bool:
    return (
        db.query(ScholarshipReviewAssignment)
        .filter(
            ScholarshipReviewAssignment.application_id == application_id,
            ScholarshipReviewAssignment.reviewer_user_id == user_id,
        )
        .first()
        is not None
    )

router = APIRouter(prefix="/api/sis-lms/financial-aid/evaluation", tags=["Scholarship Evaluation"])

DECISION_ROLES = frozenset({"scholarship_office", "global_admin", "vice_chancellor", "institution_admin"})


def _role(user: User) -> str:
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def _assert_committee(user: User) -> None:
    role = _role(user)
    if role == "scholarship_reviewer":
        assert_reviewer_portal(user)
        return
    assert_staff_portal(user)
    staff_committee = {r.value for r in SCHOLARSHIP_COMMITTEE_ROLES} - {"scholarship_reviewer"}
    if role not in staff_committee:
        raise HTTPException(status_code=403, detail="Committee access required")


def _assert_decision_maker(user: User) -> None:
    assert_staff_portal(user)
    if _role(user) not in DECISION_ROLES:
        raise HTTPException(status_code=403, detail="Decision-maker access required")


def _load_student_stats(student_id: str) -> dict:
    try:
        wb = load_excel_data()
        students = sheet_to_dict_list(wb["Students"])
        student = next((s for s in students if s.get("student_id") == student_id), None)
        if not student:
            wb.close()
            return {}
        enrollments = [e for e in sheet_to_dict_list(wb["Enrolments"]) if e.get("student_id") == student_id]
        grades = [g for g in sheet_to_dict_list(wb["Grades"]) if g.get("student_id") == student_id]
        courses_dict = {c["course_code"]: c for c in sheet_to_dict_list(wb["Courses"]) if c.get("course_code")}
        for e in enrollments:
            e["course_details"] = courses_dict.get(e.get("course_code"), {})
        stats = _compute_credit_statistics(student, enrollments, grades, courses_dict)
        wb.close()
        return stats
    except Exception:
        return {}


def _evaluation_settings(cfg) -> dict:
    return {
        "variance_threshold": float(cfg.variance_threshold or 1.25),
        "weight_academic": float(cfg.weight_academic or 0.34),
        "weight_need": float(cfg.weight_need or 0.33),
        "weight_lead": float(cfg.weight_lead or 0.33),
        "award_budget_pool": float(cfg.award_budget_pool) if cfg.award_budget_pool is not None else None,
    }


def _programs_by_external_id(db: Session) -> dict[str, ScholarshipProgram]:
    rows = db.query(ScholarshipProgram).filter(ScholarshipProgram.program_kind == "scholarship").all()
    return {str(r.external_id): r for r in rows}


@router.get("/settings")
def get_evaluation_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_decision_maker(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    return _evaluation_settings(cfg)


@router.patch("/settings")
def update_evaluation_settings(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    if "variance_threshold" in body:
        cfg.variance_threshold = float(body["variance_threshold"])
    for key in ("weight_academic", "weight_need", "weight_lead"):
        if key in body:
            setattr(cfg, key, float(body[key]))
    if "award_budget_pool" in body:
        val = body["award_budget_pool"]
        cfg.award_budget_pool = float(val) if val is not None else None
    cfg.updated_by = current_user.id
    db.commit()
    return _evaluation_settings(cfg)


@router.get("/reviewer-dashboard")
def reviewer_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Overview stats for scholarship reviewer accounts."""
    assert_reviewer_portal(current_user)
    rows = (
        db.query(ScholarshipReviewAssignment)
        .filter(ScholarshipReviewAssignment.reviewer_user_id == current_user.id)
        .all()
    )
    pending = [r for r in rows if not assignment_is_scored(r)]
    completed = [r for r in rows if assignment_is_scored(r)]
    composites = [float(r.composite_score) for r in completed if r.composite_score is not None]
    avg_score = round(sum(composites) / len(composites), 2) if composites else None
    return {
        "pending_count": len(pending),
        "completed_count": len(completed),
        "total_reviews": len(rows),
        "average_composite": avg_score,
    }


@router.get("/my-assignments")
def my_scoring_queue(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Committee members score applications assigned to them."""
    _assert_committee(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    programs_api = catalog.programs_lookup(db, include_admin=True)
    programs_db = _programs_by_external_id(db)
    students = _load_students_index()

    rows = (
        db.query(ScholarshipReviewAssignment)
        .options(joinedload(ScholarshipReviewAssignment.application))
        .join(
            StudentScholarshipApplication,
            ScholarshipReviewAssignment.application_id == StudentScholarshipApplication.id,
        )
        .filter(
            ScholarshipReviewAssignment.reviewer_user_id == current_user.id,
            StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED,
        )
        .order_by(StudentScholarshipApplication.updated_at.desc())
        .all()
    )

    apps = [r.application for r in rows if r.application]
    ensure_anonymized_ids(db, apps, cfg.cycle_year, cfg.anonymization_salt)

    out = []
    for assignment in rows:
        scored = assignment_is_scored(assignment)
        if status == "pending" and scored:
            continue
        if status == "completed" and not scored:
            continue

        app = assignment.application
        if not app:
            continue
        program_api = programs_api.get(str(app.scholarship_external_id)) or {}
        program_db = programs_db.get(str(app.scholarship_external_id))
        student = students.get(str(app.student_number)) or {}
        stats = _load_student_stats(str(app.student_number))
        payload = build_blind_payload(
            app, program_api, student, stats, include_mapping=True, blind=False
        )
        weights = get_rubric_weights(program_db, cfg)
        form_data = app.form_data or {}
        financial_need = (
            build_financial_need_summary(app, program_api, form_data, student)
            if is_need_based_program(program_api)
            else None
        )
        out.append(
            {
                **payload,
                "assignment_id": assignment.id,
                "rubric_weights": weights,
                "financial_need_summary": financial_need,
                "my_scores": {
                    "academic": assignment.score_academic,
                    "need": assignment.score_need,
                    "lead": assignment.score_lead,
                    "composite": float(assignment.composite_score) if assignment.composite_score else None,
                    "submitted": assignment_is_scored(assignment),
                },
                "evaluation_status": app.evaluation_status or EVAL_PENDING,
                "consensus_score": float(app.consensus_score) if app.consensus_score else None,
            }
        )
    return {
        "assignments": out,
        "variance_threshold": variance_threshold(cfg),
    }


@router.get("/applications/{application_id}")
def get_review_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full application detail for an assigned committee reviewer."""
    _assert_committee(current_user)
    if not _user_is_assigned_reviewer(db, current_user.id, application_id):
        raise HTTPException(status_code=403, detail="You are not assigned to review this application")

    from app.routes.triage import _application_detail

    return _application_detail(db, application_id, include_mapping=True, blind=False)


def _parse_rubric_score(raw, field: str) -> int:
    if raw is None or raw == "":
        raise HTTPException(status_code=400, detail=f"Missing score: {field}")
    try:
        val = int(round(float(raw)))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail=f"{field.replace('_', ' ').title()} must be a whole number from 1 to 5",
        )
    if val < 1 or val > 5:
        raise HTTPException(
            status_code=400,
            detail=f"{field.replace('_', ' ').title()} must be between 1 and 5 (received {val})",
        )
    return val


@router.post("/assignments/{assignment_id}/scores")
def submit_scores(
    assignment_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_committee(current_user)
    assignment = (
        db.query(ScholarshipReviewAssignment)
        .options(joinedload(ScholarshipReviewAssignment.application))
        .filter(ScholarshipReviewAssignment.id == assignment_id)
        .first()
    )
    if not assignment or assignment.reviewer_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")

    scores = {
        key: _parse_rubric_score(body.get(key), key)
        for key in ("academic", "need", "lead")
    }

    assignment.score_academic = scores["academic"]
    assignment.score_need = scores["need"]
    assignment.score_lead = scores["lead"]
    assignment.scored_at = datetime.utcnow()

    app = assignment.application
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    program = (
        db.query(ScholarshipProgram)
        .filter(ScholarshipProgram.external_id == app.scholarship_external_id)
        .first()
    )
    weights = get_rubric_weights(program, cfg)
    assignment.composite_score = composite_score(scores, weights)
    assignment.status = "scored"

    result = refresh_application_evaluation(db, app, program, cfg)
    return {
        "message": "Scores saved",
        "composite_score": float(assignment.composite_score),
        **result,
    }


@router.get("/disputes")
def list_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_decision_maker(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    programs = catalog.programs_lookup(db, include_admin=True)

    rows = (
        db.query(StudentScholarshipApplication)
        .options(joinedload(StudentScholarshipApplication.review_assignments))
        .filter(
            StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED,
            StudentScholarshipApplication.evaluation_status == EVAL_DISPUTED,
        )
        .all()
    )

    user_ids = set()
    for row in rows:
        for a in row.review_assignments or []:
            user_ids.add(a.reviewer_user_id)
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}

    items = []
    for row in rows:
        schol = programs.get(str(row.scholarship_external_id)) or {}
        reviewer_scores = []
        for a in sorted(row.review_assignments or [], key=lambda x: x.assignment_slot):
            u = users.get(a.reviewer_user_id)
            reviewer_scores.append(
                {
                    "reviewer_name": u.full_name if u else "Reviewer",
                    "composite": float(a.composite_score) if a.composite_score else None,
                    "academic": a.score_academic,
                    "need": a.score_need,
                    "lead": a.score_lead,
                }
            )
        items.append(
            {
                "application_id": row.id,
                "anonymized_id": row.anonymized_id,
                "scholarship_name": schol.get("scholarship_name") or row.scholarship_external_id,
                "consensus_score": float(row.consensus_score) if row.consensus_score else None,
                "score_std_dev": float(row.score_std_dev) if row.score_std_dev else None,
                "variance_threshold": variance_threshold(cfg),
                "reviewer_scores": reviewer_scores,
            }
        )
    return {"disputes": items, "count": len(items)}


@router.post("/applications/{application_id}/resolve")
def resolve_dispute(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    row = db.query(StudentScholarshipApplication).filter(StudentScholarshipApplication.id == application_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    row.evaluation_status = EVAL_RECONCILED
    db.commit()
    return {"message": "Application approved for ranking", "evaluation_status": EVAL_RECONCILED}


@router.patch("/applications/{application_id}/proposed-award")
def update_proposed_award(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """FAO manually sets the proposed award for one application before offers go out."""
    _assert_decision_maker(current_user)
    row = db.query(StudentScholarshipApplication).filter(StudentScholarshipApplication.id == application_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    if row.award_stage in ("offer_sent", "offer_accepted", "credited"):
        raise HTTPException(status_code=400, detail="Award already sent or credited")

    amount = body.get("award_amount")
    if amount is None:
        raise HTTPException(status_code=400, detail="award_amount is required")
    amount = float(amount)
    if amount < 0:
        raise HTTPException(status_code=400, detail="Award amount cannot be negative")

    program = (
        db.query(ScholarshipProgram)
        .filter(ScholarshipProgram.external_id == str(row.scholarship_external_id))
        .first()
    )
    ceiling = proposed_award(program)
    if ceiling > 0 and amount > ceiling:
        raise HTTPException(
            status_code=400,
            detail=f"Amount cannot exceed scholarship maximum ({ceiling:,.0f} KES)",
        )

    row.award_amount = amount
    row.offer_data = {**(row.offer_data or {}), "manual_award_override": True}
    row.award_stage = row.award_stage or "proposed"
    db.commit()
    return {"application_id": row.id, "proposed_award": amount, "manual_override": True}


@router.post("/apply-recommended-awards")
def apply_recommended_awards(
    body: dict = Body(default={}),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist formula-based award amounts for all reconciled applications."""
    _assert_decision_maker(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    programs_db = _programs_by_external_id(db)
    budget = body.get("budget")
    if budget is None:
        budget = float(cfg.award_budget_pool or 100000)
    else:
        budget = float(budget)

    rows = (
        db.query(StudentScholarshipApplication)
        .filter(
            StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED,
            StudentScholarshipApplication.evaluation_status == EVAL_RECONCILED,
        )
        .all()
    )
    recommended = compute_recommended_awards(rows, programs_db, budget=budget)
    updated = 0
    for row in rows:
        if row.award_stage in ("offer_sent", "offer_accepted", "credited"):
            continue
        amount = recommended.get(row.id, 0)
        row.award_amount = amount
        row.award_stage = row.award_stage or "proposed"
        row.offer_data = {k: v for k, v in (row.offer_data or {}).items() if k != "manual_award_override"}
        updated += 1
    db.commit()
    return {"message": f"Applied recommended awards to {updated} application(s)", "updated": updated}


@router.get("/stack-ranking")
def stack_ranking(
    budget: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_decision_maker(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    programs_db = _programs_by_external_id(db)

    if budget is None:
        if cfg.award_budget_pool is not None:
            budget = float(cfg.award_budget_pool)
        else:
            budget = sum(float(p.budget_total_allocated or 0) for p in programs_db.values()) or 100000.0

    rows = (
        db.query(StudentScholarshipApplication)
        .filter(StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED)
        .all()
    )
    result = build_stack_ranking(rows, programs_db, budget=budget)
    result["pending_scores"] = sum(1 for r in rows if (r.evaluation_status or EVAL_PENDING) == EVAL_PENDING)
    result["disputed_count"] = sum(1 for r in rows if r.evaluation_status == EVAL_DISPUTED)
    return result
