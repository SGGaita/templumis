"""PostgreSQL persistence for student scholarship applications."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.awards import student_pipeline_label
from app.models import StudentScholarshipApplication
from app.scholarship_excel import MY_SCHOLARSHIPS_STATUSES, normalize_application_record


def _status_allowed(status: str) -> bool:
    return str(status or "").strip().lower() in MY_SCHOLARSHIPS_STATUSES


def app_to_dict(row: StudentScholarshipApplication, scholarship_details: Optional[dict] = None) -> dict:
    workflow_label = student_pipeline_label(row)
    return {
        "application_id": f"DB-{row.id}",
        "student_id": row.student_number,
        "schol_id": row.scholarship_external_id,
        "status": row.status,
        "workflow_label": workflow_label,
        "award_stage": row.award_stage,
        "offer_sent_at": row.offer_sent_at.isoformat() if row.offer_sent_at else None,
        "offer_deadline": row.offer_deadline.isoformat() if row.offer_deadline else None,
        "offer_accepted_at": row.offer_accepted_at.isoformat() if row.offer_accepted_at else None,
        "credited_at": row.credited_at.isoformat() if row.credited_at else None,
        "offer_data": row.offer_data or {},
        "scholarship_probation": bool(row.scholarship_probation),
        "applied_date": row.applied_date.isoformat() if row.applied_date else None,
        "award_amount_(kes)": float(row.award_amount) if row.award_amount is not None else None,
        "gpa": float(row.gpa_at_application) if row.gpa_at_application is not None else None,
        "progress_pct": row.progress_pct or 0,
        "form_data": row.form_data or {},
        "references": row.references_data or [],
        "ferpa_waived": row.ferpa_waived,
        "scholarship_details": scholarship_details,
        "source": "database",
    }


def get_application(
    db: Session, student_number: str, scholarship_external_id: str
) -> Optional[StudentScholarshipApplication]:
    return (
        db.query(StudentScholarshipApplication)
        .filter(
            StudentScholarshipApplication.student_number == str(student_number),
            StudentScholarshipApplication.scholarship_external_id == str(scholarship_external_id),
        )
        .first()
    )


def upsert_draft(
    db: Session,
    student_number: str,
    scholarship_external_id: str,
    *,
    institution_id: Optional[int] = None,
    form_data: Optional[dict] = None,
    references: Optional[list] = None,
    ferpa_waived: Optional[bool] = None,
    progress_pct: int = 0,
    gpa: Optional[float] = None,
) -> StudentScholarshipApplication:
    row = get_application(db, student_number, scholarship_external_id)
    if row and row.status != "draft":
        return row
    if not row:
        row = StudentScholarshipApplication(
            student_number=str(student_number),
            scholarship_external_id=str(scholarship_external_id),
            institution_id=institution_id,
            status="draft",
        )
        db.add(row)
    row.status = "draft"
    if form_data is not None:
        row.form_data = form_data
    if references is not None:
        row.references_data = references
    if ferpa_waived is not None:
        row.ferpa_waived = ferpa_waived
    row.progress_pct = progress_pct
    if gpa is not None:
        row.gpa_at_application = gpa
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def delete_draft_application(
    db: Session, student_number: str, scholarship_external_id: str
) -> bool:
    """Remove a draft application. Returns False if no row exists."""
    row = get_application(db, student_number, scholarship_external_id)
    if not row:
        return False
    if str(row.status or "").strip().lower() != "draft":
        raise ValueError("Only draft applications can be deleted")
    db.delete(row)
    db.commit()
    return True


def submit_application(
    db: Session,
    student_number: str,
    scholarship_external_id: str,
    *,
    form_data: dict,
    references: list,
    ferpa_waived: Optional[bool],
    gpa: Optional[float] = None,
    institution_id: Optional[int] = None,
) -> StudentScholarshipApplication:
    row = get_application(db, student_number, scholarship_external_id)
    if not row:
        row = StudentScholarshipApplication(
            student_number=str(student_number),
            scholarship_external_id=str(scholarship_external_id),
            institution_id=institution_id,
        )
        db.add(row)
    if row.status not in ("draft",):
        raise ValueError("Application already submitted")
    row.status = "submitted for review"
    row.triage_queue = "pending_triage"
    row.form_data = form_data
    row.references_data = references
    row.ferpa_waived = ferpa_waived
    row.gpa_at_application = gpa
    row.applied_date = date.today()
    row.progress_pct = 100
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def applications_for_student(
    db: Session,
    student_number: str,
    scholarships_by_id: dict,
    *,
    statuses_only: bool = False,
) -> list[dict]:
    """All applications for one student from PostgreSQL, enriched with catalogue rows."""
    rows = list_student_applications(db, student_number, statuses_only=statuses_only)
    return [
        app_to_dict(row, scholarships_by_id.get(str(row.scholarship_external_id)))
        for row in rows
    ]


def institution_application_stats(db: Session) -> dict:
    """Aggregate application counts and award totals from the database only."""
    rows = db.query(StudentScholarshipApplication).all()
    scholarship_status: dict[str, int] = {}
    total_awarded = 0.0
    for row in rows:
        status = str(row.status or "Unknown").strip() or "Unknown"
        scholarship_status[status] = scholarship_status.get(status, 0) + 1
        if str(row.status or "").lower() == "awarded" and row.award_amount is not None:
            total_awarded += float(row.award_amount)
    return {
        "scholarship_application_status": scholarship_status,
        "total_scholarships_awarded": total_awarded,
        "total_scholarship_apps": len(rows),
    }


def list_student_applications(
    db: Session, student_number: str, statuses_only: bool = True
) -> list[StudentScholarshipApplication]:
    from sqlalchemy.orm import joinedload

    q = (
        db.query(StudentScholarshipApplication)
        .options(joinedload(StudentScholarshipApplication.review_assignments))
        .filter(StudentScholarshipApplication.student_number == str(student_number))
    )
    rows = q.order_by(StudentScholarshipApplication.updated_at.desc()).all()
    if statuses_only:
        rows = [r for r in rows if _status_allowed(r.status)]
    return rows


def sync_excel_applications_to_db(
    db: Session,
    student_number: str,
    excel_apps: list[dict],
    institution_id: Optional[int] = None,
) -> None:
    """Legacy: import rows from Excel Scholarship Apps sheet (sheet removed — no-op when empty)."""
    for raw in excel_apps:
        norm = normalize_application_record(raw)
        if not _status_allowed(norm["status"]):
            continue
        schol_id = norm.get("schol_id")
        if not schol_id:
            continue
        existing = get_application(db, student_number, schol_id)
        if existing:
            if existing.status == "draft":
                continue
            continue
        row = StudentScholarshipApplication(
            institution_id=institution_id,
            student_number=str(student_number),
            scholarship_external_id=str(schol_id),
            status=norm["status"],
            gpa_at_application=norm.get("gpa"),
            award_amount=norm.get("award_amount_(kes)"),
            applied_date=_parse_date(norm.get("applied_date")),
            review_notes=norm.get("notes"),
            progress_pct=100 if norm["status"] != "draft" else 0,
        )
        db.add(row)
    db.commit()


def _parse_date(val: Any) -> Optional[date]:
    if not val:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(str(val)[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def draft_to_legacy_dict(row: StudentScholarshipApplication) -> dict:
    return {
        "student_id": row.student_number,
        "schol_id": row.scholarship_external_id,
        "status": "Draft",
        "form_data": row.form_data or {},
        "references": row.references_data or [],
        "ferpa_waived": row.ferpa_waived,
        "progress_pct": row.progress_pct or 0,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }
