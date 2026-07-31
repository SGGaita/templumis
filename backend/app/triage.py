"""Stage 4: Administrative triage, workload balancing, blind-review anonymization."""

from __future__ import annotations

import hashlib
import re
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app import scholarship_catalog as catalog
from app.evaluation import EVAL_PENDING
from app.models import ScholarshipReviewAssignment, StudentScholarshipApplication, User
from app.scholarship_catalog import (
    INSTITUTION_COUNTRY,
    _is_institution_country_student,
    _normalize_residency_code,
    _student_matches_rules,
)

QUEUE_PENDING = "pending_triage"
QUEUE_REJECTION_AUTO = "rejection_automated"
QUEUE_DOC_VERIFY = "document_verification"
QUEUE_READY = "ready_for_committee"
QUEUE_ASSIGNED = "assigned"

COMMITTEE_ROLES = frozenset(
    {"registrar", "vice_chancellor", "institution_admin", "global_admin", "scholarship_reviewer"}
)

_REDACT_PATTERNS = [
    (
        re.compile(
            r"\b(?:as a|i am a|being a)\s+(male|female|non-?binary)\s+(?:student|applicant)\b",
            re.I,
        ),
        "[Gender identification redacted]",
    ),
    (
        re.compile(
            r"\b(?:at|from|in)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:High School|Secondary|Academy)\b",
            re.I,
        ),
        "at [High school redacted]",
    ),
    (
        re.compile(r"\bmy name is\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b", re.I),
        "my name is [Name redacted]",
    ),
    (
        re.compile(r"\b(?:kenyan?|nigerian|ugandan|tanzanian|ethiopian)\s+(?:student|citizen)\b", re.I),
        "[National origin redacted]",
    ),
]


def _float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def generate_anonymized_id(student_number: str, cycle_year: int, salt: str) -> str:
    raw = f"{student_number}:{cycle_year}:{salt}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:8].upper()
    return f"APP-{cycle_year}-{digest}"


def scrub_essay_text(text: str) -> str:
    if not text:
        return ""
    out = str(text)
    for pattern, replacement in _REDACT_PATTERNS:
        out = pattern.sub(replacement, out)
    return out


def compute_need_index(form_data: dict, program_type: str) -> Optional[int]:
    """Normalized 0–100 need indicator (no exact dollar amounts in blind view)."""
    if "need" not in str(program_type or "").lower():
        return None
    docs = form_data.get("supporting_documents") or []
    if not isinstance(docs, list):
        docs = []
    doc_score = min(40, len(docs) * 12)
    ack = 25 if form_data.get("personal_statement_ack") else 0
    return min(100, 35 + doc_score + ack)


def _student_profile_from_excel(student: dict, stats: Optional[dict] = None) -> dict:
    stats = stats or {}
    return {
        "gpa": _float(student.get("gpa") or stats.get("gpa")),
        "credits_completed": _float(
            student.get("credits_completed")
            or student.get("credit_hours_earned")
            or stats.get("total_credits_completed")
        ),
        "total_credits_completed": _float(stats.get("total_credits_completed")),
        "major": str(student.get("major") or ""),
        "program": str(student.get("program") or ""),
        "gender": str(student.get("gender") or ""),
        "nationality": str(student.get("nationality") or ""),
        "year_of_study": student.get("year_of_study"),
        "student_type": student.get("student_type"),
        "programme_level": student.get("programme_level"),
    }


def _residency_required_label(codes: list) -> str:
    normalized = {_normalize_residency_code(c) for c in codes}
    if "international" in normalized and "institution_country" not in normalized:
        return "International students only"
    if "institution_country" in normalized and "international" not in normalized:
        return f"Institution country ({INSTITUTION_COUNTRY.title()}) students only"
    return "No residency restriction"


def _parse_year_number(year_of_study: Any) -> Optional[int]:
    m = re.search(r"(\d+)", str(year_of_study or ""))
    return int(m.group(1)) if m else None


