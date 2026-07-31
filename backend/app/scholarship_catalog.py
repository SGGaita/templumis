"""Scholarship opportunity catalogue — PostgreSQL (replaces Excel Scholarships sheet)."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models import ScholarshipProgram, StudentScholarshipApplication
from app.scholarship_excel import _parse_min_gpa


def _float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def committed_liability(db: Session, program: ScholarshipProgram) -> float:
    """Sum of active offers + accepted awards against this program's budget."""
    rows = (
        db.query(StudentScholarshipApplication)
        .filter(
            StudentScholarshipApplication.scholarship_external_id == program.external_id,
            StudentScholarshipApplication.status.in_(
                ["submitted for review", "awarded", "approved", "Under Review"]
            ),
        )
        .all()
    )
    total = 0.0
    for row in rows:
        if row.award_amount is not None:
            total += float(row.award_amount)
        else:
            total += float(program.value_kes or 0)
    return total


def remaining_budget(db: Session, program: ScholarshipProgram) -> Optional[float]:
    allocated = program.budget_total_allocated
    if allocated is None:
        return None
    return float(allocated) - committed_liability(db, program)


def program_to_api_dict(db: Session, row: ScholarshipProgram, *, include_admin: bool = False) -> dict:
    """API shape aligned with legacy normalize_scholarship_record."""
    slots_avail = int(row.slots_available or 0)
    slots_filled = int(row.slots_filled or 0)
    is_published = str(row.workflow_status or "").lower() == "published"
    remaining_slots = max(0, slots_avail - slots_filled)

    out = {
        "id": str(row.external_id),
        "db_id": row.id,
        "scholarship_name": row.title,
        "type": row.program_type or "General",
        "description": row.criteria_text or "",
        "amount_(kes)": float(row.value_kes or 0),
        "coverage": row.coverage,
        "slots": slots_avail,
        "remaining": remaining_slots,
        "min_gpa": float(row.min_gpa) if row.min_gpa is not None else _parse_min_gpa(row.criteria_text),
        "year": row.academic_year or "Any",
        "open_to": row.open_to or "All",
        "frequency": row.coverage or "Per award",
        "deadline": row.application_deadline.isoformat() if row.application_deadline else None,
        "status": "open" if is_published and remaining_slots > 0 else ("closed" if is_published else row.workflow_status),
        "requires_references": int(row.requires_references or 0),
        "workflow_status": row.workflow_status,
        "sponsoring_entity": row.sponsoring_entity,
        "gl_code": row.gl_code,
        "valuation_type": row.valuation_type,
        "valuation_config": row.valuation_config or {},
        "eligibility_rules": row.eligibility_rules or {},
        "logic_expression": row.logic_expression or {},
        "budget_total_allocated": float(row.budget_total_allocated) if row.budget_total_allocated else None,
        "remaining_budget": remaining_budget(db, row),
        "over_award_tolerance_pct": float(row.over_award_tolerance_pct or 100),
    }
    if include_admin:
        out.update(
            {
                "slots_filled": slots_filled,
                "created_by": row.created_by,
                "approved_by": row.approved_by,
                "approved_at": row.approved_at.isoformat() if row.approved_at else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            }
        )
    rules = row.eligibility_rules or {}
    if rules.get("grant_category") == "pi" or str(row.external_id or "").startswith("pi-"):
        out["category"] = "pi"
        out["pi_name"] = rules.get("pi_name")
        out["pi_department"] = rules.get("pi_department")
        out["endorsement_required"] = bool(rules.get("endorsement_required", True))
        sow = rules.get("scope_of_work") or {}
        out["scope_of_work"] = sow
        out["position_type"] = sow.get("position_type") or "phd"
    return out


def load_programs(
    db: Session,
    *,
    program_kind: Optional[str] = "scholarship",
    published_only: bool = False,
    open_only: bool = False,
    institution_id: Optional[int] = None,
    include_admin: bool = False,
) -> list[dict]:
    q = db.query(ScholarshipProgram).order_by(ScholarshipProgram.external_id)
    if program_kind:
        q = q.filter(ScholarshipProgram.program_kind == program_kind)
    if institution_id is not None:
        q = q.filter(
            (ScholarshipProgram.institution_id == institution_id)
            | (ScholarshipProgram.institution_id.is_(None))
        )
    if published_only:
        q = q.filter(ScholarshipProgram.workflow_status == "published")
    rows = q.all()
    out = [program_to_api_dict(db, r, include_admin=include_admin) for r in rows]
    if open_only:
        out = [s for s in out if str(s.get("status", "")).lower() == "open"]
    return out


