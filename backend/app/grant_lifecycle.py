"""Postgraduate research grant lifecycle — stages 1–6."""

from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime
from typing import Any, Optional

# Stage keys in pipeline order
STAGE_KEYS = (
    "proposal_budget",
    "compliance",
    "osp_routing",
    "peer_review",
    "post_award",
    "closeout",
)

STAGE_LABELS = {
    "proposal_budget": "Proposal & Budgeting",
    "compliance": "Compliance & Ethics Gates",
    "osp_routing": "Internal Routing (OSP)",
    "peer_review": "Peer Review Panel",
    "post_award": "Post-Award & Effort Tracking",
    "closeout": "Milestone & Closeout",
}

ROUTING_CHAIN = ("pi", "department_chair", "dean", "osp")

PEER_REVIEW_WEIGHTS = {
    "merit": 0.30,
    "impact": 0.25,
    "feasibility": 0.25,
    "budget": 0.20,
}

DEFAULT_FA_RATE_PCT = 52.0
EQUIPMENT_CAP = 5000
VENDOR_QUOTE_THRESHOLD = 1000
TRAVEL_CATEGORY_CAP_DEFAULT = 100000


def default_lifecycle() -> dict:
    return {
        "stage_key": "proposal_budget",
        "stage_index": 1,
        "proposal": {
            "abstract": "",
            "methodology": "",
            "dmp": "",
            "documents": [],
            "keywords": [],
            "pi_name": "",
            "pi_email": "",
            "pi_confirmed": False,
            "pi_confirmed_at": None,
            "fit_statement": "",
            "application_submitted": False,
            "application_submitted_at": None,
        },
        "budget": {
            "lines": [],
            "equipment_total": 0,
            "tuition_remission": 0,
            "fa_rate_pct": DEFAULT_FA_RATE_PCT,
            "total_direct": 0,
            "mtdc": 0,
            "indirect": 0,
            "total_requested": 0,
            "budget_unlocked": False,
            "validation_errors": [],
        },
        "compliance": {
            "human_subjects": False,
            "animal_subjects": False,
            "recombinant_dna": False,
            "irb_protocol": "",
            "iacuc_protocol": "",
            "ibc_protocol": "",
            "coi_student_signed": False,
            "coi_pi_signed": False,
            "clearance_status": "not_required",
        },
        "routing": {
            "current_step": "pi",
            "paused": False,
            "return_comments": "",
            "steps": [
                {"role": "pi", "label": "Sponsoring Faculty PI", "status": "pending", "signed_at": None, "signer": "", "comments": ""},
                {"role": "department_chair", "label": "Department Chair", "status": "pending", "signed_at": None, "signer": "", "comments": ""},
                {"role": "dean", "label": "Dean of College", "status": "pending", "signed_at": None, "signer": "", "comments": ""},
                {"role": "osp", "label": "Office of Sponsored Programs", "status": "pending", "signed_at": None, "signer": "", "comments": ""},
            ],
        },
        "peer_review": {
            "reviewers": [],
            "scores": {},
            "composite": None,
            "status": "pending",
        },
        "post_award": {
            "wbs_code": "",
            "award_amount": 0,
            "category_balances": {},
            "procurement_requests": [],
            "status": "pending",
        },
        "closeout": {
            "milestones": [
                {"id": "phase_1", "label": "Phase 1: Data collection complete", "status": "pending", "pi_signed": False},
                {"id": "phase_2", "label": "Phase 2: Analysis & draft report", "status": "locked", "pi_signed": False},
            ],
            "effort_reports": [],
            "final_report_uploaded": False,
            "ip_disclosures": [],
            "status": "not_started",
        },
        "recruitment": {
            "brief_acknowledged": False,
            "brief_acknowledged_at": None,
            "application_path": "self_apply",
            "pi_invite_pending": False,
            "pi_invite_accepted": False,
            "position_type": "phd",
        },
        "candidate": {
            "cover_letter": "",
            "publications_summary": "",
            "enrolled": True,
            "concurrent_admission": False,
            "documents": [],
        },
        "compliance_review": {
            "overall_status": "not_started",
            "funder_eligibility": {
                "status": "not_started",
                "checked_at": None,
                "notes": "",
                "citizenship_ok": None,
                "right_to_work_ok": None,
                "degree_status_ok": None,
            },
            "ethics": {"status": "pending"},
            "enrolment": {"status": "pending"},
            "coi": {"status": "pending"},
            "notes": "",
        },
        "offer": {
            "status": "not_started",
            "issued_at": None,
            "accepted_at": None,
            "letter_ref": "",
        },
        "onboarding": {
            "funder_eligibility": {
                "status": "not_started",
                "checked_at": None,
                "notes": "",
                "citizenship_ok": None,
                "right_to_work_ok": None,
                "degree_status_ok": None,
            },
            "contract": {
                "status": "not_started",
                "contract_type": "",
                "issued_at": None,
            },
            "ethics_amendment": {
                "required": False,
                "status": "not_required",
                "filed_at": None,
            },
            "onboarding_complete": False,
        },
    }


