"""Scholarship catalogue admin API and staff application views."""

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.permissions import (
    assert_financial_aid_officer,
    assert_scholarship_publisher,
    assert_staff_portal,
)
from app import scholarship_catalog as catalog
from app import scholarship_db
from app.models import ScholarshipProgram, StudentScholarshipApplication, User
from app.routes.sis_lms import load_excel_data, sheet_to_dict_list

router = APIRouter(prefix="/api/sis-lms/scholarships", tags=["Scholarships"])


def _load_students_index() -> dict[str, dict]:
    try:
        wb = load_excel_data()
        if "Students" not in wb.sheetnames:
            wb.close()
            return {}
        students = sheet_to_dict_list(wb["Students"])
        wb.close()
        return {str(s.get("student_id")): s for s in students if s.get("student_id")}
    except Exception:
        return {}


@router.get("/applications/staff")
async def list_staff_applications(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All student scholarship applications from PostgreSQL (live data only)."""
    assert_staff_portal(current_user)

    q = db.query(StudentScholarshipApplication).order_by(
        StudentScholarshipApplication.updated_at.desc()
    )
    if status and status.lower() != "all":
        q = q.filter(StudentScholarshipApplication.status.ilike(f"%{status}%"))

    rows = q.all()
    schol_by_id = catalog.programs_lookup(db, include_admin=True)
    students = _load_students_index()

    applications = []
    for row in rows:
        if str(row.status).lower() == "draft" and status and status.lower() not in ("all", "draft"):
            continue
        schol = schol_by_id.get(str(row.scholarship_external_id)) or {}
        student = students.get(str(row.student_number)) or {}
        app_dict = scholarship_db.app_to_dict(row, schol)
        name = (
            student.get("full_name")
            or f"{student.get('first_name', '')} {student.get('last_name', '')}".strip()
            or row.student_number
        )
        entry = {
            **app_dict,
            "id": row.id,
            "recipient": name,
            "student_name": name,
            "program": student.get("program") or student.get("major") or "—",
            "scholarship_name": schol.get("scholarship_name") or row.scholarship_external_id,
            "type": schol.get("type") or "—",
            "amount": float(row.award_amount or schol.get("amount_(kes)") or 0),
            "disbursed": float(row.award_amount or 0)
            if str(row.status).lower() in ("awarded", "approved")
            else 0,
            "period": schol.get("year") or "Current cycle",
            "gpa_req": schol.get("min_gpa"),
            "applied": row.applied_date.isoformat() if row.applied_date else None,
            "approved_by": None,
        }
        st_lower = str(row.status).lower()
        if st_lower in ("awarded", "approved"):
            entry["status"] = "active"
        elif st_lower in ("submitted for review", "under review", "pending"):
            entry["status"] = "pending"
        elif st_lower == "rejected":
            entry["status"] = "suspended"
        elif st_lower == "draft":
            entry["status"] = "draft"
        else:
            entry["status"] = "pending"

        if search:
            blob = " ".join(
                str(x).lower()
                for x in [
                    entry["recipient"],
                    row.student_number,
                    entry["scholarship_name"],
                    entry["type"],
                    row.status,
                ]
            )
            if search.lower() not in blob:
                continue
        applications.append(entry)

    total = len(applications)
    page = applications[skip : skip + limit]

    status_counts = {"active": 0, "pending": 0, "draft": 0, "suspended": 0, "completed": 0}
    total_disbursed = 0.0
    for a in applications:
        sc = a.get("status") or "pending"
        status_counts[sc] = status_counts.get(sc, 0) + 1
        total_disbursed += float(a.get("disbursed") or 0)

    published = catalog.load_programs(db, program_kind="scholarship", published_only=True)
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
            "total_disbursed": total_disbursed,
            "published_programs": len(published),
        },
    }


@router.get("/programs")
def list_programs(
    admin: bool = Query(False),
    kind: str = Query("scholarship", description="scholarship or grant"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Published opportunities for students; full catalogue for staff when admin=1."""
    program_kind = "grant" if kind == "grant" else "scholarship"
    if admin:
        assert_financial_aid_officer(current_user)
        return catalog.load_programs(db, program_kind=program_kind, include_admin=True)
    return catalog.load_programs(db, program_kind=program_kind, published_only=True, open_only=False)


@router.get("/programs/{program_id}")
def get_program(
    program_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    row = catalog.get_program_by_external_id(db, program_id)
    if not row:
        row = db.query(ScholarshipProgram).filter(ScholarshipProgram.id == int(program_id)).first() if program_id.isdigit() else None
    if not row:
        raise HTTPException(status_code=404, detail="Scholarship program not found")
    return catalog.program_to_api_dict(db, row, include_admin=True)


@router.post("/programs")
def create_program(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    fields = catalog.program_from_payload(body)
    program_kind = str(body.get("program_kind") or "scholarship").lower()
    if program_kind not in ("scholarship", "grant"):
        program_kind = "scholarship"
    if not fields.get("external_id"):
        prefix = "GRT" if program_kind == "grant" else "SCH"
        existing = db.query(ScholarshipProgram).filter(ScholarshipProgram.program_kind == program_kind).count()
        fields["external_id"] = f"{prefix}-{existing + 1:03d}"
    if not fields.get("title"):
        raise HTTPException(status_code=400, detail="title is required")
    if db.query(ScholarshipProgram).filter(ScholarshipProgram.external_id == fields["external_id"]).first():
        raise HTTPException(status_code=400, detail="external_id already exists")

    errors = catalog.validate_logic_expression(
        fields.get("eligibility_rules") or {},
        fields.get("logic_expression") or {},
    )
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    deadline = fields.pop("application_deadline", None)
    row = ScholarshipProgram(
        **{k: v for k, v in fields.items() if v is not None and k != "external_id"},
        external_id=fields["external_id"],
        program_kind=program_kind,
        workflow_status="draft",
        institution_id=current_user.institution_id,
        created_by=current_user.id,
    )
    if deadline:
        if isinstance(deadline, str):
            row.application_deadline = date.fromisoformat(deadline[:10])
        else:
            row.application_deadline = deadline
    if fields.get("min_gpa") is None and row.criteria_text:
        from app.scholarship_excel import _parse_min_gpa

        row.min_gpa = _parse_min_gpa(row.criteria_text)
    db.add(row)
    db.commit()
    db.refresh(row)
    return catalog.program_to_api_dict(db, row, include_admin=True)


@router.put("/programs/{program_id}")
def update_program(
    program_id: str,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    row = catalog.get_program_by_external_id(db, program_id)
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    if row.workflow_status == "published" and body.get("force") is not True:
        row.workflow_status = "draft"

    fields = catalog.program_from_payload({**catalog.program_to_api_dict(db, row, include_admin=True), **body})
    errors = catalog.validate_logic_expression(
        fields.get("eligibility_rules") or {},
        fields.get("logic_expression") or {},
    )
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    for key, val in fields.items():
        if key == "external_id" or val is None:
            continue
        if hasattr(row, key):
            setattr(row, key, val)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return catalog.program_to_api_dict(db, row, include_admin=True)


@router.post("/programs/{program_id}/submit-review")
def submit_for_review(
    program_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_financial_aid_officer(current_user)
    row = catalog.get_program_by_external_id(db, program_id)
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    row.workflow_status = "pending_approval"
    row.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Submitted for director approval", "workflow_status": row.workflow_status}


@router.post("/programs/{program_id}/publish")
def publish_program(
    program_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Maker-checker: director publishes; must differ from creator."""
    assert_scholarship_publisher(current_user)
    row = catalog.get_program_by_external_id(db, program_id)
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    if row.workflow_status not in ("pending_approval", "draft"):
        raise HTTPException(status_code=400, detail=f"Cannot publish from status {row.workflow_status}")
    if row.created_by and row.created_by == current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Maker-checker: a different administrator must approve publication",
        )
    row.workflow_status = "published"
    row.approved_by = current_user.id
    row.approved_at = datetime.utcnow()
    row.updated_at = datetime.utcnow()
    db.commit()
    return catalog.program_to_api_dict(db, row, include_admin=True)


@router.post("/programs/{program_id}/simulate")
def simulate_program(
    program_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sandbox: eligible student pool size against live SIS data."""
    assert_financial_aid_officer(current_user)
    row = catalog.get_program_by_external_id(db, program_id)
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    students = list(_load_students_index().values())
    pool = catalog.simulate_eligible_pool(students, row)
    pool["remaining_budget"] = catalog.remaining_budget(db, row)
    pool["committed_liability"] = catalog.committed_liability(db, row)
    return pool


@router.delete("/applications/{application_id}")
async def delete_scholarship_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a scholarship application (any status) - admin only."""
    assert_financial_aid_officer(current_user)
    
    row = db.query(StudentScholarshipApplication).filter(
        StudentScholarshipApplication.id == application_id
    ).first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    
    student_number = row.student_number
    scholarship_id = row.scholarship_external_id
    status = row.status
    
    db.delete(row)
    db.commit()
    
    return {
        "message": "Application deleted successfully",
        "application_id": application_id,
        "student_number": student_number,
        "scholarship_id": scholarship_id,
        "previous_status": status,
    }
