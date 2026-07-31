"""Financial Aid Officer dashboard and grant staff APIs."""

from typing import Optional

from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app import scholarship_catalog as catalog
from app import grant_db
from app import grant_documents as grant_docs
from app.models import ScholarshipProgram, StudentGrantApplication, StudentScholarshipApplication, User
from app.permissions import assert_financial_aid_officer, assert_grant_application_view, assert_staff_portal
from app.routes.scholarship_programs import _load_students_index

router = APIRouter(prefix="/api/sis-lms/financial-aid", tags=["Financial Aid"])


def _map_application_status(raw: str) -> str:
    st_lower = str(raw or "").lower()
    if st_lower in ("awarded", "approved", "active award"):
        return "active"
    if st_lower in (
        "submitted for review", "under review", "pending", "pending clearance",
        "compliance review", "osp routing", "peer review",
    ):
        return "pending"
    if st_lower == "rejected":
        return "suspended"
    if st_lower == "draft":
        return "draft"
    return "pending"


def _assert_grant_owner(row: StudentGrantApplication, student_id: str) -> None:
    if str(row.student_number) != str(student_id):
        raise HTTPException(status_code=403, detail="Not your application")


def _require_student(current_user: User, db: Session) -> str:
    from app.account_category import sync_account_category

    sync_account_category(current_user, db)
    if current_user.account_category != "student":
        raise HTTPException(status_code=403, detail="Students only")
    student_id = current_user.student_registration_number
    if not student_id:
        raise HTTPException(status_code=400, detail="No student registration number")
    return student_id

grants_router = APIRouter(prefix="/api/sis-lms/grants", tags=["Grants"])


@router.get("/dashboard")
def financial_aid_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)

    schol_apps = db.query(StudentScholarshipApplication).all()
    grant_apps = db.query(StudentGrantApplication).all()
    schol_programs = (
        db.query(ScholarshipProgram).filter(ScholarshipProgram.program_kind == "scholarship").all()
    )
    grant_programs = (
        db.query(ScholarshipProgram).filter(ScholarshipProgram.program_kind == "grant").all()
    )

    def _pending(rows):
        return sum(
            1
            for r in rows
            if str(r.status).lower() in ("submitted for review", "pending", "under review")
        )

    def _awarded(rows):
        return sum(1 for r in rows if str(r.status).lower() in ("awarded", "approved"))

    triage_counts = {
        "pending_triage": 0,
        "rejection_automated": 0,
        "document_verification": 0,
        "ready_for_committee": 0,
        "assigned": 0,
    }
    for row in schol_apps:
        q = row.triage_queue or "pending_triage"
        if q in triage_counts:
            triage_counts[q] += 1

    return {
        "scholarships": {
            "opportunities_total": len(schol_programs),
            "opportunities_published": sum(1 for p in schol_programs if p.workflow_status == "published"),
            "applications_total": len(schol_apps),
            "applications_pending": _pending(schol_apps),
            "applications_awarded": _awarded(schol_apps),
            "triage": triage_counts,
        },
        "grants": {
            "opportunities_total": len(grant_programs),
            "opportunities_published": sum(1 for p in grant_programs if p.workflow_status == "published"),
            "applications_total": len(grant_apps),
            "applications_pending": _pending(grant_apps),
            "applications_approved": _awarded(grant_apps),
        },
    }


@grants_router.get("/programs")
def list_grant_programs(
    admin: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    catalog.ensure_pi_grants_seeded(db)
    if admin:
        assert_financial_aid_officer(current_user)
        return catalog.load_programs(db, program_kind="grant", include_admin=True)
    return catalog.load_programs(db, program_kind="grant", published_only=True)


@grants_router.get("/applications/staff")
async def list_grant_applications_staff(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_grant_application_view(current_user)
    rows = grant_db.list_grant_applications(db)
    programs = catalog.programs_lookup(db, program_kind="grant", include_admin=True)
    students = _load_students_index()

    applications = []
    for row in rows:
        grant = programs.get(str(row.grant_external_id)) or {}
        student = students.get(str(row.student_number)) or {}
        name = (
            student.get("full_name")
            or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
            or row.student_number
        )
        app_dict = grant_db.app_to_dict(row, grant)
        entry = {
            **app_dict,
            "id": row.id,
            "form_data": app_dict.get("form_data") or row.form_data or {},
            "recipient": name,
            "student_name": name,
            "program": student.get("program") or student.get("major") or "—",
            "grant_name": grant.get("scholarship_name") or row.grant_external_id,
            "scholarship_name": grant.get("scholarship_name") or row.grant_external_id,
            "lifecycle_stage": row.lifecycle_stage,
            "lifecycle": app_dict.get("lifecycle"),
            "lifecycle_summary": app_dict.get("lifecycle_summary"),
            "type": grant.get("type") or "—",
            "amount": float(row.amount_requested or grant.get("amount_(kes)") or 0),
            "applied": row.applied_date.isoformat() if row.applied_date else None,
            "status": _map_application_status(str(row.status)),
        }
        if search:
            blob = " ".join(
                str(x).lower()
                for x in [name, row.student_number, entry["grant_name"], row.status, entry.get("project_title")]
            )
            if search.lower() not in blob:
                continue
        applications.append(entry)

    total = len(applications)
    page = applications[skip : skip + limit]
    status_counts = {"active": 0, "pending": 0, "draft": 0, "suspended": 0}
    for a in applications:
        status_counts[a.get("status", "pending")] = status_counts.get(a.get("status", "pending"), 0) + 1

    published = catalog.load_programs(db, program_kind="grant", published_only=True)
    return {
        "applications": page,
        "total": total,
        "skip": skip,
        "limit": limit,
        "stats": {
            "total_applications": total,
            "active_recipients": status_counts.get("active", 0),
            "pending_review": status_counts.get("pending", 0),
            "drafts": status_counts.get("draft", 0),
            "published_programs": len(published),
        },
    }


@grants_router.get("/applications/my")
def my_grant_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.account_category import sync_account_category

    sync_account_category(current_user, db)
    if current_user.account_category != "student":
        raise HTTPException(status_code=403, detail="Students only")
    student_id = current_user.student_registration_number
    if not student_id:
        raise HTTPException(status_code=400, detail="No student registration number")

    programs = catalog.programs_lookup(db, program_kind="grant", published_only=False)
    rows = grant_db.list_grant_applications(db, student_id)
    applications = [
        grant_db.app_to_dict(row, programs.get(str(row.grant_external_id)))
        for row in rows
    ]
    return {"applications": applications, "total": len(applications)}


@grants_router.delete("/applications/{application_id}/draft")
def delete_grant_draft_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    _assert_grant_owner(row, student_id)
    try:
        deleted = grant_db.delete_draft_application(db, application_id, student_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Draft application not found")
    return {"message": "Draft deleted", "application_id": application_id}


@grants_router.get("/applications/student/{grant_id}")
def get_student_grant_application(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.account_category import sync_account_category

    sync_account_category(current_user, db)
    if current_user.account_category != "student":
        raise HTTPException(status_code=403, detail="Students only")
    student_id = current_user.student_registration_number
    if not student_id:
        raise HTTPException(status_code=400, detail="No student registration number")

    row = grant_db.get_application(db, student_id, grant_id)
    catalog.ensure_pi_grants_seeded(db)
    program = catalog.programs_lookup(db, program_kind="grant").get(str(grant_id))
    if not row:
        return {"application": None, "grant": program}
    return {"application": grant_db.app_to_dict(row, program), "grant": program}


@grants_router.patch("/applications/{grant_id}/draft")
def save_grant_proposal_draft(
    grant_id: str,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    program = catalog.get_grant_program(db, grant_id)
    if not program:
        raise HTTPException(status_code=404, detail="Grant programme not found")

    proposal = body.get("proposal") or {}
    if body.get("pi_name"):
        proposal["pi_name"] = body["pi_name"]
    if body.get("pi_email"):
        proposal["pi_email"] = body["pi_email"]
    for field in ("abstract", "methodology", "dmp", "keywords", "fit_statement"):
        if field in body:
            proposal[field] = body[field]

    recruitment = dict(body.get("recruitment") or {})
    for field in ("application_path", "pi_invite_accepted"):
        if field in body:
            recruitment[field] = body[field]
        elif field in (body.get("recruitment") or {}):
            recruitment[field] = body["recruitment"][field]

    candidate = dict(body.get("candidate") or {})
    for field in ("cover_letter", "publications_summary", "enrolled", "concurrent_admission", "offer_accepted", "documents"):
        if field in body:
            candidate[field] = body[field]

    try:
        row = grant_db.save_proposal_draft(
            db,
            student_id,
            grant_id,
            project_title=str(body.get("project_title") or "").strip(),
            proposal=proposal,
            budget_lines=body.get("budget_lines"),
            candidate=candidate if candidate else None,
            recruitment=recruitment if recruitment else None,
            institution_id=current_user.institution_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    grant = catalog.program_to_api_dict(db, program)
    return {"application": grant_db.app_to_dict(row, grant)}


@grants_router.post("/applications/{grant_id}/documents")
async def upload_grant_proposal_document(
    grant_id: str,
    file: UploadFile = File(...),
    doc_type: str = Query("supporting"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    program = catalog.get_grant_program(db, grant_id)
    if not program:
        raise HTTPException(status_code=404, detail="Grant programme not found")

    content = await file.read()
    mime = file.content_type or "application/octet-stream"
    fname = file.filename or "document"
    if fname.lower().endswith(".md") and mime in ("application/octet-stream", "text/plain"):
        mime = "text/markdown"

    try:
        meta = grant_docs.save_document(
            student_id,
            grant_id,
            filename=fname,
            content=content,
            mime=mime,
            doc_type=doc_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    row = grant_db.get_or_create_draft(
        db, student_id, grant_id, institution_id=current_user.institution_id
    )
    lifecycle = (row.form_data or {}).get("lifecycle") or {}
    dt = str(doc_type or "supporting").lower()
    recruitment_doc = dt in ("cv", "cover_letter", "publications")
    is_pi = str(grant_id).startswith("pi-")

    if is_pi and recruitment_doc:
        candidate = lifecycle.get("candidate") or {}
        docs = list(candidate.get("documents") or [])
        docs.append(meta)
        row = grant_db.save_proposal_draft(
            db,
            student_id,
            grant_id,
            candidate={"documents": docs},
            institution_id=current_user.institution_id,
        )
        docs = (row.form_data or {}).get("lifecycle", {}).get("candidate", {}).get("documents") or docs
    else:
        proposal = lifecycle.get("proposal") or {}
        docs = list(proposal.get("documents") or [])
        docs.append(meta)
        proposal["documents"] = docs
        row = grant_db.save_proposal_draft(
            db,
            student_id,
            grant_id,
            proposal=proposal,
            institution_id=current_user.institution_id,
        )
    return {
        "document": meta,
        "documents": docs,
        "application": grant_db.app_to_dict(row, catalog.program_to_api_dict(db, program)),
    }


@grants_router.delete("/applications/{grant_id}/documents/{storage_key}")
async def delete_grant_proposal_document(
    grant_id: str,
    storage_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    grant_docs.delete_document(student_id, grant_id, storage_key)
    row = grant_db.get_application(db, student_id, grant_id)
    docs = []
    if row:
        lifecycle = (row.form_data or {}).get("lifecycle") or {}
        proposal = lifecycle.get("proposal") or {}
        candidate = lifecycle.get("candidate") or {}
        prop_docs = [d for d in (proposal.get("documents") or []) if d.get("storage_key") != storage_key]
        cand_docs = [d for d in (candidate.get("documents") or []) if d.get("storage_key") != storage_key]
        if len(cand_docs) != len(candidate.get("documents") or []):
            row = grant_db.save_proposal_draft(db, student_id, grant_id, candidate={**candidate, "documents": cand_docs})
            docs = cand_docs
        else:
            row = grant_db.save_proposal_draft(db, student_id, grant_id, proposal={**proposal, "documents": prop_docs})
            docs = prop_docs
        row = grant_db.get_application(db, student_id, grant_id)
    program = catalog.get_grant_program(db, grant_id)
    grant = catalog.program_to_api_dict(db, program) if program else {}
    return {
        "ok": True,
        "documents": docs,
        "application": grant_db.app_to_dict(row, grant) if row else None,
    }


@grants_router.get("/applications/{grant_id}/documents/{storage_key}")
async def preview_grant_proposal_document(
    grant_id: str,
    storage_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    path = grant_docs.resolve_document(student_id, grant_id, storage_key)
    if not path:
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path, filename=path.name.split("_", 1)[-1] if "_" in path.name else path.name)


@grants_router.post("/applications/{grant_id}/acknowledge-brief")
def acknowledge_pi_grant_brief(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """PI Grant — student acknowledges project brief and proceeds to Apply."""
    student_id = _require_student(current_user, db)
    if not str(grant_id).startswith("pi-"):
        raise HTTPException(status_code=400, detail="Brief acknowledgement applies to PI grants only")
    program = catalog.get_grant_program(db, grant_id)
    if not program:
        raise HTTPException(status_code=404, detail="Grant programme not found")
    try:
        row = grant_db.acknowledge_pi_brief(
            db, student_id, grant_id, institution_id=current_user.institution_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    grant = catalog.program_to_api_dict(db, program)
    return {"message": "Project brief acknowledged — continue to Apply", "application": grant_db.app_to_dict(row, grant)}


@grants_router.post("/applications/{grant_id}/accept-invite")
def accept_pi_invite(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    if not str(grant_id).startswith("pi-"):
        raise HTTPException(status_code=400, detail="PI grant invitations only")
    try:
        row = grant_db.accept_pi_invite(db, student_id, grant_id, institution_id=current_user.institution_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.get_grant_program(db, grant_id)
    grant = catalog.program_to_api_dict(db, program) if program else {}
    return {"message": "PI invitation accepted", "application": grant_db.app_to_dict(row, grant)}


@grants_router.post("/applications/{grant_id}/apply")
def submit_pi_grant_application(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """PI Grant — student submits expression of interest against the project brief."""
    student_id = _require_student(current_user, db)
    program = catalog.get_grant_program(db, grant_id)
    if not program:
        raise HTTPException(status_code=404, detail="Grant programme not found")
    if not str(grant_id).startswith("pi-"):
        raise HTTPException(status_code=400, detail="Apply endpoint is for PI grant programmes only")
    if str(program.workflow_status or "").lower() != "published":
        raise HTTPException(status_code=400, detail="This grant is not open for applications")

    try:
        row = grant_db.submit_pi_application(
            db,
            student_id,
            grant_id,
            institution_id=current_user.institution_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    grant = catalog.program_to_api_dict(db, program)
    return {
        "message": "Application submitted — the PI will review your fit against the project brief",
        "application": grant_db.app_to_dict(row, grant),
    }


@grants_router.post("/applications/{grant_id}/submit")
def submit_grant_proposal(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Advance Stage 1 → Stage 2 (compliance gates)."""
    student_id = _require_student(current_user, db)
    program = catalog.get_grant_program(db, grant_id)
    if not program:
        raise HTTPException(status_code=404, detail="Grant programme not found")
    if str(program.workflow_status or "").lower() != "published":
        raise HTTPException(status_code=400, detail="This grant is not open for applications")

    try:
        row = grant_db.submit_proposal(db, student_id, grant_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    grant = catalog.program_to_api_dict(db, program)
    return {
        "message": "Proposal submitted — compliance & ethics gates unlocked",
        "application": grant_db.app_to_dict(row, grant),
    }


def _sponsorship_request_entry(row: StudentGrantApplication, grant: dict, student: dict) -> dict:
    lifecycle = (row.form_data or {}).get("lifecycle") or {}
    proposal = lifecycle.get("proposal") or {}
    name = (
        student.get("full_name")
        or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
        or row.student_number
    )
    app_dict = grant_db.app_to_dict(row, grant)
    sponsorship_status = "confirmed" if proposal.get("pi_confirmed") else (
        "declined" if proposal.get("pi_declined") else "pending"
    )
    return {
        **app_dict,
        "student_name": name,
        "recipient": name,
        "program": student.get("program") or student.get("major") or "—",
        "grant_name": grant.get("scholarship_name") or row.grant_external_id,
        "pi_name": proposal.get("pi_name") or grant.get("pi_name") or "",
        "pi_email": proposal.get("pi_email") or "",
        "fit_statement": proposal.get("fit_statement") or (row.form_data or {}).get("lifecycle", {}).get("candidate", {}).get("cover_letter") or "",
        "candidate": (row.form_data or {}).get("lifecycle", {}).get("candidate") or {},
        "compliance_review": (row.form_data or {}).get("lifecycle", {}).get("compliance_review") or {},
        "offer": (row.form_data or {}).get("lifecycle", {}).get("offer") or {},
        "recruitment": (row.form_data or {}).get("lifecycle", {}).get("recruitment") or {},
        "scope_of_work": grant.get("scope_of_work") or {},
        "application_submitted": bool(proposal.get("application_submitted")),
        "application_submitted_at": proposal.get("application_submitted_at"),
        "sponsorship_status": sponsorship_status,
        "pi_confirmed": bool(proposal.get("pi_confirmed")),
        "pi_declined": bool(proposal.get("pi_declined")),
        "pi_confirmed_at": proposal.get("pi_confirmed_at"),
        "pi_declined_at": proposal.get("pi_declined_at"),
        "pi_response_comments": proposal.get("pi_response_comments") or "",
        "request_sent_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "keywords": proposal.get("keywords") or [],
        "documents": proposal.get("documents") or [],
    }


def _assert_sponsorship_access(db: Session, user: User, row: StudentGrantApplication) -> None:
    if not grant_db.user_can_access_sponsorship_request(db, user, row):
        raise HTTPException(status_code=403, detail="You are not authorized to view this sponsorship request")


@grants_router.get("/sponsorship-requests/dashboard")
def sponsorship_requests_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Advisor / sponsor portal overview."""
    from app.permissions import is_advisor_portal_user

    rows = grant_db.list_sponsorship_requests_for_user(db, current_user)
    if not rows and not is_advisor_portal_user(current_user):
        raise HTTPException(
            status_code=403,
            detail="No sponsorship requests are linked to your account. Sign in with the PI email listed on the student's application.",
        )

    programs = catalog.programs_lookup(db, program_kind="grant", include_admin=True)
    students = _load_students_index()
    pending = confirmed = declined = 0
    for row in rows:
        proposal = (row.form_data or {}).get("lifecycle", {}).get("proposal") or {}
        if proposal.get("pi_confirmed"):
            confirmed += 1
        elif proposal.get("pi_declined"):
            declined += 1
        else:
            pending += 1

    return {
        "pending_count": pending,
        "confirmed_count": confirmed,
        "declined_count": declined,
        "total": len(rows),
        "recent": [
            _sponsorship_request_entry(
                row,
                programs.get(str(row.grant_external_id)) or {},
                students.get(str(row.student_number)) or {},
            )
            for row in rows[:5]
        ],
    }


@grants_router.get("/sponsorship-requests")
def list_sponsorship_requests(
    status: Optional[str] = Query(None, description="pending | confirmed | declined | all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List PI grant sponsorship requests for the logged-in advisor or sponsor."""
    status_filter = status if status in ("pending", "confirmed", "declined", "all") else None
    rows = grant_db.list_sponsorship_requests_for_user(db, current_user, status_filter=status_filter)
    programs = catalog.programs_lookup(db, program_kind="grant", include_admin=True)
    students = _load_students_index()
    requests = [
        _sponsorship_request_entry(
            row,
            programs.get(str(row.grant_external_id)) or {},
            students.get(str(row.student_number)) or {},
        )
        for row in rows
    ]
    return {"requests": requests, "total": len(requests)}


@grants_router.get("/sponsorship-requests/{application_id}")
def get_sponsorship_request(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Sponsorship request not found")
    _assert_sponsorship_access(db, current_user, row)
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    student = _load_students_index().get(str(row.student_number)) or {}
    return {"request": _sponsorship_request_entry(row, program, student)}


@grants_router.post("/sponsorship-requests/{application_id}/respond")
def respond_to_sponsorship_request(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Sponsorship request not found")
    _assert_sponsorship_access(db, current_user, row)

    proposal = (row.form_data or {}).get("lifecycle", {}).get("proposal") or {}
    if proposal.get("pi_confirmed"):
        raise HTTPException(status_code=400, detail="Sponsorship already confirmed")
    if proposal.get("pi_declined"):
        raise HTTPException(status_code=400, detail="Sponsorship already declined")

    confirmed = bool(body.get("confirmed", True))
    comments = str(body.get("comments") or "").strip()
    try:
        row = grant_db.respond_pi_sponsorship(
            db,
            application_id,
            confirmed=confirmed,
            comments=comments,
            responder_name=current_user.full_name or current_user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    student = _load_students_index().get(str(row.student_number)) or {}
    action = "endorsed" if confirmed else "declined"
    return {
        "message": f"Sponsorship {action} — {'compliance review started' if confirmed else 'application remains at Apply stage'}",
        "request": _sponsorship_request_entry(row, program, student),
    }


@grants_router.post("/applications/{application_id}/pi-confirm")
def confirm_pi_sponsorship(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)
    try:
        row = grant_db.confirm_pi_sponsorship(db, application_id, confirmed=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {
        "message": "PI sponsorship confirmed — budget builder unlocked for student",
        "application": grant_db.app_to_dict(row, program),
    }


@grants_router.patch("/applications/{application_id}/compliance-review")
def update_compliance_review(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Staff — RDO / grants office clears compliance checks."""
    assert_staff_portal(current_user)
    try:
        row = grant_db.update_compliance_review(db, application_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"message": "Compliance review updated", "application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/offer/issue")
def issue_grant_offer(
    application_id: int,
    body: dict = Body(default={}),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)
    try:
        row = grant_db.issue_offer(db, application_id, letter_ref=str(body.get("letter_ref") or ""))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"message": "Offer letter issued", "application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/offer/accept")
def accept_grant_offer(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    try:
        row = grant_db.accept_offer(db, application_id, student_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"message": "Offer accepted — active work begins", "application": grant_db.app_to_dict(row, program)}


@grants_router.patch("/applications/{application_id}/onboarding")
def update_grant_onboarding(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Staff — advance RDO funder check, HR contract, or ethics amendment."""
    assert_staff_portal(current_user)
    try:
        row = grant_db.update_onboarding(db, application_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {
        "message": "Onboarding status updated",
        "application": grant_db.app_to_dict(row, program),
    }


@grants_router.patch("/applications/{application_id}/compliance")
def update_grant_compliance(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    _assert_grant_owner(row, student_id)
    try:
        row = grant_db.update_compliance(db, application_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/compliance/submit")
def submit_grant_compliance(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    _assert_grant_owner(row, student_id)
    try:
        row = grant_db.submit_compliance(db, application_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {
        "message": "Compliance cleared — routed to OSP sign-off chain",
        "application": grant_db.app_to_dict(row, program),
    }


@grants_router.post("/applications/{application_id}/routing/{role}")
def grant_routing_signoff(
    application_id: int,
    role: str,
    body: dict = Body(default={}),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)
    try:
        row = grant_db.routing_signoff(
            db,
            application_id,
            role,
            signer=current_user.full_name or current_user.email,
            approved=body.get("approved", True),
            comments=body.get("comments") or "",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/peer-review")
def grant_peer_review(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)
    scores = body.get("scores") or body
    try:
        row = grant_db.submit_peer_review(
            db,
            application_id,
            scores,
            reviewer=current_user.full_name or current_user.email,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/post-award")
def grant_post_award_setup(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    try:
        row = grant_db.setup_post_award(
            db,
            application_id,
            wbs_code=str(body.get("wbs_code") or ""),
            award_amount=float(body.get("award_amount") or 0),
            category_balances=body.get("category_balances") or {},
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {
        "message": f"Restricted ledger {body.get('wbs_code')} created",
        "application": grant_db.app_to_dict(row, program),
    }


@grants_router.post("/applications/{application_id}/procurement")
def grant_procurement_request(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    _assert_grant_owner(row, student_id)
    try:
        row = grant_db.add_procurement_request(db, application_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/effort-report")
def grant_effort_report(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student_id = _require_student(current_user, db)
    row = grant_db.get_application_by_id(db, application_id)
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    _assert_grant_owner(row, student_id)
    try:
        row = grant_db.submit_effort_report(db, application_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"application": grant_db.app_to_dict(row, program)}


@grants_router.post("/applications/{application_id}/milestones/{milestone_id}/sign")
def grant_milestone_signoff(
    application_id: int,
    milestone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_staff_portal(current_user)
    try:
        row = grant_db.sign_milestone(db, application_id, milestone_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    return {"application": grant_db.app_to_dict(row, program)}


@grants_router.patch("/applications/{application_id}/review")
def review_grant_application(
    application_id: int,
    body: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    status = body.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="status is required")
    try:
        row = grant_db.review_application(
            db,
            application_id,
            status=status,
            award_amount=body.get("award_amount"),
            review_notes=body.get("review_notes"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    program = catalog.programs_lookup(db, program_kind="grant").get(str(row.grant_external_id)) or {}
    students = _load_students_index()
    student = students.get(str(row.student_number)) or {}
    name = student.get("full_name") or row.student_number
    return {
        "message": f"Application marked as {row.status}",
        "application": {
            **grant_db.app_to_dict(row, program),
            "recipient": name,
            "status": _map_application_status(str(row.status)),
        },
    }