def merge_lifecycle(existing: Optional[dict]) -> dict:
    base = default_lifecycle()
    if not existing:
        return base
    merged = deepcopy(base)
    for key in base:
        if key in existing and isinstance(existing[key], dict):
            merged[key] = {**base[key], **existing[key]}
        elif key in existing:
            merged[key] = existing[key]
    return merged


def _line_amount(line: dict) -> float:
    cat = str(line.get("category") or "").lower()
    if cat == "stipend":
        fte = float(line.get("fte") or 0)
        months = float(line.get("months") or 0)
        rate = float(line.get("monthly_rate") or line.get("amount") or 0)
        return round(fte * months * rate, 2)
    return round(float(line.get("amount") or 0), 2)


def calculate_budget(budget: dict) -> dict:
    """MTDC / F&A / total requested."""
    lines = budget.get("lines") or []
    equipment = 0.0
    total_direct = 0.0
    errors: list[str] = []

    for line in lines:
        amt = _line_amount(line)
        cat = str(line.get("category") or "").lower()
        if cat == "equipment" and amt >= EQUIPMENT_CAP:
            equipment += amt
        if cat == "materials" and amt > VENDOR_QUOTE_THRESHOLD and not line.get("quote_attached"):
            errors.append(f"Vendor quote required for materials line > KES {VENDOR_QUOTE_THRESHOLD:,}")
        if cat == "travel" and amt > TRAVEL_CATEGORY_CAP_DEFAULT:
            errors.append(f"Travel line exceeds institutional cap (KES {TRAVEL_CATEGORY_CAP_DEFAULT:,})")
        total_direct += amt

    tuition = float(budget.get("tuition_remission") or 0)
    fa_rate = float(budget.get("fa_rate_pct") or DEFAULT_FA_RATE_PCT) / 100.0
    mtdc = max(0.0, total_direct - equipment - tuition)
    indirect = round(mtdc * fa_rate, 2)
    total_requested = round(total_direct + indirect, 2)

    out = {**budget}
    out["equipment_total"] = round(equipment, 2)
    out["total_direct"] = round(total_direct, 2)
    out["mtdc"] = round(mtdc, 2)
    out["indirect"] = indirect
    out["total_requested"] = total_requested
    out["validation_errors"] = errors
    return out


def compliance_required(compliance: dict) -> bool:
    return any(
        compliance.get(k)
        for k in ("human_subjects", "animal_subjects", "recombinant_dna")
    )


def evaluate_compliance(compliance: dict) -> dict:
    out = {**compliance}
    if not compliance_required(compliance):
        out["clearance_status"] = "cleared"
        return out

    missing = []
    if compliance.get("human_subjects") and not str(compliance.get("irb_protocol") or "").strip():
        missing.append("IRB protocol number required")
    if compliance.get("animal_subjects") and not str(compliance.get("iacuc_protocol") or "").strip():
        missing.append("IACUC protocol number required")
    if compliance.get("recombinant_dna") and not str(compliance.get("ibc_protocol") or "").strip():
        missing.append("IBC biosafety protocol required")
    if not compliance.get("coi_student_signed"):
        missing.append("Student COI disclosure required")
    if not compliance.get("coi_pi_signed"):
        missing.append("PI COI disclosure required")

    if missing:
        out["clearance_status"] = "pending_clearance"
        out["clearance_errors"] = missing
    else:
        out["clearance_status"] = "cleared"
        out["clearance_errors"] = []
    return out