def programs_lookup(db: Session, **kwargs) -> dict[str, dict]:
    return {str(s["id"]): s for s in load_programs(db, **kwargs) if s.get("id")}


def get_program_by_external_id(db: Session, external_id: str) -> Optional[ScholarshipProgram]:
    return (
        db.query(ScholarshipProgram)
        .filter(ScholarshipProgram.external_id == str(external_id))
        .first()
    )


def ensure_pi_grants_seeded(db: Session) -> int:
    added = _seed_rows(db, SEED_PI_GRANTS, "grant")
    _sync_pi_grant_scope_of_work(db)
    return added


def _sync_pi_grant_scope_of_work(db: Session) -> None:
    """Backfill scope_of_work on existing PI grant programmes."""
    by_id = {raw["external_id"]: raw for raw in SEED_PI_GRANTS}
    rows = (
        db.query(ScholarshipProgram)
        .filter(ScholarshipProgram.external_id.like("pi-%"))
        .all()
    )
    changed = False
    for row in rows:
        seed = by_id.get(str(row.external_id))
        if not seed:
            continue
        rules = dict(row.eligibility_rules or {})
        seed_sow = (seed.get("eligibility_rules") or {}).get("scope_of_work")
        if seed_sow and rules.get("scope_of_work") != seed_sow:
            rules["scope_of_work"] = seed_sow
            row.eligibility_rules = rules
            changed = True
    if changed:
        db.commit()


def get_grant_program(db: Session, external_id: str) -> Optional[ScholarshipProgram]:
    """Resolve a grant programme, auto-seeding PI grants (pi-xxx) when missing."""
    ext = str(external_id)
    row = get_program_by_external_id(db, ext)
    if row and row.program_kind == "grant":
        return row
    if ext.startswith("pi-"):
        ensure_pi_grants_seeded(db)
        row = get_program_by_external_id(db, ext)
        if row and row.program_kind == "grant":
            return row
    return None if not row or row.program_kind != "grant" else row


INSTITUTION_COUNTRY = "kenya"


def _normalize_residency_code(code: str) -> str:
    c = str(code or "").lower().strip()
    if c in ("in_state", "out_of_state", "kenyan", "kenya", "domestic"):
        return "institution_country"
    return c


def _is_institution_country_student(student: dict, institution_country: str = INSTITUTION_COUNTRY) -> bool:
    nat = str(student.get("nationality") or "").lower().strip()
    home = institution_country.lower()
    if not nat:
        return True
    if nat in (home, "kenyan") and home == "kenya":
        return True
    if home in nat or nat in home:
        return True
    return False


def validate_logic_expression(rules: dict, logic: dict) -> list[str]:
    """Flag contradictory residency / boolean logic before save."""
    errors: list[str] = []
    if isinstance(rules, dict):
        codes = {_normalize_residency_code(c) for c in (rules.get("residency") or [])}
        if "institution_country" in codes and "international" in codes:
            errors.append(
                "Choose either institution country or international — not both."
            )
    if isinstance(logic, dict) and logic.get("contradiction"):
        errors.append(str(logic["contradiction"]))
    return errors


def _student_matches_rules(student: dict, rules: dict) -> bool:
    gpa = _float(student.get("gpa") or student.get("cumulative_gpa"))
    min_gpa = rules.get("min_gpa")
    if min_gpa is not None and gpa < float(min_gpa):
        return False
    min_credits = rules.get("min_credits")
    if min_credits is not None:
        credits = _float(
            student.get("credits_completed")
            or student.get("total_credits_completed")
            or student.get("credit_hours_earned")
            or student.get("total_credits_graded_earned")
            or student.get("credits_enrolled")
            or student.get("total_credits_enrolled")
        )
        if credits < float(min_credits):
            return False
    majors = rules.get("majors") or []
    if majors:
        major = str(student.get("major") or student.get("program") or "").lower()
        if not any(str(m).lower() in major for m in majors):
            return False
    residency = rules.get("residency") or []
    if residency:
        codes = {_normalize_residency_code(r) for r in residency}
        domestic = _is_institution_country_student(student)
        if "international" in codes and "institution_country" not in codes:
            if domestic:
                return False
        if "institution_country" in codes and "international" not in codes:
            if not domestic:
                return False
    return True