def build_eligibility_comparison(
    student: dict,
    stats: dict,
    program: dict,
    form_data: Optional[dict] = None,
) -> dict:
    """
    Side-by-side criterion checks for FAO triage review.
    Each row: criterion, required, actual, passes, category.
    """
    form_data = form_data or {}
    profile = _student_profile_from_excel(student, stats)
    rules = dict(program.get("eligibility_rules") or {})
    if program.get("min_gpa") is not None:
        rules["min_gpa"] = float(program["min_gpa"])

    checks: list[dict] = []

    min_gpa = rules.get("min_gpa")
    if min_gpa is not None:
        gpa = profile["gpa"]
        checks.append(
            {
                "criterion": "Minimum GPA",
                "required": f"{float(min_gpa):.2f}",
                "actual": f"{gpa:.2f}",
                "passes": gpa >= float(min_gpa),
                "category": "academic",
            }
        )

    min_credits = rules.get("min_credits")
    if min_credits is not None:
        credits = profile["credits_completed"] or profile["total_credits_completed"]
        checks.append(
            {
                "criterion": "Minimum credits completed",
                "required": str(int(float(min_credits))),
                "actual": str(int(credits)),
                "passes": credits >= float(min_credits),
                "category": "academic",
            }
        )

    residency = rules.get("residency") or []
    if residency:
        domestic = _is_institution_country_student(profile)
        codes = {_normalize_residency_code(r) for r in residency}
        if "international" in codes and "institution_country" not in codes:
            passes = not domestic
            actual = "International" if passes else f"Institution country ({profile.get('nationality') or '—'})"
        elif "institution_country" in codes and "international" not in codes:
            passes = domestic
            actual = f"Institution country ({profile.get('nationality') or '—'})" if passes else "International"
        else:
            passes = True
            actual = profile.get("nationality") or "—"
        checks.append(
            {
                "criterion": "Residency / nationality",
                "required": _residency_required_label(residency),
                "actual": actual,
                "passes": passes,
                "category": "demographic",
            }
        )

    majors = rules.get("majors") or []
    if majors:
        combined = f"{profile.get('major', '')} {profile.get('program', '')}".strip()
        passes = any(str(m).lower() in combined.lower() for m in majors)
        checks.append(
            {
                "criterion": "Programme / major",
                "required": ", ".join(str(m) for m in majors),
                "actual": combined or "—",
                "passes": passes,
                "category": "programme",
            }
        )

    prog_year = program.get("year")
    if prog_year and str(prog_year).lower() not in ("any", "all years", ""):
        student_year = _parse_year_number(profile.get("year_of_study"))
        req_label = str(prog_year)
        if student_year is not None and "+" in req_label:
            min_y = _parse_year_number(req_label) or 1
            passes = student_year >= min_y
            actual = f"Year {student_year}"
        elif student_year is not None:
            passes = str(student_year) in req_label
            actual = f"Year {student_year}"
        else:
            passes = False
            actual = str(profile.get("year_of_study") or "—")
        checks.append(
            {
                "criterion": "Year of study",
                "required": req_label,
                "actual": actual,
                "passes": passes,
                "category": "academic",
            }
        )

    open_to = program.get("open_to")
    if open_to and str(open_to).strip().lower() not in ("all", "all programs", "all students", "any"):
        combined = f"{profile.get('program', '')} {profile.get('major', '')}".lower()
        passes = (
            str(open_to).lower() in combined
            or combined in str(open_to).lower()
            or any(tok in combined for tok in str(open_to).lower().split() if len(tok) > 3)
        )
        checks.append(
            {
                "criterion": "Open to",
                "required": str(open_to),
                "actual": f"{profile.get('program', '')} · {profile.get('major', '')}".strip(" ·"),
                "passes": passes,
                "category": "programme",
            }
        )

    if is_need_based_program(program):
        docs = form_data.get("supporting_documents") or []
        doc_count = len(docs) if isinstance(docs, list) else 0
        if not doc_count and form_data.get("income_doc_meta", {}).get("name"):
            doc_count = 1
        checks.append(
            {
                "criterion": "Supporting certified documents",
                "required": "At least 1 document uploaded",
                "actual": f"{doc_count} document(s) on file",
                "passes": doc_count >= 1,
                "category": "documents",
            }
        )

    refs_needed = int(program.get("requires_references") or 0)
    if refs_needed > 0:
        checks.append(
            {
                "criterion": "References",
                "required": f"{refs_needed} completed reference(s)",
                "actual": "See application references panel",
                "passes": None,
                "category": "application",
            }
        )

    ok, reasons = evaluate_live_eligibility(student, stats, program)
    logic = program.get("logic_expression") or {}
    return {
        "checks": checks,
        "overall_pass": ok,
        "failure_reasons": reasons,
        "program_requirements": {
            "scholarship_name": program.get("scholarship_name"),
            "type": program.get("type"),
            "description": program.get("description") or "",
            "min_gpa": program.get("min_gpa"),
            "open_to": program.get("open_to"),
            "year": program.get("year"),
            "amount_kes": program.get("amount_(kes)"),
            "eligibility_rules": rules,
            "logic_summary": logic.get("summary") if isinstance(logic, dict) else None,
            "logic_mode": logic.get("mode") or logic.get("op"),
        },
        "applicant_profile": {
            "gpa": profile["gpa"],
            "credits_completed": profile["credits_completed"],
            "major": profile.get("major"),
            "program": profile.get("program"),
            "year_of_study": profile.get("year_of_study"),
            "nationality": profile.get("nationality"),
            "gender": profile.get("gender"),
            "enrollment_status": student.get("status") or "Active",
        },
    }