def _text_from_html(value: str) -> str:
    import re
    return re.sub(r"<[^>]+>", " ", str(value or "")).replace("&nbsp;", " ").strip()


def pi_application_ready(proposal: dict, candidate: dict, recruitment: dict, *, position_type: str = "phd") -> list[str]:
    errors = []
    pos = str(position_type or "phd").lower()
    docs = candidate.get("documents") or []
    doc_types = {str(d.get("doc_type") or "").lower() for d in docs}
    path = str(recruitment.get("application_path") or "self_apply")

    if path == "pi_invite" and not recruitment.get("pi_invite_accepted"):
        errors.append("Accept the PI invitation before submitting your application")

    if "cv" not in doc_types:
        errors.append("CV required")
    if not _text_from_html(candidate.get("cover_letter") or ""):
        errors.append("Cover letter or motivation statement required")

    if pos == "postdoc" and "cover_letter" not in doc_types and not _text_from_html(candidate.get("cover_letter") or ""):
        errors.append("Cover letter required for postdoctoral application")

    if pos != "postdoc" and not candidate.get("enrolled") and not candidate.get("concurrent_admission"):
        errors.append("Indicate concurrent PhD admission application if not yet enrolled")
    return errors


def acknowledge_pi_brief(lifecycle: dict, *, position_type: str = "phd") -> dict:
    lc = merge_lifecycle(lifecycle)
    rec = lc.setdefault("recruitment", {})
    rec["brief_acknowledged"] = True
    rec["brief_acknowledged_at"] = datetime.utcnow().isoformat()
    rec["position_type"] = position_type
    return lc


def accept_pi_invite(lifecycle: dict) -> dict:
    lc = merge_lifecycle(lifecycle)
    rec = lc.setdefault("recruitment", {})
    if not rec.get("pi_invite_pending"):
        raise ValueError("No pending PI invitation on this application")
    rec["application_path"] = "pi_invite"
    rec["pi_invite_pending"] = False
    rec["pi_invite_accepted"] = True
    return lc


def submit_pi_application(lifecycle: dict, *, position_type: str = "phd") -> dict:
    lc = merge_lifecycle(lifecycle)
    proposal = lc["proposal"]
    candidate = lc.setdefault("candidate", {})
    recruitment = lc.setdefault("recruitment", {})
    errs = pi_application_ready(proposal, candidate, recruitment, position_type=position_type)
    if errs:
        raise ValueError("; ".join(errs))
    proposal["application_submitted"] = True
    proposal["application_submitted_at"] = datetime.utcnow().isoformat()
    lc["proposal"] = proposal
    return lc


def advance_pi_after_endorsement(lifecycle: dict) -> dict:
    """Supervisor endorsed — move to compliance review."""
    lc = merge_lifecycle(lifecycle)
    if not lc["proposal"].get("application_submitted"):
        raise ValueError("Application must be submitted before endorsement")
    lc["stage_key"] = "compliance"
    lc["stage_index"] = 2
    cr = lc.setdefault("compliance_review", {})
    cr["overall_status"] = "pending"
    fe = cr.setdefault("funder_eligibility", {})
    if fe.get("status") in (None, "not_started", ""):
        fe["status"] = "pending"
    return lc


def update_compliance_review(lifecycle: dict, patch: dict) -> dict:
    lc = merge_lifecycle(lifecycle)
    cr = lc.setdefault("compliance_review", {})
    for key in ("funder_eligibility", "ethics", "enrolment", "coi"):
        if key in patch and isinstance(patch[key], dict):
            cr[key] = {**(cr.get(key) or {}), **patch[key]}
    if "overall_status" in patch:
        cr["overall_status"] = patch["overall_status"]
    if "notes" in patch:
        cr["notes"] = patch["notes"]
    if cr.get("overall_status") == "cleared":
        offer = lc.setdefault("offer", {})
        if offer.get("status") in (None, "not_started", ""):
            offer["status"] = "pending"
    lc["compliance_review"] = cr
    return lc


