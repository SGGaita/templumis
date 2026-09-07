"""Rankings dashboard data from Excel, scoped to the logged-in institution."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import openpyxl

from app.auth import get_current_user
from app.database import get_db
from app.excel_paths import resolve_excel_path
from app.excel_institution_scope import (
    InstitutionExcelScope,
    filter_rows_for_institution,
    resolve_institution_excel_scope,
)
from app.models import User
from app.routes.sis_lms import sheet_to_dict_list

router = APIRouter(prefix="/api/rankings-excel", tags=["Rankings Excel"])

# Comparison table columns on Rankings Dashboard (1-based Excel columns).
_COMPARISON_COLUMNS = {
    "templumis university": 2,
    "kitaptech university": 3,
    "rongo university": 4,
}
_COMPARISON_DOMAINS = {
    "templumis.ac": 2,
    "kitaptech.com": 3,
    "rongovarsity.ac.ke": 4,
}


def check_staff_access(current_user: User):
    """Check if user is staff"""
    if current_user.account_category != "staff":
        raise HTTPException(status_code=403, detail="Only staff can access rankings")


def parse_percentage(value):
    """Parse percentage string like '~62%' or '35.1%' to float"""
    if not value:
        return 0.0
    value_str = str(value).replace("~", "").replace("%", "").strip()
    try:
        return float(value_str)
    except Exception:
        return 0.0


def _comparison_col(scope: InstitutionExcelScope | None) -> int:
    """Excel column (1-based) for this institution in the comparison table."""
    if scope is None or not scope.is_active:
        return 2
    for domain in scope.domains:
        if domain in _COMPARISON_DOMAINS:
            return _COMPARISON_DOMAINS[domain]
    for name in scope.excel_names:
        if name in _COMPARISON_COLUMNS:
            return _COMPARISON_COLUMNS[name]
    return 2


def _int_or(value, default=0) -> int:
    try:
        return int(float(str(value).replace(",", "").strip()))
    except Exception:
        return default


def _parse_ug_pg(value) -> tuple[int, int]:
    """Parse '25 / 12 / 4' into (ug, pg_including_phd)."""
    text = str(value or "")
    parts = [p.strip() for p in text.replace("·", "/").split("/") if p.strip()]
    nums = []
    for p in parts:
        try:
            nums.append(int(float(p.split()[0])))
        except Exception:
            nums.append(0)
    while len(nums) < 3:
        nums.append(0)
    ug = nums[0]
    pg = nums[1] + nums[2]
    return ug, pg


def _is_postgraduate(student: dict) -> bool:
    blob = " ".join(
        str(student.get(k) or "")
        for k in ("student_type", "programme_level", "program", "Student Type", "Programme Level")
    ).lower()
    return any(k in blob for k in ("post", "master", "msc", "mba", "ma ", "mphil", "phd", "doctor"))


def _institutional_from_sis(students: list[dict], courses: list[dict]) -> dict:
    total = len(students)
    ug = sum(1 for s in students if not _is_postgraduate(s))
    pg = total - ug
    active = sum(
        1 for s in students if str(s.get("status") or "").strip().lower() == "active"
    )
    graduates = sum(
        1
        for s in students
        if str(s.get("status") or "").strip().lower() in ("graduated", "alumni", "completed")
    )
    research = sum(
        1
        for s in students
        if "research" in " ".join(
            str(s.get(k) or "") for k in ("student_type", "programme_level", "program", "major")
        ).lower()
        or "phd" in str(s.get("programme_level") or "").lower()
    )
    females = sum(1 for s in students if str(s.get("gender") or "").lower().startswith("f"))
    nationalities = {
        str(s.get("nationality")).strip()
        for s in students
        if s.get("nationality") and str(s.get("nationality")).strip().lower() not in ("", "unknown", "none")
    }
    gpas = []
    for s in students:
        try:
            gpas.append(float(s.get("gpa")))
        except (TypeError, ValueError):
            pass
    avg_gpa = round(sum(gpas) / len(gpas), 2) if gpas else 0.0
    departments = {
        str(s.get("department")).strip()
        for s in students
        if s.get("department") and str(s.get("department")).strip()
    }
    instructors = {
        str(c.get("instructor")).strip()
        for c in courses
        if c.get("instructor") and str(c.get("instructor")).strip()
    }
    active_courses = sum(
        1 for c in courses if str(c.get("status") or "").strip().lower() == "active"
    ) or len(courses)
    faculty = len(instructors) or max(1, active_courses // 2)
    ratio = round(total / faculty, 1) if faculty else 0

    domestic = {"kenyan", "kenya", "local"}
    intl = sum(
        1
        for s in students
        if str(s.get("nationality") or "").strip().lower() not in domestic
        and str(s.get("nationality") or "").strip()
    )
    intl_pct = round((intl / total * 100), 1) if total else 0.0

    return {
        "total_students": total,
        "ug_students": ug,
        "pg_students": pg,
        "faculty": faculty,
        "avg_gpa": f"{avg_gpa} / 4.0" if avg_gpa else "—",
        "active_students": active or total,
        "graduates": graduates,
        "active_courses": active_courses,
        "international_students": f"{intl_pct}%",
        "research_students": research,
        "student_faculty_ratio": f"{ratio} : 1",
        "avg_attendance": "—",
        "female_ratio": f"{round(females / total * 100, 1)}%" if total else "0%",
        "nationalities": len(nationalities),
        "schools_faculties": len(departments) or 1,
        "avg_grade": "—",
    }


def _institutional_from_comparison(ws, col: int) -> dict | None:
    """Read per-institution summary from ALL INSTITUTIONS comparison block."""
    header = str(ws.cell(81, col).value or "").strip()
    if not header:
        return None

    metrics = {}
    for row in range(82, 96):
        label = str(ws.cell(row, 1).value or "").strip().lower()
        value = ws.cell(row, col).value
        if not label:
            continue
        metrics[label] = value

    ug, pg = _parse_ug_pg(metrics.get("ug / pg (masters) / phd"))
    total = _int_or(metrics.get("total students"), ug + pg)
    avg_gpa_raw = metrics.get("avg gpa")
    try:
        avg_gpa = f"{float(avg_gpa_raw):.2f} / 4.0"
    except Exception:
        avg_gpa = str(avg_gpa_raw or "—")

    schools_raw = str(metrics.get("schools / faculties") or "0")
    schools = _int_or(schools_raw.split("(")[0].strip(), 0)

    return {
        "total_students": total,
        "ug_students": ug,
        "pg_students": pg,
        "faculty": _int_or(metrics.get("faculty (instructors)")),
        "avg_gpa": avg_gpa,
        "active_students": _int_or(metrics.get("active students"), total),
        "graduates": _int_or(metrics.get("graduates (to date)")),
        "active_courses": _int_or(metrics.get("active courses")),
        "international_students": "—",
        "research_students": _int_or(metrics.get("research students (msc/ma/phd by research)")),
        "student_faculty_ratio": str(metrics.get("student : faculty ratio") or "—"),
        "avg_attendance": str(metrics.get("avg attendance") or "—"),
        "female_ratio": str(metrics.get("female ratio") or "—"),
        "nationalities": _int_or(str(metrics.get("nationalities represented") or "0").split("(")[0]),
        "schools_faculties": schools,
        "avg_grade": "—",
        "institution_label": header,
        "domain": str(metrics.get("domain") or ""),
    }


def _indicator_block(ws, start: int, end: int, overall_row: int, name: str, focus: str) -> dict:
    indicators = []
    for row in range(start, end + 1):
        indicators.append(
            {
                "name": str(ws[f"A{row}"].value or ""),
                "weight": str(ws[f"B{row}"].value or ""),
                "score": parse_percentage(ws[f"C{row}"].value),
                "notes": str(ws[f"D{row}"].value or ""),
                "status": str(ws[f"E{row}"].value) if ws[f"E{row}"].value else "",
            }
        )
    return {
        "name": name,
        "focus": focus,
        "overall_readiness": parse_percentage(ws[f"C{overall_row}"].value),
        "indicators": indicators,
    }


@router.get("/dashboard-data")
async def get_rankings_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get rankings data scoped to the current user's institution domain."""
    check_staff_access(current_user)
    scope = resolve_institution_excel_scope(db, current_user)

    try:
        path = resolve_excel_path()
        wb = openpyxl.load_workbook(path, data_only=True)
        ws = wb["Rankings Dashboard"]

        # Prefer live SIS counts for this institution; fall back to comparison table.
        students = []
        courses = []
        if "Students" in wb.sheetnames:
            students = filter_rows_for_institution(sheet_to_dict_list(wb["Students"]), scope)
        if "Courses" in wb.sheetnames:
            courses = filter_rows_for_institution(sheet_to_dict_list(wb["Courses"]), scope)

        institutional_data = None
        if students:
            institutional_data = _institutional_from_sis(students, courses)
        else:
            institutional_data = _institutional_from_comparison(ws, _comparison_col(scope))

        if not institutional_data:
            # Last resort: legacy top-of-sheet Templumis summary
            institutional_data = {
                "total_students": int(ws["B5"].value) if ws["B5"].value else 0,
                "ug_students": int(ws["B6"].value) if ws["B6"].value else 0,
                "pg_students": int(ws["B7"].value) if ws["B7"].value else 0,
                "faculty": int(ws["B8"].value) if ws["B8"].value else 0,
                "avg_gpa": str(ws["D5"].value) if ws["D5"].value else "—",
                "active_students": int(ws["D6"].value) if ws["D6"].value else 0,
                "graduates": int(ws["D7"].value) if ws["D7"].value else 0,
                "active_courses": int(ws["D8"].value) if ws["D8"].value else 0,
                "international_students": str(ws["F5"].value) if ws["F5"].value else "—",
                "research_students": int(ws["F6"].value) if ws["F6"].value else 0,
                "student_faculty_ratio": str(ws["F7"].value) if ws["F7"].value else "—",
                "avg_attendance": str(ws["F8"].value) if ws["F8"].value else "—",
                "female_ratio": str(ws["H5"].value) if ws["H5"].value else "—",
                "nationalities": int(ws["H6"].value) if ws["H6"].value else 0,
                "schools_faculties": int(ws["H7"].value) if ws["H7"].value else 0,
                "avg_grade": str(ws["H8"].value) if ws["H8"].value else "—",
            }

        # Enrich attendance from comparison when SIS summary left it blank
        comparison = _institutional_from_comparison(ws, _comparison_col(scope))
        if comparison:
            if institutional_data.get("avg_attendance") in (None, "", "—"):
                institutional_data["avg_attendance"] = comparison.get("avg_attendance") or "—"
            if institutional_data.get("student_faculty_ratio") in (None, "", "—"):
                institutional_data["student_faculty_ratio"] = (
                    comparison.get("student_faculty_ratio") or "—"
                )
            institutional_data.setdefault("domain", comparison.get("domain"))

        webometrics = _indicator_block(
            ws, 13, 16, 17,
            "Webometrics Ranking of World Universities",
            "Web presence, openness & academic output",
        )
        the = _indicator_block(
            ws, 22, 26, 27,
            "THE World University Rankings",
            "Teaching, research, citations & international outlook",
        )
        the_ssa = _indicator_block(
            ws, 32, 36, 37,
            "THE Sub-Saharan Africa Rankings (SSA)",
            "Regionally adapted THE criteria for African universities",
        )
        shanghai = _indicator_block(
            ws, 42, 47, 48,
            "Shanghai ARWU (Academic Ranking of World Universities)",
            "Research output, Nobel laureates & high-impact publications",
        )
        qs = _indicator_block(
            ws, 53, 60, 61,
            "QS World University Rankings",
            "Reputation, faculty ratio, citations & international diversity",
        )
        cwts = _indicator_block(
            ws, 66, 71, 72,
            "CWTS Leiden Ranking",
            "Bibliometric research performance (Web of Science)",
        )

        wb.close()

        return {
            "institutional_data": institutional_data,
            "institution_scope": {
                "name": scope.name if scope else None,
                "domains": sorted(scope.domains) if scope else [],
            },
            "rankings": {
                "webometrics": webometrics,
                "the": the,
                "the_ssa": the_ssa,
                "shanghai": shanghai,
                "qs": qs,
                "cwts": cwts,
            },
        }

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading Rankings Dashboard: {str(e)}") from e
