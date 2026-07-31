"""In-memory scholarship application workspace (drafts, references, mock catalog)."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

# Drafts keyed by "{student_id}:{schol_id}"
_scholarship_drafts: dict[str, dict] = {}

# Reference requests keyed by token
_reference_tokens: dict[str, dict] = {}

MOCK_SCHOLARSHIPS: list[dict] = [
    {
        "id": "MOCK-MERIT-01",
        "scholarship_name": "TemplumIS Academic Excellence Award",
        "type": "merit",
        "status": "open",
        "min_gpa": 3.5,
        "year": "Any",
        "open_to": "All",
        "amount_(kes)": 150000,
        "frequency": "Annual",
        "slots": 10,
        "remaining": 7,
        "deadline": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
        "description": "Merit scholarship for students with outstanding academic performance. Requires essay and one academic reference.",
        "requires_references": 1,
        "is_mock": True,
    },
    {
        "id": "MOCK-NEED-02",
        "scholarship_name": "Access & Equity Bursary",
        "type": "need-based",
        "status": "open",
        "min_gpa": 2.0,
        "year": "Any",
        "open_to": "All",
        "amount_(kes)": 80000,
        "frequency": "Annual",
        "slots": 20,
        "remaining": 12,
        "deadline": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
        "description": "Need-based support for students demonstrating financial need. Income verification documents required.",
        "requires_references": 0,
        "is_mock": True,
    },
    {
        "id": "MOCK-TALENT-03",
        "scholarship_name": "Sports & Athletics Scholarship",
        "type": "talent",
        "status": "open",
        "min_gpa": 2.5,
        "year": "Any",
        "open_to": "All",
        "amount_(kes)": 120000,
        "frequency": "Annual",
        "slots": 5,
        "remaining": 3,
        "deadline": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "description": "Talent scholarship for student-athletes. Portfolio links and coach reference required.",
        "requires_references": 1,
        "is_mock": True,
    },
    {
        "id": "MOCK-TALENT-04",
        "scholarship_name": "Innovation & Research Grant (UG)",
        "type": "talent",
        "status": "open",
        "min_gpa": 3.0,
        "year": "3+",
        "open_to": "STEM",
        "amount_(kes)": 200000,
        "frequency": "One-time",
        "slots": 4,
        "remaining": 2,
        "deadline": (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"),
        "description": "Supports undergraduate research portfolios (GitHub, publications, media samples).",
        "requires_references": 1,
        "is_mock": True,
    },
    {
        "id": "MOCK-MERIT-05",
        "scholarship_name": "Dean's List Honour Scholarship",
        "type": "merit",
        "status": "open",
        "min_gpa": 3.7,
        "year": "2+",
        "open_to": "All",
        "amount_(kes)": 100000,
        "frequency": "Annual",
        "slots": 8,
        "remaining": 5,
        "deadline": (datetime.now() + timedelta(hours=36)).strftime("%Y-%m-%d"),
        "description": "Prestigious merit award with committee review. Two academic references required.",
        "requires_references": 2,
        "is_mock": True,
    },
]

WORKFLOW_STATUSES = [
    "Under Triage",
    "Committee Phase",
    "Awaiting Decision",
    "Approved",
    "Rejected",
]


def merge_with_mock_scholarships(excel_rows: list[dict]) -> list[dict]:
    seen = {str(s.get("id")) for s in excel_rows}
    merged = list(excel_rows)
    for m in MOCK_SCHOLARSHIPS:
        if str(m["id"]) not in seen:
            merged.append(m)
    return merged


def draft_key(student_id: str, schol_id: str) -> str:
    return f"{student_id}:{schol_id}"


def get_draft(student_id: str, schol_id: str) -> Optional[dict]:
    return _scholarship_drafts.get(draft_key(student_id, schol_id))


def save_draft(student_id: str, schol_id: str, payload: dict) -> dict:
    key = draft_key(student_id, schol_id)
    now = datetime.utcnow().isoformat() + "Z"
    existing = _scholarship_drafts.get(key, {})
    record = {
        "student_id": str(student_id),
        "schol_id": str(schol_id),
        "status": "Draft",
        "workflow_status": None,
        "form_data": payload.get("form_data") or existing.get("form_data") or {},
        "references": payload.get("references") if payload.get("references") is not None else existing.get("references") or [],
        "ferpa_waived": payload.get("ferpa_waived") if "ferpa_waived" in payload else existing.get("ferpa_waived"),
        "scholarship_snapshot": payload.get("scholarship_snapshot") or existing.get("scholarship_snapshot"),
        "updated_at": now,
        "created_at": existing.get("created_at") or now,
        "progress_pct": payload.get("progress_pct", 0),
    }
    _scholarship_drafts[key] = record
    return record


def list_drafts_for_student(student_id: str) -> list[dict]:
    return [d for d in _scholarship_drafts.values() if str(d.get("student_id")) == str(student_id)]


def delete_draft(student_id: str, schol_id: str) -> None:
    _scholarship_drafts.pop(draft_key(student_id, schol_id), None)


def _normalize_type(scholarship: dict) -> str:
    t = str(scholarship.get("type") or "merit").lower()
    if "need" in t:
        return "need-based"
    if t in ("sports", "research", "talent"):
        return "talent"
    return "merit"


def required_field_keys(scholarship: dict) -> list[str]:
    t = _normalize_type(scholarship)
    base = ["personal_statement_ack"]
    if t == "merit":
        return base + ["essay_merit"]
    if t == "need-based":
        return base + ["supporting_documents"]
    return base + ["portfolio_url", "talent_statement"]


def _has_supporting_documents(form_data: dict) -> bool:
    docs = form_data.get("supporting_documents")
    if isinstance(docs, list) and any(d.get("name") for d in docs if isinstance(d, dict)):
        return True
    meta = form_data.get("income_doc_meta")
    return bool(meta and meta.get("name"))


def calc_progress(scholarship: dict, form_data: dict, references: list) -> int:
    required = required_field_keys(scholarship)
    ref_needed = int(scholarship.get("requires_references") or 0)
    if ref_needed:
        required = required + [f"ref_{i}" for i in range(ref_needed)]

    completed = 0
    for key in required:
        if key.startswith("ref_"):
            idx = int(key.split("_")[1])
            ref = references[idx] if idx < len(references) else {}
            if ref.get("status") == "completed":
                completed += 1
            elif ref.get("email") and ref.get("name"):
                completed += 0.5
        elif key == "supporting_documents":
            if _has_supporting_documents(form_data):
                completed += 1
        elif key.endswith("_meta"):
            if form_data.get(key) and form_data[key].get("name"):
                completed += 1
        elif form_data.get(key) and str(form_data.get(key)).strip():
            completed += 1

    total = len(required) or 1
    return min(100, int((completed / total) * 100))


def validate_submission(
    scholarship: dict,
    form_data: dict,
    references: list,
    ferpa_waived: Optional[bool],
    *,
    require_references: bool = True,
) -> list[dict]:
    errors = []
    for key in required_field_keys(scholarship):
        if key == "supporting_documents":
            if not _has_supporting_documents(form_data):
                errors.append({
                    "field": key,
                    "message": "Upload at least one supporting certified document",
                })
        elif key.endswith("_meta"):
            meta = form_data.get(key)
            if not meta or not meta.get("name"):
                errors.append({"field": key, "message": "Required document upload missing"})
        elif key == "personal_statement_ack":
            if not form_data.get(key):
                errors.append({"field": key, "message": "Profile confirmation is required"})
        elif not form_data.get(key) or not str(form_data.get(key)).strip():
            label = key.replace("_", " ").title()
            errors.append({"field": key, "message": f"{label} is required"})

    ref_needed = int(scholarship.get("requires_references") or 0) if require_references else 0
    if ref_needed and ferpa_waived is None:
        errors.append({"field": "ferpa_waived", "message": "You must choose a FERPA waiver option before submitting"})

    for i in range(ref_needed):
        ref = references[i] if i < len(references) else {}
        if ref.get("status") != "completed":
            errors.append({
                "field": f"references[{i}]",
                "message": f"Reference {i + 1} must be completed before submission",
            })

    essay = form_data.get("essay_merit", "")
    if essay and _normalize_type(scholarship) == "merit":
        words = len(essay.split())
        target = 500
        if words < target * 0.9 or words > target * 1.1:
            errors.append({
                "field": "essay_merit",
                "message": f"Essay must be {target} words (±10%). Current: {words} words",
            })

    return errors


def create_reference_token(student_id: str, schol_id: str, ref_index: int, recommender: dict, ferpa_waived: bool) -> str:
    raw = f"{student_id}:{schol_id}:{ref_index}:{secrets.token_hex(8)}"
    token = hashlib.sha256(raw.encode()).hexdigest()
    _reference_tokens[token] = {
        "token": token,
        "student_id": str(student_id),
        "schol_id": str(schol_id),
        "ref_index": ref_index,
        "recommender": recommender,
        "ferpa_waived": ferpa_waived,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "completed_at": None,
        "rating": None,
        "upload_meta": None,
    }
    return token


def get_reference_by_token(token: str) -> Optional[dict]:
    return _reference_tokens.get(token)


def complete_reference(token: str, rating: str, upload_meta: dict) -> dict:
    rec = _reference_tokens.get(token)
    if not rec:
        raise ValueError("Invalid token")
    rec["status"] = "completed"
    rec["rating"] = rating
    rec["upload_meta"] = upload_meta
    rec["completed_at"] = datetime.utcnow().isoformat() + "Z"

    key = draft_key(rec["student_id"], rec["schol_id"])
    draft = _scholarship_drafts.get(key)
    if draft:
        refs = draft.get("references") or []
        idx = rec["ref_index"]
        while len(refs) <= idx:
            refs.append({})
        refs[idx] = {
            **refs[idx],
            **rec.get("recommender", {}),
            "status": "completed",
            "token": token,
        }
        draft["references"] = refs
        draft["progress_pct"] = calc_progress(
            draft.get("scholarship_snapshot") or {},
            draft.get("form_data") or {},
            refs,
        )
    return rec


def build_alerts(drafts: list[dict], scholarships_by_id: dict) -> list[dict]:
    alerts = []
    now = datetime.now()
    for d in drafts:
        schol = scholarships_by_id.get(str(d.get("schol_id"))) or d.get("scholarship_snapshot") or {}
        deadline_str = schol.get("deadline")
        if deadline_str:
            try:
                deadline = datetime.strptime(str(deadline_str)[:10], "%Y-%m-%d")
                hours_left = (deadline - now).total_seconds() / 3600
                if 0 < hours_left <= 48:
                    alerts.append({
                        "severity": "warning",
                        "message": f"Deadline approaching: {schol.get('scholarship_name', 'Scholarship')} — {int(hours_left)} hours left",
                        "schol_id": d.get("schol_id"),
                    })
            except ValueError:
                pass

        refs = d.get("references") or []
        pending_refs = [r for r in refs if r.get("email") and r.get("status") != "completed"]
        if pending_refs:
            alerts.append({
                "severity": "error",
                "message": "Action Required: Reference letter missing — recommender has not responded",
                "schol_id": d.get("schol_id"),
            })
    return alerts