def evaluate_live_eligibility(
    student: dict,
    stats: dict,
    program: dict,
) -> tuple[bool, list[str]]:
    """Re-check Stage 1 hard constraints against current SIS data."""
    reasons: list[str] = []
    profile = _student_profile_from_excel(student, stats)
    rules = program.get("eligibility_rules") or {}
    if program.get("min_gpa") is not None:
        rules = {**rules, "min_gpa": float(program["min_gpa"])}

    gpa = profile["gpa"]
    min_gpa = rules.get("min_gpa")
    if min_gpa is not None and gpa < float(min_gpa):
        reasons.append(f"GPA {gpa:.2f} below minimum {float(min_gpa):.2f}")

    min_credits = rules.get("min_credits")
    if min_credits is not None:
        credits = profile["credits_completed"] or profile["total_credits_completed"]
        if credits < float(min_credits):
            reasons.append(f"Credits {int(credits)} below minimum {int(min_credits)}")

    if not _student_matches_rules(profile, rules):
        reasons.append("Eligibility rules no longer met (programme, residency, or major)")

    return (len(reasons) == 0, reasons)


def is_need_based_program(program: dict) -> bool:
    t = str(program.get("type") or "").lower()
    return "need" in t


def has_supporting_documents(form_data: dict) -> bool:
    docs = form_data.get("supporting_documents") or []
    if isinstance(docs, list) and any(d.get("name") for d in docs if isinstance(d, dict)):
        return True
    legacy = form_data.get("income_doc_meta")
    return bool(legacy and legacy.get("name"))


def _count_supporting_documents(form_data: dict) -> int:
    docs = form_data.get("supporting_documents") or []
    count = len([d for d in docs if isinstance(d, dict) and d.get("name")]) if isinstance(docs, list) else 0
    if count == 0 and form_data.get("income_doc_meta", {}).get("name"):
        count = 1
    return count


def _load_student_fee_summary(student_id: str) -> dict:
    """Fee balance and payment status from Excel SIS."""
    try:
        from app.routes.sis_lms import (
            _fee_balance,
            _fee_billed,
            _fee_paid,
            _fee_status,
            _float_field,
            load_excel_data,
            sheet_to_dict_list,
        )

        wb = load_excel_data()
        student = None
        if "Students" in wb.sheetnames:
            student = next(
                (s for s in sheet_to_dict_list(wb["Students"]) if s.get("student_id") == student_id),
                None,
            )
        fee_records = []
        if "Fee Records" in wb.sheetnames:
            fee_records = [
                f for f in sheet_to_dict_list(wb["Fee Records"]) if f.get("student_id") == student_id
            ]
        wb.close()

        total_billed = sum(_fee_billed(f) for f in fee_records)
        total_paid = sum(_fee_paid(f) for f in fee_records)
        balance = sum(_fee_balance(f) for f in fee_records)
        if student:
            sheet_balance = _float_field(student, "fees_balance_(kes)", "balance_due")
            if sheet_balance > 0:
                balance = sheet_balance
            payment_status = (
                _fee_status(fee_records[0])
                if fee_records
                else str(student.get("fees_status") or student.get("payment_status") or "Unknown")
            )
        else:
            payment_status = _fee_status(fee_records[0]) if fee_records else "Unknown"

        return {
            "total_billed": total_billed,
            "total_paid": total_paid,
            "balance_due": balance,
            "payment_status": payment_status,
        }
    except Exception:
        return {
            "total_billed": 0.0,
            "total_paid": 0.0,
            "balance_due": 0.0,
            "payment_status": "Unknown",
        }


