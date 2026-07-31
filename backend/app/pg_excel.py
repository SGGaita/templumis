"""Read postgraduate journey sheets from the institutional Excel workbook."""

from __future__ import annotations

from typing import Any, Optional


def _cell_str(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _milestone_status(val: Any) -> str:
    v = _cell_str(val).lower()
    if not v or v in ("n/a", "tbd", "pending", "not started"):
        return "pending"
    if "complete" in v or "✓" in v or "graduated" in v or "passed" in v or "approved" in v:
        return "completed"
    if "progress" in v or "active" in v or "phase" in v or "writing" in v or "review" in v or "⚠" in v:
        return "in_progress"
    if "probation" in v or "fail" in v or "suspend" in v:
        return "at_risk"
    return "pending"


def _row_for_student(sheet, student_id: str, *, id_col: int = 0, header_row: int = 4, data_start: int = 5):
    sid = str(student_id)
    for row in sheet.iter_rows(min_row=data_start, values_only=True):
        if row and row[id_col] is not None and str(row[id_col]).strip() == sid:
            return row
    return None


def load_program_advisors(wb, student_id: str) -> dict:
    """Programme advisor / supervisor from Students sheet."""
    if "Students" not in wb.sheetnames:
        return {}
    sheet = wb["Students"]
    headers = [c.value for c in sheet[1]]
    col = {str(h).strip(): i for i, h in enumerate(headers) if h}
    primary_key = next((k for k in col if "programme advisor" in k.lower() or k.lower() == "supervisor"), None)
    co_key = next((k for k in col if "co-supervisor" in k.lower() or "co supervisor" in k.lower()), None)
    if primary_key is None:
        return {}

    for row in sheet.iter_rows(min_row=2, values_only=True):
        if not row or str(row[0] or "").strip() != str(student_id):
            continue
        primary = _cell_str(row[col[primary_key]]) if col[primary_key] < len(row) else ""
        co = _cell_str(row[col[co_key]]) if co_key and col[co_key] < len(row) else ""
        st = _cell_str(row[col["Student Type"]]) if "Student Type" in col and col["Student Type"] < len(row) else ""
        pl = _cell_str(row[col["Programme Level"]]) if "Programme Level" in col and col["Programme Level"] < len(row) else ""
        blob = f"{st} {pl}".lower()
        is_postgrad = any(k in blob for k in ("post", "master", "phd", "msc", "mba", "ma ", "mphil", "doctor"))
        return {
            "primary": primary or None,
            "co": co or None,
            "primary_role": "Supervisor" if is_postgrad else "Programme Advisor",
        }
    return {}


def load_phd_research(wb, student_id: str) -> Optional[dict]:
    """PhD journey supervisors from PhD Journey Tracker (header row 5, data row 6+)."""
    if "PhD Journey Tracker" not in wb.sheetnames:
        return None
    sheet = wb["PhD Journey Tracker"]
    row = _row_for_student(sheet, student_id, header_row=5, data_start=6)
    if not row:
        return None
    return {
        "principal_supervisor": _cell_str(row[4]) if len(row) > 4 else None,
        "co_supervisor": _cell_str(row[5]) if len(row) > 5 else None,
        "dissertation_title": _cell_str(row[3]) if len(row) > 3 else None,
        "department": _cell_str(row[2]) if len(row) > 2 else None,
    }


def load_pg_research(wb, student_id: str) -> Optional[dict]:
    if "PG Research Tracker" not in wb.sheetnames:
        return None
    sheet = wb["PG Research Tracker"]
    row = _row_for_student(sheet, student_id)
    if not row:
        return None

    milestones = {
        "m1_enrolment": _cell_str(row[11]) if len(row) > 11 else "",
        "m2_proposal_coursework": _cell_str(row[12]) if len(row) > 12 else "",
        "m3_lit_review": _cell_str(row[13]) if len(row) > 13 else "",
        "m4_data_collection": _cell_str(row[14]) if len(row) > 14 else "",
        "m5_analysis_writing": _cell_str(row[15]) if len(row) > 15 else "",
        "m6_submission": _cell_str(row[16]) if len(row) > 16 else "",
        "m7_defence": _cell_str(row[17]) if len(row) > 17 else "",
    }

    return {
        "supervisor": _cell_str(row[4]) if len(row) > 4 else None,
        "co_supervisor": _cell_str(row[5]) if len(row) > 5 else None,
        "dissertation_title": _cell_str(row[6]) if len(row) > 6 else None,
        "research_area": _cell_str(row[7]) if len(row) > 7 else None,
        "programme_status": _cell_str(row[8]) if len(row) > 8 else None,
        "current_stage": _cell_str(row[9]) if len(row) > 9 else None,
        "stage_reference": _cell_str(row[10]) if len(row) > 10 else None,
        "milestones": milestones,
        "overall_progress_pct": float(row[18]) if len(row) > 18 and row[18] is not None else None,
        "expected_completion": _cell_str(row[19]) if len(row) > 19 else None,
        "research_output": _cell_str(row[20]) if len(row) > 20 else None,
        "next_review_date": _cell_str(row[21]) if len(row) > 21 else None,
        "stage_notes": _cell_str(row[22]) if len(row) > 22 else None,
        "proposal_status": milestones["m2_proposal_coursework"],
        "data_collection": milestones["m4_data_collection"],
        "thesis_draft": milestones["m5_analysis_writing"],
        "submission_target": _cell_str(row[19]) if len(row) > 19 else None,
        "grant_funding": _cell_str(row[20]) if len(row) > 20 else None,
        "next_milestone": _cell_str(row[9]) if len(row) > 9 else None,
        "current_challenge": _cell_str(row[22]) if len(row) > 22 else None,
        "risk_flag": "high" if "probation" in _cell_str(row[8]).lower() else "medium" if "⚠" in _cell_str(row[10]) else "low",
    }


def load_pg_support(wb, student_id: str) -> list[dict]:
    if "PG Academic Support" not in wb.sheetnames:
        return []
    sheet = wb["PG Academic Support"]
    sid = str(student_id)
    cases = []
    for row in sheet.iter_rows(min_row=5, values_only=True):
        if not row or len(row) < 2 or str(row[1] or "").strip() != sid:
            continue
        cases.append({
            "case_id": _cell_str(row[0]),
            "challenge_type": _cell_str(row[7]) if len(row) > 7 else None,
            "challenge_category": _cell_str(row[8]) if len(row) > 8 else None,
            "challenge_title": _cell_str(row[9]) if len(row) > 9 else None,
            "description": _cell_str(row[10]) if len(row) > 10 else None,
            "severity": _cell_str(row[12]) if len(row) > 12 else None,
            "interventions": [
                x for x in [
                    _cell_str(row[16]) if len(row) > 16 else "",
                    _cell_str(row[17]) if len(row) > 17 else "",
                    _cell_str(row[18]) if len(row) > 18 else "",
                ] if x
            ],
            "support_officer": _cell_str(row[20]) if len(row) > 20 else None,
            "next_review": _cell_str(row[21]) if len(row) > 21 else None,
            "status": _cell_str(row[22]) if len(row) > 22 else None,
            "service": _cell_str(row[9]) if len(row) > 9 else "Academic support",
            "provider": _cell_str(row[20]) if len(row) > 20 else "PG Support Office",
            "contact_email": "pgsupport@templumis.ac",
            "last_session": _cell_str(row[11]) if len(row) > 11 else None,
            "next_session": _cell_str(row[21]) if len(row) > 21 else None,
            "notes": _cell_str(row[23]) if len(row) > 23 else _cell_str(row[10]),
            "priority": _cell_str(row[12]) if len(row) > 12 else "Normal",
        })
    return cases


def _programme_matches(best_for: str, programme_level: str, student_type: str) -> bool:
    bf = best_for.lower()
    if not bf or bf in ("all pg", "all", "all disciplines"):
        return True
    blob = f"{programme_level} {student_type}".lower()
    tokens = [t.strip() for t in bf.replace("|", " ").split() if t.strip()]
    for token in tokens:
        if token in blob or token.replace(".", "") in blob.replace(".", ""):
            return True
        if token == "mba" and "mba" in blob:
            return True
        if token == "phd" and "phd" in blob:
            return True
        if token in ("msc", "ma") and token in blob:
            return True
    return "all" in bf


def load_library_resources(wb, *, programme_level: str = "", student_type: str = "") -> list[dict]:
    if "Library Resources" not in wb.sheetnames:
        return []
    sheet = wb["Library Resources"]
    is_postgrad = any(k in f"{programme_level} {student_type}".lower() for k in ("post", "master", "msc", "mba", "ma", "mphil", "phd", "doctor"))
    out = []
    for row in sheet.iter_rows(min_row=5, values_only=True):
        if not row or not row[0]:
            continue
        best_for = _cell_str(row[4]) if len(row) > 4 else "All PG"
        if is_postgrad and not _programme_matches(best_for, programme_level, student_type):
            continue
        access = _cell_str(row[6]) if len(row) > 6 else ""
        url = _cell_str(row[9]) if len(row) > 9 else ""
        fmt = _cell_str(row[11]) if len(row) > 11 else ""
        out.append({
            "resource_id": row[0],
            "title": _cell_str(row[2]) if len(row) > 2 else "",
            "type": _cell_str(row[1]) if len(row) > 1 else "",
            "subject_area": _cell_str(row[3]) if len(row) > 3 else "",
            "programme_level": best_for,
            "research_stage": _cell_str(row[5]) if len(row) > 5 else "",
            "fair": {
                "findable": f"Catalogue ID {row[0]}; indexed metadata" + ("; DOI in URL" if "doi" in url.lower() else ""),
                "accessible": access or "See access notes",
                "interoperable": f"Export formats: {fmt}" if fmt else "Standard bibliographic formats",
                "reusable": "Publisher / open licence terms apply — cite in your thesis",
            },
            "url": url if url.startswith("http") else None,
            "description": _cell_str(row[12]) if len(row) > 12 else "",
            "access_notes": f"{access} · {fmt}".strip(" ·"),
            "rating": _cell_str(row[10]) if len(row) > 10 else None,
            "recommended_by": _cell_str(row[13]) if len(row) > 13 else None,
        })
    return out


def pg_alerts_from_research(pg_research: dict) -> list[dict]:
    alerts = []
    if pg_research.get("current_challenge") or pg_research.get("stage_notes"):
        msg = pg_research.get("current_challenge") or pg_research.get("stage_notes")
        severity = "warning" if str(pg_research.get("risk_flag", "")).lower() == "medium" else "info"
        if str(pg_research.get("risk_flag", "")).lower() == "high":
            severity = "error"
        alerts.append({"type": severity, "title": "Research note", "message": msg, "action": "View support"})
    if pg_research.get("next_milestone"):
        alerts.append({
            "type": "info",
            "title": "Current stage",
            "message": pg_research["next_milestone"],
            "action": "View journey",
        })
    return alerts


def pg_alerts_from_support(cases: list[dict]) -> list[dict]:
    alerts = []
    for case in cases:
        sev = str(case.get("severity") or "").lower()
        alert_type = "error" if sev in ("high", "critical") else "warning" if sev == "medium" else "info"
        title = case.get("challenge_title") or case.get("challenge_type") or "Support case"
        msg = case.get("description") or case.get("notes") or ""
        if msg:
            alerts.append({"type": alert_type, "title": title, "message": msg[:240], "action": "PG Support"})
    return alerts[:4]