def simulate_eligible_pool(students: list[dict], program: ScholarshipProgram) -> dict:
    rules = program.eligibility_rules or {}
    if program.min_gpa is not None:
        rules = {**rules, "min_gpa": float(program.min_gpa)}
    matched = [s for s in students if _student_matches_rules(s, rules)]
    return {
        "total_students": len(students),
        "eligible_count": len(matched),
        "sample_student_ids": [str(s.get("student_id")) for s in matched[:10]],
        "program_id": program.external_id,
    }


def program_from_payload(data: dict) -> dict:
    """Normalize create/update body to model fields."""
    ext = data.get("external_id") or data.get("id")
    return {
        "external_id": str(ext) if ext else None,
        "title": data.get("title") or data.get("scholarship_name"),
        "sponsoring_entity": data.get("sponsoring_entity"),
        "gl_code": data.get("gl_code"),
        "program_type": data.get("program_type") or data.get("type") or "General",
        "criteria_text": data.get("criteria_text") or data.get("description") or data.get("criteria"),
        "value_kes": _float(data.get("value_kes") or data.get("amount_(kes)")),
        "coverage": data.get("coverage"),
        "slots_available": int(data.get("slots_available") or data.get("slots") or 0),
        "slots_filled": int(data.get("slots_filled") or 0),
        "budget_total_allocated": data.get("budget_total_allocated"),
        "valuation_type": data.get("valuation_type") or "fixed_sum",
        "valuation_config": data.get("valuation_config") or {},
        "eligibility_rules": data.get("eligibility_rules") or {},
        "logic_expression": data.get("logic_expression") or {},
        "over_award_tolerance_pct": data.get("over_award_tolerance_pct") or 100,
        "min_gpa": data.get("min_gpa"),
        "requires_references": int(data.get("requires_references") or 0),
        "academic_year": data.get("academic_year") or data.get("year") or "Any",
        "open_to": data.get("open_to") or "All",
        "application_deadline": data.get("application_deadline") or data.get("deadline"),
    }