def _need_level_label(index: Optional[int]) -> str:
    if index is None:
        return "Not calculated — run high-pass filter"
    if index >= 70:
        return "High documented need"
    if index >= 50:
        return "Moderate documented need"
    return "Lower documented need"


def _format_kes(amount: float) -> str:
    return f"KES {amount:,.0f}"


def build_financial_need_summary(
    row: StudentScholarshipApplication,
    program: dict,
    form_data: dict,
    student: dict,
) -> dict:
    """Table-friendly summary of why a need-based applicant is in the pool."""
    need_based = is_need_based_program(program)
    if not need_based:
        return {
            "is_need_based": False,
            "overall_status": "Not a need-based programme",
            "rows": [],
        }

    doc_count = _count_supporting_documents(form_data)
    fees = _load_student_fee_summary(str(row.student_number))
    need_index = row.need_index
    if need_index is None:
        need_index = compute_need_index(form_data, program.get("type", ""))

    rows: list[dict] = [
        {
            "indicator": "Programme type",
            "value": program.get("type") or "Need-based",
            "status": "Need-based scholarship — financial documentation expected",
        },
        {
            "indicator": "SIS fee balance",
            "value": _format_kes(fees["balance_due"]) if fees["balance_due"] > 0 else "No outstanding balance",
            "status": (
                "Outstanding arrears on student account"
                if fees["balance_due"] > 0
                else "No fee arrears recorded in SIS"
            ),
        },
        {
            "indicator": "Payment status (SIS)",
            "value": fees["payment_status"],
            "status": (
                "Account flagged for payment difficulty"
                if str(fees["payment_status"]).lower() in ("in arrears", "overdue", "partial", "unpaid", "outstanding")
                else "Routine payment standing"
            ),
        },
        {
            "indicator": "Fees billed / paid",
            "value": f"{_format_kes(fees['total_billed'])} billed · {_format_kes(fees['total_paid'])} paid",
            "status": "Institutional billing snapshot from fee records",
        },
        {
            "indicator": "Supporting documents",
            "value": f"{doc_count} uploaded" if doc_count else "None uploaded",
            "status": (
                "Income / hardship evidence on file"
                if doc_count
                else "Missing required financial documentation"
            ),
        },
        {
            "indicator": "Documents certified (FAO)",
            "value": "Yes" if row.documents_verified else "No",
            "status": (
                "Financial Aid verified supporting documents"
                if row.documents_verified
                else "Awaiting Financial Aid document certification"
            ),
        },
        {
            "indicator": "Need index",
            "value": f"{need_index} / 100" if need_index is not None else "—",
            "status": _need_level_label(need_index),
        },
        {
            "indicator": "Profile confirmed",
            "value": "Yes" if form_data.get("personal_statement_ack") else "No",
            "status": "Student attested SIS profile accuracy",
        },
    ]

    if row.documents_verified and (need_index or 0) >= 50:
        overall = "Verified need — ready for committee scoring"
    elif doc_count and fees["balance_due"] > 0:
        overall = "Documented hardship with outstanding fee balance"
    elif fees["balance_due"] > 0:
        overall = "Fee arrears on SIS — limited uploaded documentation"
    elif doc_count:
        overall = "Documents submitted — pending full verification"
    else:
        overall = "Need-based application — review financial evidence"

    return {
        "is_need_based": True,
        "need_index": need_index,
        "overall_status": overall,
        "fee_balance": fees["balance_due"],
        "payment_status": fees["payment_status"],
        "document_count": doc_count,
        "documents_verified": bool(row.documents_verified),
        "rows": rows,
    }


