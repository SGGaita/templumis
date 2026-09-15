"""NSFAS (National Student Financial Aid Scheme) beneficiary tracking.

Reads the same live Excel workbook as the rest of SIS/LMS (see
``app.excel_paths`` / ``app.routes.sis_lms``): the ``Students`` sheet for the
beneficiary roster (flagged via the ``NSFAS Beneficiary`` column) and the
``NSFAS Student Tracking`` sheet for award/allowance/academic-risk detail.
No caching — every request re-reads the workbook, so editing the .xlsx on
disk is reflected immediately, exactly like the rest of the SIS/LMS routes.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..database import get_db
from ..excel_institution_scope import (
    filter_rows_for_institution,
    resolve_institution_excel_scope,
)
from ..models import User
from .sis_lms import (
    _enrich_student,
    _load_student_lookups,
    load_excel_data,
    sheet_to_dict_list,
)

router = APIRouter(prefix="/api/sis-lms/nsfas", tags=["NSFAS"])

TRACKING_SHEET = "NSFAS Student Tracking"
_ID_PREFIXES = ("TU-", "KT-", "RU-")


def _is_nsfas_beneficiary(student: dict) -> bool:
    return str(student.get("nsfas_beneficiary") or "").strip().lower() == "yes"


def _load_tracking_rows(wb) -> list[dict]:
    """Data rows of the NSFAS Student Tracking sheet, dropping the assumptions block below it."""
    if TRACKING_SHEET not in wb.sheetnames:
        return []
    rows = sheet_to_dict_list(wb[TRACKING_SHEET])
    return [
        r for r in rows
        if str(r.get("student_id") or "").strip().upper().startswith(_ID_PREFIXES)
    ]


def _num(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


@router.get("/students")
async def list_nsfas_students(
    search: Optional[str] = None,
    award_status: Optional[str] = None,
    at_risk_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """NSFAS-beneficiary students, enriched the same way as GET /sis-lms/students."""
    require_role(current_user, ["staff", "global_admin"])

    scope = resolve_institution_excel_scope(db, current_user)
    wb = load_excel_data()
    if "Students" not in wb.sheetnames:
        wb.close()
        return {"students": [], "total": 0}

    students = filter_rows_for_institution(sheet_to_dict_list(wb["Students"]), scope)
    students = [s for s in students if _is_nsfas_beneficiary(s)]
    attendance_by_student, financial_by_student = _load_student_lookups(wb)
    tracking_by_id = {row.get("student_id"): row for row in _load_tracking_rows(wb)}
    wb.close()

    enriched = []
    for s in students:
        e = _enrich_student(dict(s), attendance_by_student, financial_by_student)
        t = tracking_by_id.get(e.get("student_id"), {})
        e["nsfas_award_status"] = t.get("award_status")
        e["nsfas_total_support_(kes)"] = _num(t.get("total_annual_nsfas_support_(kes)"))
        e["nsfas_disbursed_(kes)"] = _num(t.get("amount_disbursed_to_date_(kes)"))
        e["nsfas_continuation_risk"] = t.get("continuation_risk")
        e["nsfas_case_notes"] = t.get("case_notes_/_appeal_status")
        if t.get("has_disability") is not None:
            e["has_disability"] = t.get("has_disability")
            e["disability_type"] = t.get("disability_type")
        enriched.append(e)

    if search:
        q = search.lower()
        enriched = [
            e for e in enriched
            if q in str(e.get("full_name", "")).lower()
            or q in str(e.get("student_id", "")).lower()
            or q in str(e.get("email", "")).lower()
        ]
    if award_status:
        enriched = [
            e for e in enriched
            if str(e.get("nsfas_award_status") or "").lower() == award_status.lower()
        ]
    if at_risk_only:
        enriched = [
            e for e in enriched
            if e.get("is_at_risk")
            or str(e.get("nsfas_continuation_risk") or "").lower() not in ("", "low risk")
        ]

    return {"students": enriched, "total": len(enriched)}


@router.get("/tracking")
async def get_nsfas_tracking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full NSFAS Student Tracking rows plus computed high-level report aggregates."""
    require_role(current_user, ["staff", "global_admin"])

    scope = resolve_institution_excel_scope(db, current_user)
    wb = load_excel_data()
    students = []
    if "Students" in wb.sheetnames:
        students = filter_rows_for_institution(sheet_to_dict_list(wb["Students"]), scope)
    allowed_ids = {
        s.get("student_id") for s in students if s.get("student_id") and _is_nsfas_beneficiary(s)
    }
    all_rows = _load_tracking_rows(wb)
    wb.close()

    rows = [r for r in all_rows if not allowed_ids or r.get("student_id") in allowed_ids]

    total = len(rows)
    total_support = sum(_num(r.get("total_annual_nsfas_support_(kes)")) for r in rows)
    total_disbursed = sum(_num(r.get("amount_disbursed_to_date_(kes)")) for r in rows)
    total_outstanding = sum(_num(r.get("outstanding_fees_balance_(kes)")) for r in rows)
    gpas = [_num(r.get("gpa")) for r in rows if r.get("gpa") not in (None, "")]
    attendances = [_num(r.get("attendance_%_(avg)")) for r in rows if r.get("attendance_%_(avg)") not in (None, "")]

    def _breakdown(field: str) -> dict:
        counts: dict[str, int] = {}
        for r in rows:
            key = str(r.get(field) or "Unspecified")
            counts[key] = counts.get(key, 0) + 1
        return counts

    award_status_breakdown = _breakdown("award_status")
    academic_standing_breakdown = _breakdown("academic_standing")
    continuation_risk_breakdown = _breakdown("continuation_risk")
    department_breakdown = _breakdown("department")

    with_disability = [r for r in rows if str(r.get("has_disability") or "").lower() == "yes"]
    without_disability = [r for r in rows if str(r.get("has_disability") or "").lower() != "yes"]
    disability_topup_total = sum(_num(r.get("disability_support_top-up_(kes)")) for r in rows)

    allowance_categories = [
        ("Tuition", "tuition_allowance_(kes)"),
        ("Accommodation", "accommodation_allowance_(kes)"),
        ("Transport", "transport_allowance_(kes)"),
        ("Living / Meals", "living_/_meals_allowance_(kes)"),
        ("Learning Materials", "learning_materials_allowance_(kes)"),
        ("Disability Support Top-Up", "disability_support_top-up_(kes)"),
    ]
    allowance_totals = {
        label: sum(_num(r.get(key)) for r in rows) for label, key in allowance_categories
    }

    high_risk_count = sum(
        1 for r in rows
        if str(r.get("continuation_risk") or "").lower() in ("high risk", "critical — funding discontinued")
    )

    report_rows = [
        {
            "student_id": r.get("student_id"),
            "full_name": r.get("full_name"),
            "programme": r.get("programme"),
            "year_of_study": r.get("year_of_study"),
            "award_status": r.get("award_status"),
            "total_support_(kes)": _num(r.get("total_annual_nsfas_support_(kes)")),
            "disbursed_(kes)": _num(r.get("amount_disbursed_to_date_(kes)")),
            "outstanding_balance_(kes)": _num(r.get("outstanding_fees_balance_(kes)")),
            "gpa": r.get("gpa"),
            "attendance_pct": r.get("attendance_%_(avg)"),
            "academic_standing": r.get("academic_standing"),
            "continuation_risk": r.get("continuation_risk"),
            "has_disability": r.get("has_disability"),
            "case_notes": r.get("case_notes_/_appeal_status"),
        }
        for r in rows
    ]

    return {
        "generated_from": TRACKING_SHEET,
        "kpis": {
            "total_beneficiaries": total,
            "total_support_awarded_(kes)": total_support,
            "total_disbursed_(kes)": total_disbursed,
            "total_outstanding_balance_(kes)": total_outstanding,
            "average_gpa": round(sum(gpas) / len(gpas), 2) if gpas else None,
            "average_attendance_pct": round(sum(attendances) / len(attendances), 1) if attendances else None,
            "with_disability": len(with_disability),
            "high_risk_or_critical": high_risk_count,
        },
        "breakdowns": {
            "by_award_status": award_status_breakdown,
            "by_academic_standing": academic_standing_breakdown,
            "by_continuation_risk": continuation_risk_breakdown,
            "by_department": department_breakdown,
            "disability": {
                "with_disability": {
                    "count": len(with_disability),
                    "top_up_disbursed_(kes)": disability_topup_total,
                    "avg_gpa": (
                        round(sum(_num(r.get("gpa")) for r in with_disability) / len(with_disability), 2)
                        if with_disability else None
                    ),
                },
                "without_disability": {
                    "count": len(without_disability),
                    "avg_gpa": (
                        round(sum(_num(r.get("gpa")) for r in without_disability) / len(without_disability), 2)
                        if without_disability else None
                    ),
                },
            },
            "allowance_category_totals_(kes)": allowance_totals,
        },
        "students": report_rows,
    }