def issue_offer(lifecycle: dict, *, letter_ref: str = "") -> dict:
    lc = merge_lifecycle(lifecycle)
    cr = lc.get("compliance_review") or {}
    if cr.get("overall_status") != "cleared":
        raise ValueError("Compliance must be cleared before issuing an offer")
    offer = lc.setdefault("offer", {})
    offer["status"] = "issued"
    offer["issued_at"] = datetime.utcnow().isoformat()
    offer["letter_ref"] = letter_ref or offer.get("letter_ref") or "OFFER-LETTER"
    lc["stage_key"] = "peer_review"
    lc["stage_index"] = 4
    return lc


def accept_offer(lifecycle: dict) -> dict:
    lc = merge_lifecycle(lifecycle)
    offer = lc.setdefault("offer", {})
    if offer.get("status") != "issued":
        raise ValueError("No offer pending acceptance")
    offer["status"] = "accepted"
    offer["accepted_at"] = datetime.utcnow().isoformat()
    lc["stage_key"] = "post_award"
    lc["stage_index"] = 5
    lc.setdefault("post_award", {})["status"] = "active"
    lc.setdefault("closeout", {})["status"] = "active"
    return lc


def proposal_ready(proposal: dict, budget: dict, *, is_pi_grant: bool = False) -> list[str]:
    errors = []
    docs = proposal.get("documents") or []
    if not docs:
        errors.append("Upload at least one proposal document (PDF or Markdown)")
    else:
        present = {str(d.get("doc_type") or "").lower() for d in docs}
        for required in ("abstract", "methodology", "dmp"):
            if required not in present:
                label = {"abstract": "Abstract", "methodology": "Methodology", "dmp": "Data Management Plan"}[required]
                errors.append(f"{label} document required")
    if is_pi_grant and not proposal.get("pi_confirmed"):
        errors.append("PI must select your application before submitting a full proposal")
    if not is_pi_grant and not proposal.get("pi_confirmed"):
        errors.append("PI sponsorship confirmation pending")
    if not is_pi_grant and not budget.get("budget_unlocked"):
        errors.append("Budget locked until PI confirms sponsorship")
    if not str(proposal.get("pi_name") or "").strip():
        errors.append("Principal Investigator must be linked")
    if is_pi_grant and not budget.get("budget_unlocked"):
        errors.append("Budget locked until onboarding compliance is complete")
    errors.extend(budget.get("validation_errors") or [])
    if (budget.get("total_requested") or 0) <= 0:
        errors.append("Total requested budget must be greater than zero")
    return errors


def advance_to_compliance(lifecycle: dict, *, is_pi_grant: bool = False) -> dict:
    lc = merge_lifecycle(lifecycle)
    if is_pi_grant:
        raise ValueError("PI grants use the Apply → Compliance → Offer workflow")
    errs = proposal_ready(lc["proposal"], lc["budget"], is_pi_grant=False)
    if errs:
        raise ValueError("; ".join(errs))
    lc["stage_key"] = "compliance"
    lc["stage_index"] = 2
    lc["compliance"] = evaluate_compliance(lc["compliance"])
    return lc


def advance_to_routing(lifecycle: dict) -> dict:
    lc = merge_lifecycle(lifecycle)
    comp = evaluate_compliance(lc["compliance"])
    if comp.get("clearance_status") != "cleared":
        raise ValueError("Compliance clearance required before OSP routing")
    lc["compliance"] = comp
    lc["stage_key"] = "osp_routing"
    lc["stage_index"] = 3
    return lc