def run_high_pass_filter(
    db: Session,
    applications: list[StudentScholarshipApplication],
    programs: dict[str, dict],
    students: dict[str, dict],
    stats_by_student: dict[str, dict],
) -> dict:
    """Route failing applications to rejection_automated; others to doc verify or ready."""
    rejected = 0
    doc_queue = 0
    ready = 0

    for row in applications:
        st = str(row.status or "").lower()
        if st not in ("submitted for review", "pending", "under review"):
            continue
        if row.triage_queue == QUEUE_REJECTION_AUTO:
            continue

        program = programs.get(str(row.scholarship_external_id)) or {}
        student = students.get(str(row.student_number)) or {}
        stats = stats_by_student.get(str(row.student_number)) or {}
        ok, reasons = evaluate_live_eligibility(student, stats, program)

        if not ok:
            row.triage_queue = QUEUE_REJECTION_AUTO
            row.status = "rejection - automated"
            row.auto_reject_reason = "; ".join(reasons)
            rejected += 1
            continue

        form_data = row.form_data or {}
        if is_need_based_program(program) and not has_supporting_documents(form_data):
            row.triage_queue = QUEUE_DOC_VERIFY
            row.documents_verified = False
            doc_queue += 1
        elif is_need_based_program(program):
            row.triage_queue = QUEUE_DOC_VERIFY
            doc_queue += 1
        else:
            row.triage_queue = QUEUE_READY
            ready += 1

        row.need_index = compute_need_index(form_data, program.get("type", ""))

    db.commit()
    return {"rejected": rejected, "document_verification": doc_queue, "ready_for_committee": ready}


def run_high_pass_single(
    db: Session,
    row: StudentScholarshipApplication,
    programs: dict[str, dict],
    students: dict[str, dict],
    stats_by_student: dict[str, dict],
) -> dict:
    """Run high-pass screening on one application."""
    st = str(row.status or "").lower()
    if st not in ("submitted for review", "pending", "under review"):
        return {"error": "Application is not in a screenable status", "triage_queue": row.triage_queue}
    if row.triage_queue == QUEUE_REJECTION_AUTO:
        return {"error": "Application is already auto-rejected", "triage_queue": row.triage_queue}

    program = programs.get(str(row.scholarship_external_id)) or {}
    student = students.get(str(row.student_number)) or {}
    stats = stats_by_student.get(str(row.student_number)) or {}
    ok, reasons = evaluate_live_eligibility(student, stats, program)

    if not ok:
        row.triage_queue = QUEUE_REJECTION_AUTO
        row.status = "rejection - automated"
        row.auto_reject_reason = "; ".join(reasons)
        db.commit()
        return {"outcome": "rejected", "triage_queue": row.triage_queue, "auto_reject_reason": row.auto_reject_reason}

    form_data = row.form_data or {}
    if is_need_based_program(program) and not has_supporting_documents(form_data):
        row.triage_queue = QUEUE_DOC_VERIFY
        row.documents_verified = False
        outcome = "document_verification"
    elif is_need_based_program(program):
        row.triage_queue = QUEUE_DOC_VERIFY
        outcome = "document_verification"
    else:
        row.triage_queue = QUEUE_READY
        outcome = "ready_for_committee"

    row.need_index = compute_need_index(form_data, program.get("type", ""))
    db.commit()
    return {"outcome": outcome, "triage_queue": row.triage_queue, "need_index": row.need_index}


def eligible_assignment_pool(applications: list[StudentScholarshipApplication]) -> list:
    """Applications ready for committee assignment."""
    return [
        a
        for a in applications
        if (
            a.triage_queue == QUEUE_READY
            or (a.triage_queue == QUEUE_DOC_VERIFY and a.documents_verified)
        )
        and str(a.status or "").lower() not in ("rejection - automated", "rejected", "draft")
    ]


