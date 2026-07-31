"""Normalize scholarship rows from templumis_university_v2.xlsx."""

from __future__ import annotations

import re
from typing import Any, Optional


def _parse_min_gpa(criteria: Any) -> Optional[float]:
    if not criteria:
        return None
    text = str(criteria)
    m = re.search(r"GPA\s*([\d.]+)", text, re.I)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    m = re.search(r"([\d.]+)\s*GPA", text, re.I)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    m = re.search(r"GPA\s*[≥>=]+\s*([\d.]+)", text, re.I)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None


def normalize_scholarship_record(row: dict) -> dict:
    """Map v2 (and legacy) scholarship columns to API shape."""
    sid = row.get("scholarship_id") or row.get("id") or row.get("schol_id")
    slots_avail = int(float(row.get("slots_available") or row.get("slots") or 0))
    slots_filled = int(float(row.get("slots_filled") or 0))
    raw_status = str(row.get("status") or "").strip().lower()
    is_open = raw_status in ("active", "open")

    amount = row.get("value_(kes)") or row.get("amount_(kes)") or 0
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        amount = 0

    return {
        "id": str(sid) if sid is not None else None,
        "scholarship_name": row.get("scholarship_name") or row.get("name"),
        "type": row.get("type") or "General",
        "description": row.get("criteria") or row.get("description") or "",
        "amount_(kes)": amount,
        "coverage": row.get("coverage"),
        "slots": slots_avail,
        "remaining": max(0, slots_avail - slots_filled),
        "min_gpa": row.get("min_gpa") or _parse_min_gpa(row.get("criteria")),
        "year": row.get("year") or "Any",
        "open_to": row.get("open_to") or "All",
        "frequency": row.get("frequency") or row.get("coverage") or "Per award",
        "deadline": row.get("deadline"),
        "status": "open" if is_open else raw_status,
        "requires_references": int(row.get("requires_references") or 0),
    }


def normalize_application_status(raw: Any) -> str:
    s = str(raw or "").strip().lower()
    if s in ("awarded", "approved"):
        return "Awarded"
    if s in ("under review", "submitted", "submitted for review", "pending", "shortlisted"):
        return "submitted for review"
    if s == "draft":
        return "draft"
    if s == "rejected":
        return "Rejected"
    return "submitted for review"


def normalize_application_record(row: dict) -> dict:
    schol_id = row.get("scholarship_id") or row.get("schol_id")
    award = row.get("award_amount_(kes)") or row.get("award_amount")
    try:
        award_val = float(award) if award not in (None, "", "—", "-") else None
    except (TypeError, ValueError):
        award_val = None

    return {
        "application_id": row.get("application_id"),
        "student_id": str(row.get("student_id") or ""),
        "schol_id": str(schol_id) if schol_id is not None else None,
        "scholarship_name": row.get("scholarship_name"),
        "status": normalize_application_status(row.get("status")),
        "applied_date": row.get("applied_date"),
        "award_amount_(kes)": award_val,
        "gpa": row.get("gpa"),
        "notes": row.get("notes"),
        "source": "excel",
    }


MY_SCHOLARSHIPS_STATUSES = frozenset({"draft", "submitted for review", "awarded"})