def sign_routing_step(lifecycle: dict, role: str, *, signer: str = "", approved: bool = True, comments: str = "") -> dict:
    lc = merge_lifecycle(lifecycle)
    steps = lc["routing"]["steps"]
    current = lc["routing"]["current_step"]
    if role != current:
        raise ValueError(f"Expected sign-off from {current}, not {role}")

    for step in steps:
        if step["role"] == role:
            if not approved:
                step["status"] = "returned"
                step["comments"] = comments
                step["signed_at"] = datetime.utcnow().isoformat()
                step["signer"] = signer
                lc["routing"]["paused"] = True
                lc["routing"]["return_comments"] = comments
                lc["stage_key"] = "proposal_budget"
                lc["stage_index"] = 1
                return lc
            step["status"] = "approved"
            step["signed_at"] = datetime.utcnow().isoformat()
            step["signer"] = signer
            step["comments"] = comments
            break

    idx = ROUTING_CHAIN.index(role)
    if idx < len(ROUTING_CHAIN) - 1:
        lc["routing"]["current_step"] = ROUTING_CHAIN[idx + 1]
    else:
        lc["stage_key"] = "peer_review"
        lc["stage_index"] = 4
        lc["peer_review"]["status"] = "in_review"
    lc["routing"]["paused"] = False
    return lc


def compute_peer_review_score(scores: dict) -> float:
    s = scores or {}
    total = 0.0
    for key, weight in PEER_REVIEW_WEIGHTS.items():
        total += weight * float(s.get(key) or 0)
    return round(total, 2)


def submit_peer_review(lifecycle: dict, scores: dict, reviewer: str = "") -> dict:
    lc = merge_lifecycle(lifecycle)
    composite = compute_peer_review_score(scores)
    lc["peer_review"]["scores"] = scores
    lc["peer_review"]["composite"] = composite
    lc["peer_review"]["reviewers"] = list(set((lc["peer_review"].get("reviewers") or []) + [reviewer]))
    lc["peer_review"]["status"] = "scored"
    if composite >= 3.0:
        lc["stage_key"] = "post_award"
        lc["stage_index"] = 5
        lc["post_award"]["status"] = "setup_required"
    else:
        lc["peer_review"]["status"] = "not_recommended"
    return lc


def setup_post_award(lifecycle: dict, *, wbs_code: str, award_amount: float, category_balances: dict) -> dict:
    lc = merge_lifecycle(lifecycle)
    lc["post_award"]["wbs_code"] = wbs_code
    lc["post_award"]["award_amount"] = award_amount
    lc["post_award"]["category_balances"] = category_balances
    lc["post_award"]["status"] = "active"
    lc["stage_key"] = "closeout"
    lc["stage_index"] = 6
    lc["closeout"]["status"] = "active"
    return lc


def lifecycle_summary(lifecycle: dict) -> dict:
    lc = merge_lifecycle(lifecycle)
    return {
        "stage_key": lc["stage_key"],
        "stage_index": lc["stage_index"],
        "stage_label": STAGE_LABELS.get(lc["stage_key"], lc["stage_key"]),
        "stages": [{"key": k, "label": STAGE_LABELS[k], "index": i + 1} for i, k in enumerate(STAGE_KEYS)],
        "budget_total": lc["budget"].get("total_requested"),
        "clearance_status": lc["compliance"].get("clearance_status"),
        "routing_step": lc["routing"].get("current_step"),
        "peer_composite": lc["peer_review"].get("composite"),
        "wbs_code": lc["post_award"].get("wbs_code"),
    }


def status_from_lifecycle(lifecycle: dict) -> str:
    lc = merge_lifecycle(lifecycle)
    key = lc["stage_key"]
    if key == "proposal_budget":
        if not lc["proposal"].get("pi_confirmed"):
            return "draft"
        return "draft"
    if key == "compliance":
        if lc["compliance"].get("clearance_status") == "pending_clearance":
            return "pending clearance"
        return "compliance review"
    if key == "osp_routing":
        return "osp routing"
    if key == "peer_review":
        return "peer review"
    if key == "post_award":
        return "awarded" if lc["post_award"].get("status") == "active" else "approved"
    if key == "closeout":
        return "active award"
    return "draft"