SEED_PROGRAMS: list[dict] = [
    {
        "external_id": "SCH-001",
        "title": "Vice Chancellor's Merit Award",
        "program_type": "Merit",
        "criteria_text": "Top 5% GPA; minimum GPA 3.80",
        "value_kes": 100000,
        "coverage": "Full Tuition",
        "slots_available": 5,
        "slots_filled": 2,
        "min_gpa": 3.8,
        "budget_total_allocated": 500000,
        "valuation_type": "full_ride",
        "eligibility_rules": {"min_gpa": 3.8, "gates": {"good_standing": True}},
    },
    {
        "external_id": "SCH-002",
        "title": "Dean's Excellence Bursary",
        "program_type": "Merit",
        "criteria_text": "GPA 3.50–3.79; Good Standing",
        "value_kes": 50000,
        "coverage": "50% Tuition",
        "slots_available": 10,
        "slots_filled": 4,
        "min_gpa": 3.5,
        "budget_total_allocated": 500000,
        "valuation_type": "percentage_tuition",
        "valuation_config": {"percent": 50},
    },
    {
        "external_id": "SCH-003",
        "title": "STEM Advancement Fund",
        "program_type": "Merit + Need",
        "criteria_text": "BSc/MSc programmes; GPA ≥ 3.20",
        "value_kes": 40000,
        "coverage": "40% Tuition",
        "slots_available": 8,
        "slots_filled": 3,
        "min_gpa": 3.2,
        "budget_total_allocated": 320000,
        "valuation_type": "percentage_tuition",
        "valuation_config": {"percent": 40},
        "eligibility_rules": {"min_gpa": 3.2, "majors": ["Computer Science", "Engineering", "Data Science"]},
    },
    {
        "external_id": "SCH-004",
        "title": "Pan-African Diversity Grant",
        "program_type": "Diversity",
        "criteria_text": "Non-Kenyan international students",
        "value_kes": 30000,
        "coverage": "Partial Tuition",
        "slots_available": 15,
        "slots_filled": 7,
        "budget_total_allocated": 450000,
        "valuation_type": "fixed_sum",
        "eligibility_rules": {"residency": ["international"]},  # non–institution-country students
    },
    {
        "external_id": "SCH-005",
        "title": "Women in Science Scholarship",
        "program_type": "Equity",
        "criteria_text": "Female students in Science/Engineering",
        "value_kes": 35000,
        "coverage": "Partial Tuition",
        "slots_available": 6,
        "slots_filled": 2,
        "budget_total_allocated": 210000,
        "eligibility_rules": {"gender": "female", "majors": ["Science", "Engineering"]},
    },
    {
        "external_id": "SCH-006",
        "title": "Bursary for Needy Students",
        "program_type": "Need-Based",
        "criteria_text": "Demonstrated financial hardship; GPA ≥ 2.50",
        "value_kes": 25000,
        "coverage": "Partial Tuition",
        "slots_available": 10,
        "slots_filled": 3,
        "min_gpa": 2.5,
        "budget_total_allocated": 250000,
        "valuation_type": "fixed_sum",
        "eligibility_rules": {"min_gpa": 2.5},
    },
    {
        "external_id": "SCH-007",
        "title": "Postgraduate Research Fellowship",
        "program_type": "Research",
        "criteria_text": "MSc/MA by Research students; supervisor endorsement",
        "value_kes": 60000,
        "coverage": "Full Tuition + Stipend",
        "slots_available": 4,
        "slots_filled": 2,
        "requires_references": 1,
        "budget_total_allocated": 240000,
        "valuation_type": "full_ride",
        "eligibility_rules": {"level": "postgraduate"},
    },
    {
        "external_id": "SCH-008",
        "title": "Community Leaders Award",
        "program_type": "Leadership",
        "criteria_text": "Community engagement evidence; essay required",
        "value_kes": 20000,
        "coverage": "Flat Grant",
        "slots_available": 5,
        "slots_filled": 1,
        "budget_total_allocated": 100000,
        "valuation_type": "fixed_sum",
    },
    {
        "external_id": "SCH-009",
        "title": "Health Sciences Sponsorship",
        "program_type": "Sectoral",
        "criteria_text": "BSc Nursing / BPharm / BSc Nutrition students",
        "value_kes": 45000,
        "coverage": "50% Tuition",
        "slots_available": 4,
        "slots_filled": 2,
        "min_gpa": 2.5,
        "budget_total_allocated": 180000,
        "valuation_type": "percentage_tuition",
        "valuation_config": {"percent": 50},
        "eligibility_rules": {"majors": ["Nursing", "Pharmacy", "Nutrition"]},
    },
    {
        "external_id": "SCH-010",
        "title": "Law & Justice Fund",
        "program_type": "Sectoral",
        "criteria_text": "LLB students; moot court participation",
        "value_kes": 30000,
        "coverage": "40% Tuition",
        "slots_available": 4,
        "slots_filled": 1,
        "budget_total_allocated": 120000,
        "valuation_type": "percentage_tuition",
        "valuation_config": {"percent": 40},
        "eligibility_rules": {"majors": ["Law", "LLB"]},
    },
    {
        "external_id": "SCH-011",
        "title": "Financial Hardship Emergency Bursary",
        "program_type": "Need-Based",
        "criteria_text": "Documented fee arrears; household income statement; GPA ≥ 2.50; active enrolment",
        "value_kes": 75000,
        "coverage": "Outstanding Tuition Balance (up to KES 75,000)",
        "slots_available": 5,
        "slots_filled": 0,
        "min_gpa": 2.5,
        "budget_total_allocated": 375000,
        "valuation_type": "last_dollar",
        "valuation_config": {"cap_kes": 75000},
        "eligibility_rules": {"min_gpa": 2.5, "gates": {"active_enrollment": True}},
    },
]