def assign_reviewers(
    db: Session,
    applications: list[StudentScholarshipApplication],
    reviewers: list[User],
    min_per_app: int,
    *,
    application_ids: Optional[list[int]] = None,
) -> dict:
    """Distribute ready applications across committee reviewers with overlap."""
    if not reviewers:
        return {"error": "No committee reviewers selected", "assigned": 0, "pool_size": 0}

    pool = eligible_assignment_pool(applications)
    if application_ids is not None:
        id_set = {int(i) for i in application_ids}
        pool = [a for a in pool if a.id in id_set]

    if not pool:
        return {
            "assigned": 0,
            "reviewers": len(reviewers),
            "pool_size": 0,
            "message": "No applications in the ready pool. Run high-pass and certify documents first.",
        }

    min_per_app = max(1, min(min_per_app, len(reviewers)))
    r_count = len(reviewers)
    target_per_reviewer = len(pool) * min_per_app / r_count if r_count else 0
    loads = {rev.id: 0 for rev in reviewers}

    for app in pool:
        db.query(ScholarshipReviewAssignment).filter(
            ScholarshipReviewAssignment.application_id == app.id
        ).delete()

        chosen = sorted(reviewers, key=lambda r: loads[r.id])[:min_per_app]
        for slot, rev in enumerate(chosen, start=1):
            db.add(
                ScholarshipReviewAssignment(
                    application_id=app.id,
                    reviewer_user_id=rev.id,
                    assignment_slot=slot,
                    status="pending",
                )
            )
            loads[rev.id] += 1
        app.triage_queue = QUEUE_ASSIGNED
        app.evaluation_status = EVAL_PENDING

    db.commit()
    reviewer_loads = [
        {
            "reviewer_id": rev.id,
            "name": rev.full_name,
            "role": rev.role.value if hasattr(rev.role, "value") else str(rev.role),
            "new_assignments": loads[rev.id],
        }
        for rev in reviewers
    ]
    return {
        "assigned": len(pool),
        "reviewers": r_count,
        "min_reviewers_per_application": min_per_app,
        "target_per_reviewer": round(target_per_reviewer, 1),
        "pool_size": len(pool),
        "reviewer_loads": reviewer_loads,
    }


def build_blind_payload(
    row: StudentScholarshipApplication,
    program: dict,
    student: dict,
    stats: dict,
    *,
    include_mapping: bool = False,
    blind: bool = True,
) -> dict:
    """Application view for committee / FAO. When blind=False, full essay and applicant identity are shown."""
    form_data = row.form_data or {}
    essay_raw = form_data.get("essay_merit") or form_data.get("talent_statement") or ""
    essay = scrub_essay_text(essay_raw) if blind else essay_raw
    show_identity = include_mapping or not blind
    profile = _student_profile_from_excel(student, stats)

    blind = {
        "application_id": row.id,
        "anonymized_id": row.anonymized_id,
        "scholarship_name": program.get("scholarship_name"),
        "program_type": program.get("type"),
        "triage_queue": row.triage_queue,
        "status": row.status,
        "documents_verified": row.documents_verified,
        "applied_date": row.applied_date.isoformat() if row.applied_date else None,
        "objective_metrics": {
            "gpa": _float(row.gpa_at_application or profile["gpa"]),
            "credits_completed": _float(
                profile["credits_completed"] or profile["total_credits_completed"]
            ),
            "major": student.get("major") or "—",
            "program": student.get("program") or "—",
            "enrollment_status": student.get("status") or "Active",
            "need_index": row.need_index,
        },
        "masked_fields": None if not blind else {
            "student_name": None,
            "date_of_birth": None,
            "gender": None,
            "ethnicity": None,
            "national_origin": None,
            "postal_code": None,
            "high_school": "Classification withheld",
            "profile_photo": None,
        },
        "essay_scrubbed": essay,
        "supporting_document_count": len(form_data.get("supporting_documents") or []),
        "personal_statement_ack": bool(form_data.get("personal_statement_ack")),
        "blind_review": blind,
    }

    if show_identity:
        blind["mapping"] = {
            "student_number": row.student_number,
            "student_name": student.get("full_name"),
            "email": student.get("email"),
        }
        blind["student_name"] = student.get("full_name")

    return blind


def ensure_anonymized_ids(
    db: Session,
    rows: list[StudentScholarshipApplication],
    cycle_year: int,
    salt: str,
) -> None:
    for row in rows:
        if not row.anonymized_id:
            row.anonymized_id = generate_anonymized_id(row.student_number, cycle_year, salt)
    db.commit()
