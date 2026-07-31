"""Stage 4 — Financial Aid administrative triage & blind committee APIs."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app import scholarship_catalog as catalog
from app import scholarship_documents as schol_docs
from app import triage_db
from app.models import (
    ScholarshipReviewAssignment,
    StudentScholarshipApplication,
    User,
)
from app.permissions import assert_financial_aid_officer, assert_staff_portal
from app.routes.scholarship_programs import _load_students_index
from app.reviewer_invites import (
    append_reviewers_to_application,
    notify_reviewer_assignment,
    resolve_or_invite_reviewer,
)
from app.triage import (
    COMMITTEE_ROLES,
    QUEUE_ASSIGNED,
    QUEUE_DOC_VERIFY,
    QUEUE_READY,
    QUEUE_REJECTION_AUTO,
    assign_reviewers,
    build_blind_payload,
    build_eligibility_comparison,
    build_financial_need_summary,
    eligible_assignment_pool,
    ensure_anonymized_ids,
    run_high_pass_filter,
    run_high_pass_single,
)
from app.routes.sis_lms import load_excel_data, sheet_to_dict_list, _compute_credit_statistics

router = APIRouter(prefix="/api/sis-lms/financial-aid/triage", tags=["Financial Aid Triage"])


def _assert_committee_or_fao(user: User, *, blind_only: bool = False) -> None:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if role in ("scholarship_office", "global_admin"):
        return
    if blind_only and role in COMMITTEE_ROLES:
        return
    raise HTTPException(status_code=403, detail="Committee or Financial Aid access required")


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


def _reviewers_payload(db: Session, institution_id: int | None) -> list[dict]:
    reviewers = _active_committee_reviewers(db, institution_id)
    load_counts = _reviewer_assignment_counts(db, [u.id for u in reviewers])
    return [
        {
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "current_assignments": load_counts.get(u.id, 0),
        }
        for u in reviewers
    ]


@router.get("/settings")
def get_triage_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    return {
        **triage_db.config_to_dict(cfg),
        "active_reviewers": _reviewers_payload(db, current_user.institution_id),
    }


@router.patch("/settings")
def update_triage_settings(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id, current_user)
    if "blind_review_enabled" in body:
        cfg.blind_review_enabled = bool(body["blind_review_enabled"])
    if "min_reviewers_per_application" in body:
        cfg.min_reviewers_per_application = max(1, min(5, int(body["min_reviewers_per_application"])))
    if "cycle_year" in body:
        cfg.cycle_year = int(body["cycle_year"])
    if body.get("rotate_salt"):
        from app.config import settings
        import secrets
        cfg.anonymization_salt = secrets.token_hex(16)
    cfg.updated_by = current_user.id
    db.commit()
    db.refresh(cfg)
    return triage_db.config_to_dict(cfg)


def _active_committee_reviewers(db: Session, institution_id: int | None) -> list[User]:
    q = db.query(User).filter(User.is_active == True)  # noqa: E712
    if institution_id:
        q = q.filter((User.institution_id == institution_id) | (User.institution_id.is_(None)))
    rows = q.order_by(User.full_name).all()
    seen: set[int] = set()
    out: list[User] = []
    for u in rows:
        if u.id in seen:
            continue
        role = u.role.value if hasattr(u.role, "value") else str(u.role)
        if role in COMMITTEE_ROLES:
            seen.add(u.id)
            out.append(u)
    return out


def _reviewer_assignment_counts(db: Session, reviewer_ids: list[int]) -> dict[int, int]:
    if not reviewer_ids:
        return {}
    rows = (
        db.query(ScholarshipReviewAssignment.reviewer_user_id)
        .filter(ScholarshipReviewAssignment.reviewer_user_id.in_(reviewer_ids))
        .all()
    )
    counts: dict[int, int] = {}
    for (uid,) in rows:
        counts[uid] = counts.get(uid, 0) + 1
    return counts


@router.get("/queues")
def list_triage_queues(
    queue: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    q = db.query(StudentScholarshipApplication).options(
        joinedload(StudentScholarshipApplication.review_assignments)
    )
    rows = q.order_by(StudentScholarshipApplication.updated_at.desc()).all()

    programs = catalog.programs_lookup(db, include_admin=True)
    students = _load_students_index()

    ensure_anonymized_ids(db, rows, cfg.cycle_year, cfg.anonymization_salt)

    counts = {
        "pending_triage": 0,
        "rejection_automated": 0,
        "document_verification": 0,
        "ready_for_committee": 0,
        "assigned": 0,
        "other": 0,
    }
    items = []

    for row in rows:
        st = str(row.status or "").lower()
        if st == "draft":
            continue
        key = row.triage_queue or "pending_triage"
        counts[key] = counts.get(key, 0) + 1
        if queue and key != queue:
            continue

        schol = programs.get(str(row.scholarship_external_id)) or {}
        student = students.get(str(row.student_number)) or {}
        name = student.get("full_name") or row.student_number

        items.append(
            {
                "id": row.id,
                "anonymized_id": row.anonymized_id,
                "student_number": row.student_number,
                "student_name": name,
                "scholarship_name": schol.get("scholarship_name") or row.scholarship_external_id,
                "status": row.status,
                "triage_queue": key,
                "auto_reject_reason": row.auto_reject_reason,
                "documents_verified": row.documents_verified,
                "need_index": row.need_index,
                "applied_date": row.applied_date.isoformat() if row.applied_date else None,
                "reviewer_count": len(row.review_assignments or []),
                "program_type": schol.get("type"),
            }
        )

    return {"counts": counts, "applications": items, "settings": triage_db.config_to_dict(cfg)}


@router.post("/run-high-pass")
def run_high_pass(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    programs = catalog.programs_lookup(db, include_admin=True)
    students = _load_students_index()

    rows = db.query(StudentScholarshipApplication).all()
    stats_map = {sid: _load_student_stats(sid) for sid in {r.student_number for r in rows}}

    ensure_anonymized_ids(db, rows, cfg.cycle_year, cfg.anonymization_salt)
    result = run_high_pass_filter(db, rows, programs, students, stats_map)
    return {"message": "High-pass filter completed", **result}


@router.post("/applications/{application_id}/run-high-pass")
def run_high_pass_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Screen a single pending application."""
    assert_financial_aid_officer(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    row = (
        db.query(StudentScholarshipApplication)
        .filter(StudentScholarshipApplication.id == application_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    programs = catalog.programs_lookup(db, include_admin=True)
    students = _load_students_index()
    stats_map = {str(row.student_number): _load_student_stats(str(row.student_number))}
    ensure_anonymized_ids(db, [row], cfg.cycle_year, cfg.anonymization_salt)
    result = run_high_pass_single(db, row, programs, students, stats_map)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Application screened", **result}


@router.get("/assignment-preview")
def assignment_preview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Counts and reviewer list before running bulk assignment."""
    assert_financial_aid_officer(current_user)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    rows = db.query(StudentScholarshipApplication).all()
    pool = eligible_assignment_pool(rows)
    reviewers = _reviewers_payload(db, current_user.institution_id)
    min_r = int(cfg.min_reviewers_per_application or 2)
    return {
        "pool_size": len(pool),
        "ready_for_committee": sum(1 for r in rows if r.triage_queue == QUEUE_READY),
        "doc_verified_ready": sum(
            1 for r in rows if r.triage_queue == QUEUE_DOC_VERIFY and r.documents_verified
        ),
        "min_reviewers_per_application": min_r,
        "reviewers": reviewers,
        "can_assign": len(pool) > 0 and len(reviewers) >= min_r,
        "hint": (
            "Certify documents on need-based applications, or run high-pass filter first."
            if not pool
            else f"Each application will be assigned to {min_r} reviewer(s) from your selection."
        ),
    }


@router.post("/assign-reviewers")
def run_assign_reviewers(
    body: dict | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    body = body or {}
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    all_reviewers = _active_committee_reviewers(db, current_user.institution_id)
    reviewer_ids = body.get("reviewer_ids")
    if reviewer_ids is not None:
        id_set = {int(x) for x in reviewer_ids}
        reviewers = [r for r in all_reviewers if r.id in id_set]
    else:
        reviewers = all_reviewers

    min_per = int(body.get("min_reviewers_per_application") or cfg.min_reviewers_per_application or 2)
    if len(reviewers) < min_per:
        raise HTTPException(
            status_code=400,
            detail=f"Select at least {min_per} reviewer(s), or lower “reviewers per application” in settings.",
        )

    rows = db.query(StudentScholarshipApplication).options(
        joinedload(StudentScholarshipApplication.review_assignments)
    ).all()
    app_ids = body.get("application_ids")
    result = assign_reviewers(
        db,
        rows,
        reviewers,
        min_per,
        application_ids=app_ids,
    )
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Reviewers assigned successfully", **result}


def _resolve_invite_reviewers(
    db: Session,
    invite_emails: list,
    *,
    institution_id: int | None,
    invited_by: User,
) -> tuple[list[User], list[dict]]:
    reviewers: list[User] = []
    invite_results: list[dict] = []
    for entry in invite_emails:
        if isinstance(entry, str):
            email, full_name = entry, None
        else:
            email = entry.get("email") or entry.get("address")
            full_name = entry.get("full_name") or entry.get("name")
        try:
            user, is_new = resolve_or_invite_reviewer(
                db,
                email=email,
                full_name=full_name,
                institution_id=institution_id,
                invited_by=invited_by,
            )
            reviewers.append(user)
            invite_results.append({"email": user.email, "is_new": is_new, "reviewer_id": user.id})
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    return reviewers, invite_results


@router.post("/applications/{application_id}/assign-reviewers")
def assign_reviewers_single_application(
    application_id: int,
    body: dict | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assign selected or invited reviewers to one application."""
    assert_financial_aid_officer(current_user)
    body = body or {}
    all_reviewers = _active_committee_reviewers(db, current_user.institution_id)
    reviewer_ids = body.get("reviewer_ids") or []
    invite_emails = body.get("invite_emails") or []

    if not reviewer_ids and not invite_emails:
        raise HTTPException(status_code=400, detail="Select at least one reviewer or invite by email")

    id_set = {int(x) for x in reviewer_ids}
    reviewers = [r for r in all_reviewers if r.id in id_set]
    if reviewer_ids and not reviewers:
        raise HTTPException(status_code=400, detail="Invalid reviewer selection")

    invited_reviewers, invite_results = _resolve_invite_reviewers(
        db,
        invite_emails,
        institution_id=current_user.institution_id,
        invited_by=current_user,
    )
    reviewers.extend(invited_reviewers)

    row = (
        db.query(StudentScholarshipApplication)
        .options(joinedload(StudentScholarshipApplication.review_assignments))
        .filter(StudentScholarshipApplication.id == application_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    pool = eligible_assignment_pool([row])
    if row.id not in {a.id for a in pool}:
        raise HTTPException(
            status_code=400,
            detail="Application is not in the ready pool (certify documents or run high-pass first).",
        )

    programs = catalog.programs_lookup(db, include_admin=True)
    schol = programs.get(str(row.scholarship_external_id)) or {}
    scholarship_name = schol.get("scholarship_name") or row.scholarship_external_id

    created = append_reviewers_to_application(db, row, reviewers)
    db.commit()

    emails_sent = 0
    is_new_by_id = {r["reviewer_id"]: r["is_new"] for r in invite_results}
    for assignment in created:
        reviewer = next((r for r in reviewers if r.id == assignment.reviewer_user_id), None)
        if not reviewer:
            continue
        is_new = is_new_by_id.get(reviewer.id, False)
        if notify_reviewer_assignment(
            reviewer=reviewer,
            application=row,
            assignment=assignment,
            scholarship_name=scholarship_name,
            invited_by_name=current_user.full_name,
            is_new_account=is_new,
        ):
            emails_sent += 1

    return {
        "message": "Reviewers assigned",
        "assigned_reviewers": len(created),
        "emails_sent": emails_sent,
        "invites": invite_results,
        "triage_queue": row.triage_queue,
    }


@router.patch("/applications/{application_id}/verify-documents")
def certify_documents(
    application_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    row = db.query(StudentScholarshipApplication).filter(StudentScholarshipApplication.id == application_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    verified = bool(body.get("verified", True))
    row.documents_verified = verified
    row.documents_verified_by = current_user.id if verified else None
    from datetime import datetime
    row.documents_verified_at = datetime.utcnow() if verified else None
    if verified and row.triage_queue == QUEUE_DOC_VERIFY:
        row.triage_queue = QUEUE_READY
    if body.get("notes"):
        row.triage_notes = str(body["notes"])
    db.commit()
    return {"id": row.id, "documents_verified": row.documents_verified, "triage_queue": row.triage_queue}


def _can_preview_application_documents(user: User, db: Session, application_id: int) -> bool:
    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    if role in ("scholarship_office", "global_admin"):
        return True
    if role in COMMITTEE_ROLES:
        return (
            db.query(ScholarshipReviewAssignment)
            .filter(
                ScholarshipReviewAssignment.application_id == application_id,
                ScholarshipReviewAssignment.reviewer_user_id == user.id,
            )
            .first()
            is not None
        )
    return False


@router.get("/applications/{application_id}/documents/{storage_key}")
def preview_application_document(
    application_id: int,
    storage_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream supporting document for FAO or assigned reviewer preview."""
    assert_staff_portal(current_user)
    if not _can_preview_application_documents(current_user, db, application_id):
        raise HTTPException(status_code=403, detail="Not authorized to preview this document")
    row = db.query(StudentScholarshipApplication).filter(StudentScholarshipApplication.id == application_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    docs = (row.form_data or {}).get("supporting_documents") or []
    meta = next((d for d in docs if d.get("storage_key") == storage_key), None)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found on application")

    path = schol_docs.resolve_document(row.student_number, row.scholarship_external_id, storage_key)
    if not path:
        raise HTTPException(
            status_code=404,
            detail="File not stored on server — ask the student to re-upload the document",
        )

    name = meta.get("name") or path.name
    mime = meta.get("mime") or "application/octet-stream"
    return FileResponse(
        path,
        media_type=mime,
        filename=name,
        headers={"Content-Disposition": f'inline; filename="{name}"'},
    )


@router.get("/applications/{application_id}")
def get_application_admin(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    return _application_detail(db, application_id, include_mapping=True)


@router.get("/applications/{application_id}/blind")
def get_application_blind(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_committee_or_fao(current_user, blind_only=True)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    if not cfg.blind_review_enabled:
        role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role not in ("scholarship_office", "global_admin"):
            raise HTTPException(status_code=403, detail="Blind review is disabled")
    include_mapping = (current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)) in (
        "scholarship_office",
        "global_admin",
    )
    return _application_detail(db, application_id, include_mapping=include_mapping, blind=True)


@router.get("/committee/queue")
def committee_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Blind list for assigned committee reviewers."""
    _assert_committee_or_fao(current_user, blind_only=True)
    cfg = triage_db.get_or_create_config(db, current_user.institution_id)
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    is_fao = role in ("scholarship_office", "global_admin")

    q = db.query(StudentScholarshipApplication).filter(
        StudentScholarshipApplication.triage_queue == QUEUE_ASSIGNED
    )
    if not is_fao:
        q = q.join(ScholarshipReviewAssignment).filter(
            ScholarshipReviewAssignment.reviewer_user_id == current_user.id
        )

    rows = q.order_by(StudentScholarshipApplication.updated_at.desc()).all()
    programs = catalog.programs_lookup(db, include_admin=True)
    students = _load_students_index()
    ensure_anonymized_ids(db, rows, cfg.cycle_year, cfg.anonymization_salt)

    out = []
    for row in rows:
        student = students.get(str(row.student_number)) or {}
        stats = _load_student_stats(str(row.student_number))
        program = programs.get(str(row.scholarship_external_id)) or {}
        out.append(
            build_blind_payload(row, program, student, stats, include_mapping=False)
        )
    return {"applications": out, "blind_review_enabled": cfg.blind_review_enabled}


def _application_detail(
    db: Session,
    application_id: int,
    *,
    include_mapping: bool = False,
    blind: bool = False,
) -> dict:
    row = (
        db.query(StudentScholarshipApplication)
        .options(joinedload(StudentScholarshipApplication.review_assignments))
        .filter(StudentScholarshipApplication.id == application_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")

    programs = catalog.programs_lookup(db, include_admin=True)
    program = programs.get(str(row.scholarship_external_id)) or {}
    students = _load_students_index()
    student = students.get(str(row.student_number)) or {}
    stats = _load_student_stats(str(row.student_number))

    cfg = triage_db.get_or_create_config(db, row.institution_id)
    if not row.anonymized_id:
        ensure_anonymized_ids(db, [row], cfg.cycle_year, cfg.anonymization_salt)

    payload = build_blind_payload(
        row, program, student, stats, include_mapping=include_mapping, blind=blind
    )

    reviewers = []
    if row.review_assignments:
        user_ids = [a.reviewer_user_id for a in row.review_assignments]
        users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
        for a in sorted(row.review_assignments, key=lambda x: x.assignment_slot):
            u = users.get(a.reviewer_user_id)
            reviewers.append(
                {
                    "slot": a.assignment_slot,
                    "reviewer_id": a.reviewer_user_id,
                    "reviewer_name": u.full_name if u else "—",
                    "status": a.status,
                }
            )

    if blind:
        return payload

    form_data = row.form_data or {}
    eligibility_comparison = build_eligibility_comparison(
        student, stats, program, form_data
    )
    financial_need_summary = build_financial_need_summary(row, program, form_data, student)

    return {
        **payload,
        "form_data": form_data,
        "references_count": len(row.references_data or []),
        "auto_reject_reason": row.auto_reject_reason,
        "triage_notes": row.triage_notes,
        "eligibility_snapshot": row.eligibility_snapshot,
        "eligibility_comparison": eligibility_comparison,
        "financial_need_summary": financial_need_summary,
        "reviewers": reviewers,
        "supporting_documents": [
            {
                **doc,
                "previewable": schol_docs.previewable(doc.get("storage_key")),
                "index": idx,
            }
            for idx, doc in enumerate(form_data.get("supporting_documents") or [])
        ],
    }