SEED_GRANTS: list[dict] = [
    {
        "external_id": "GRT-001",
        "title": "STEM Innovation Research Grant",
        "program_type": "Research",
        "criteria_text": "Postgraduate STEM research; supervisor endorsement required",
        "value_kes": 150000,
        "coverage": "Research stipend",
        "slots_available": 8,
        "slots_filled": 2,
        "budget_total_allocated": 1200000,
        "valuation_type": "fixed_sum",
        "eligibility_rules": {"level": "postgraduate"},
    },
    {
        "external_id": "GRT-002",
        "title": "Medical Research Grant",
        "program_type": "Research",
        "criteria_text": "Medicine / health sciences PhD or MSc research",
        "value_kes": 200000,
        "coverage": "Full project funding",
        "slots_available": 5,
        "slots_filled": 1,
        "budget_total_allocated": 1000000,
        "valuation_type": "fixed_sum",
    },
    {
        "external_id": "GRT-003",
        "title": "Tech Innovation Grant",
        "program_type": "Innovation",
        "criteria_text": "Prototype or digital innovation with faculty mentor",
        "value_kes": 300000,
        "coverage": "Innovation fund",
        "slots_available": 4,
        "slots_filled": 0,
        "budget_total_allocated": 1200000,
        "valuation_type": "fixed_sum",
    },
    {
        "external_id": "GRT-004",
        "title": "Community Field Work Grant",
        "program_type": "Field Work",
        "criteria_text": "Documented community engagement project",
        "value_kes": 120000,
        "coverage": "Field expenses",
        "slots_available": 10,
        "slots_filled": 3,
        "budget_total_allocated": 1200000,
        "valuation_type": "fixed_sum",
    },
]


SEED_PI_GRANTS: list[dict] = [
    {
        "external_id": "pi-001",
        "title": "Prof. Kamau — Computational Biology Lab",
        "program_type": "PI Grant",
        "criteria_text": "Funding for MSc and PhD students working on bioinformatics, genomic data analysis, or computational modelling of biological systems within Prof. Kamau's research group.",
        "value_kes": 480000,
        "coverage": "Stipend + lab costs",
        "slots_available": 2,
        "slots_filled": 0,
        "budget_total_allocated": 960000,
        "open_to": "PhD, Masters",
        "eligibility_rules": {
            "level": "postgraduate",
            "grant_category": "pi",
            "pi_name": "Prof. J. Kamau",
            "pi_department": "Computational Biology",
            "endorsement_required": True,
            "scope_of_work": {
                "position_type": "phd",
                "research_question": "How can machine-learning models predict gene regulatory networks from multi-omics datasets in African crop species?",
                "duration_months": 36,
                "milestones": [
                    {"label": "Literature review & pipeline design", "month": 6},
                    {"label": "Data acquisition and model training", "month": 18},
                    {"label": "Validation on field samples & manuscript draft", "month": 30},
                    {"label": "Thesis submission and code release", "month": 36},
                ],
                "reporting_obligations": "Monthly lab meetings; quarterly written progress reports to PI; annual presentation at departmental seminar.",
                "expected_outputs": [
                    "PhD thesis on computational genomics",
                    "Open-source analysis pipeline",
                    "At least one peer-reviewed publication",
                ],
            },
        },
    },
    {
        "external_id": "pi-002",
        "title": "Dr. Wanjiru — Environmental Science Fund",
        "program_type": "PI Grant",
        "criteria_text": "Research grants for postgraduate students studying climate adaptation, water resource management, or soil science under Dr. Wanjiru's supervision.",
        "value_kes": 320000,
        "coverage": "Field work + equipment",
        "slots_available": 3,
        "slots_filled": 2,
        "budget_total_allocated": 960000,
        "open_to": "PhD, Masters",
        "eligibility_rules": {
            "level": "postgraduate",
            "grant_category": "pi",
            "pi_name": "Dr. A. Wanjiru",
            "pi_department": "Environmental Science",
            "endorsement_required": True,
            "scope_of_work": {
                "position_type": "phd",
                "research_question": "How do smallholder irrigation systems adapt to prolonged drought conditions in semi-arid Kenya?",
                "duration_months": 36,
                "milestones": [
                    {"label": "Literature review & study site selection", "month": 6},
                    {"label": "Field data collection — water and soil sampling", "month": 18},
                    {"label": "Data analysis & draft thesis chapters", "month": 30},
                    {"label": "Thesis submission & policy dissemination", "month": 36},
                ],
                "reporting_obligations": "Quarterly progress reports to PI; annual presentation at departmental seminar; final thesis and one peer-reviewed publication.",
                "expected_outputs": [
                    "PhD thesis on climate-adaptive irrigation",
                    "Minimum one Q1 journal article",
                    "Policy brief for county water boards",
                ],
            },
        },
    },
    {
        "external_id": "pi-003",
        "title": "Dr. Ochieng — Digital Health Innovation",
        "program_type": "PI Grant",
        "criteria_text": "Supports postgraduate research in health informatics, telemedicine platforms, and AI-driven diagnostics.",
        "value_kes": 550000,
        "coverage": "Stipend + conference travel",
        "slots_available": 2,
        "slots_filled": 0,
        "budget_total_allocated": 1100000,
        "open_to": "PhD",
        "eligibility_rules": {
            "level": "postgraduate",
            "grant_category": "pi",
            "pi_name": "Dr. P. Ochieng",
            "pi_department": "Health Informatics",
            "endorsement_required": True,
            "scope_of_work": {
                "position_type": "postdoc",
                "research_question": "Can a low-bandwidth telemedicine triage model improve rural maternal health outcomes when integrated with existing CHW workflows?",
                "duration_months": 24,
                "milestones": [
                    {"label": "Needs assessment & protocol design", "month": 4},
                    {"label": "Platform integration and pilot deployment", "month": 12},
                    {"label": "Impact evaluation and manuscript preparation", "month": 20},
                    {"label": "Final report and scale-up recommendations", "month": 24},
                ],
                "reporting_obligations": "Bi-monthly progress updates; mid-term review with research office; final technical report and dataset documentation.",
                "expected_outputs": [
                    "Postdoctoral research report",
                    "Deployed triage module with evaluation metrics",
                    "Two conference papers or one journal article",
                ],
            },
        },
    },
    {
        "external_id": "pi-004",
        "title": "Prof. Muthoni — Materials Science Lab",
        "program_type": "PI Grant",
        "criteria_text": "Research funding for advanced materials, nanomaterials, and renewable energy storage under Prof. Muthoni.",
        "value_kes": 410000,
        "coverage": "Lab consumables + stipend",
        "slots_available": 2,
        "slots_filled": 2,
        "budget_total_allocated": 820000,
        "open_to": "PhD",
        "eligibility_rules": {
            "level": "postgraduate",
            "grant_category": "pi",
            "pi_name": "Prof. C. Muthoni",
            "pi_department": "Materials Science",
            "endorsement_required": True,
            "scope_of_work": {
                "position_type": "phd",
                "research_question": "What nanostructured electrode materials maximise cycle life for grid-scale sodium-ion batteries in tropical climates?",
                "duration_months": 48,
                "milestones": [
                    {"label": "Material synthesis & characterisation", "month": 12},
                    {"label": "Prototype cell assembly & testing", "month": 24},
                    {"label": "Optimisation and thermal stress trials", "month": 36},
                    {"label": "Thesis, patent disclosure & publication", "month": 48},
                ],
                "reporting_obligations": "Monthly lab notebook review; semi-annual grant report to funding agency; IP disclosure before publication.",
                "expected_outputs": [
                    "PhD thesis on sodium-ion storage materials",
                    "Prototype cells meeting cycle-life targets",
                    "Patent application or licensed process note",
                ],
            },
        },
    },
]


def _seed_rows(db: Session, rows: list[dict], program_kind: str) -> int:
    added = 0
    for raw in rows:
        if db.query(ScholarshipProgram).filter(ScholarshipProgram.external_id == raw["external_id"]).first():
            continue
        row = ScholarshipProgram(
            **{k: v for k, v in raw.items() if k != "application_deadline"},
            program_kind=program_kind,
            workflow_status="published",
            sponsoring_entity=raw.get("sponsoring_entity") or "TemplumIS Research Office",
            gl_code=raw.get("gl_code") or "FA-GRANT",
        )
        db.add(row)
        added += 1
    if added:
        db.commit()
    return added


def seed_programs_if_empty(db: Session) -> int:
    n = 0
    if db.query(ScholarshipProgram).filter(ScholarshipProgram.program_kind == "scholarship").count() == 0:
        n += _seed_rows(db, SEED_PROGRAMS, "scholarship")
    n += _seed_rows(db, SEED_GRANTS, "grant")
    n += _seed_rows(db, SEED_PI_GRANTS, "grant")
    return n
