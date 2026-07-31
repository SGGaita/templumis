"""Stage 5: Committee rubric scoring, consensus, and stack-ranking helpers."""

from __future__ import annotations

import math
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models import ScholarshipProgram, ScholarshipReviewAssignment, ScholarshipTriageConfig, StudentScholarshipApplication

EVAL_PENDING = "pending_scores"
EVAL_DISPUTED = "disputed"
EVAL_RECONCILED = "reconciled"

DEFAULT_WEIGHTS = {"academic": 0.34, "need": 0.33, "lead": 0.33}
DEFAULT_VARIANCE_THRESHOLD = 1.25


def _float(val, default: float = 0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


def _normalize_weight_triplet(academic: float, need: float, lead: float) -> dict[str, float]:
    """Weights may be stored as 0.34, 3.4, or 34 (percent) — always return fractions summing to 1."""
    a, n, l = academic, need, lead
    if max(a, n, l) > 1.5:
        a, n, l = a / 100.0, n / 100.0, l / 100.0
    total = a + n + l
    if total <= 0:
        return dict(DEFAULT_WEIGHTS)
    return {"academic": a / total, "need": n / total, "lead": l / total}


def get_rubric_weights(program: ScholarshipProgram | None, cfg: ScholarshipTriageConfig) -> dict[str, float]:
    """Per-scholarship weights from valuation_config, else institution defaults."""
    custom = {}
    if program and program.valuation_config:
        custom = (program.valuation_config or {}).get("rubric_weights") or {}
    academic = _float(custom.get("academic"), _float(cfg.weight_academic, DEFAULT_WEIGHTS["academic"]))
    need = _float(custom.get("need"), _float(cfg.weight_need, DEFAULT_WEIGHTS["need"]))
    lead = _float(custom.get("lead"), _float(cfg.weight_lead, DEFAULT_WEIGHTS["lead"]))
    return _normalize_weight_triplet(academic, need, lead)


def composite_score(scores: dict, weights: dict[str, float]) -> float:
    return round(
        weights["academic"] * scores["academic"]
        + weights["need"] * scores["need"]
        + weights["lead"] * scores["lead"],
        2,
    )


def consensus_stats(composites: list[float]) -> tuple[Optional[float], Optional[float]]:
    if not composites:
        return None, None
    if len(composites) == 1:
        return composites[0], 0.0
    avg = sum(composites) / len(composites)
    variance = sum((x - avg) ** 2 for x in composites) / (len(composites) - 1)
    return round(avg, 2), round(math.sqrt(variance), 2)


def variance_threshold(cfg: ScholarshipTriageConfig) -> float:
    return _float(cfg.variance_threshold, DEFAULT_VARIANCE_THRESHOLD)


def assignment_is_scored(assignment: ScholarshipReviewAssignment) -> bool:
    return (
        assignment.score_academic is not None
        and assignment.score_need is not None
        and assignment.score_lead is not None
    )


def refresh_application_evaluation(
    db: Session,
    application: StudentScholarshipApplication,
    program: ScholarshipProgram | None,
    cfg: ScholarshipTriageConfig,
) -> dict:
    """Recompute consensus after a reviewer submits scores."""
    assignments = list(application.review_assignments or [])
    weights = get_rubric_weights(program, cfg)
    scored = [a for a in assignments if assignment_is_scored(a)]

    for a in scored:
        a.composite_score = composite_score(
            {"academic": a.score_academic, "need": a.score_need, "lead": a.score_lead},
            weights,
        )
        a.status = "scored"

    if len(scored) < len(assignments) or not assignments:
        application.consensus_score = None
        application.score_std_dev = None
        application.evaluation_status = EVAL_PENDING
        db.commit()
        return {
            "evaluation_status": EVAL_PENDING,
            "scored_count": len(scored),
            "required_count": len(assignments),
        }

    composites = [float(a.composite_score) for a in scored]
    avg, std = consensus_stats(composites)
    application.consensus_score = avg
    application.score_std_dev = std
    threshold = variance_threshold(cfg)

    if std is not None and std >= threshold and application.evaluation_status != EVAL_RECONCILED:
        application.evaluation_status = EVAL_DISPUTED
    else:
        application.evaluation_status = EVAL_RECONCILED

    db.commit()
    return {
        "evaluation_status": application.evaluation_status,
        "consensus_score": avg,
        "score_std_dev": std,
        "variance_threshold": threshold,
        "scored_count": len(scored),
        "required_count": len(assignments),
    }


def proposed_award(program: ScholarshipProgram | None) -> float:
    if not program:
        return 0.0
    return float(program.value_kes or 0)


def _is_need_based_program(program: ScholarshipProgram | None) -> bool:
    if not program:
        return False
    return "need" in str(program.program_type or "").lower()


def ranking_merit_weight(app: StudentScholarshipApplication, program: ScholarshipProgram | None) -> float:
    """Blend committee consensus with documented need for budget allocation."""
    score = max(0.1, float(app.consensus_score or 0))
    if _is_need_based_program(program):
        need = float(app.need_index if app.need_index is not None else 50) / 100.0
        return score * (0.6 + 0.4 * need)
    return score


def _round_award_kes(amount: float) -> float:
    if amount <= 0:
        return 0.0
    return float(max(500, int(amount / 500) * 500))


def compute_recommended_awards(
    applications: list[StudentScholarshipApplication],
    programs: dict[str, ScholarshipProgram],
    *,
    budget: float,
) -> dict[int, float]:
    """
    Distribute budget across reconciled applications.
    Full scholarship value is the ceiling; when the pool is tight, amounts scale
    down proportionally to merit weight (consensus score, boosted by need index).
    """
    if not applications:
        return {}

    items: list[tuple[StudentScholarshipApplication, float, float]] = []
    for app in applications:
        program = programs.get(str(app.scholarship_external_id))
        ceiling = proposed_award(program)
        weight = ranking_merit_weight(app, program)
        items.append((app, ceiling, weight))

    total_ceiling = sum(c for _, c, _ in items)
    if total_ceiling <= budget:
        return {app.id: ceiling for app, ceiling, _ in items}

    total_weight = sum(w for _, _, w in items)
    if total_weight <= 0:
        return {app.id: 0.0 for app, _, _ in items}

    raw = {app.id: budget * (w / total_weight) for app, ceiling, w in items}
    rounded = {app.id: _round_award_kes(min(raw[app.id], ceiling)) for app, ceiling, w in items}

    total = sum(rounded.values())
    if total > budget:
        for aid in sorted(rounded, key=lambda x: rounded[x]):
            if total <= budget:
                break
            cut = min(rounded[aid], total - budget)
            rounded[aid] = max(0.0, rounded[aid] - cut)
            total -= cut

    return rounded


def resolve_proposed_award_amount(
    app: StudentScholarshipApplication,
    program: ScholarshipProgram | None,
    recommended: float,
) -> tuple[float, bool]:
    """Use a manual FAO override when flagged; otherwise the formula recommendation."""
    if app.award_stage in ("offer_sent", "offer_accepted", "credited"):
        return float(app.award_amount or recommended), False
    if (app.offer_data or {}).get("manual_award_override") and app.award_amount is not None:
        return float(app.award_amount), True
    return recommended, False


def _stack_award_label(app: StudentScholarshipApplication, within_budget: bool) -> str:
    from app.awards import STAFF_AWARD_LABELS, AWARD_PROPOSED

    stage = app.award_stage
    if stage:
        return STAFF_AWARD_LABELS.get(stage, stage.replace("_", " ").title())
    if within_budget:
        return STAFF_AWARD_LABELS[AWARD_PROPOSED]
    return "Over budget"


def build_stack_ranking(
    applications: list[StudentScholarshipApplication],
    programs: dict[str, ScholarshipProgram],
    *,
    budget: float,
) -> dict:
    """Rank reconciled applications by consensus score with cumulative liability."""
    eligible = [
        a
        for a in applications
        if a.evaluation_status == EVAL_RECONCILED and a.consensus_score is not None
    ]
    eligible.sort(
        key=lambda a: ranking_merit_weight(a, programs.get(str(a.scholarship_external_id))),
        reverse=True,
    )

    recommended_map = compute_recommended_awards(eligible, programs, budget=budget)
    total_ceiling = sum(
        proposed_award(programs.get(str(a.scholarship_external_id))) for a in eligible
    )
    budget_constrained = total_ceiling > budget

    rows = []
    cumulative = 0.0
    cutoff_rank: int | None = None

    for idx, app in enumerate(eligible, start=1):
        program = programs.get(str(app.scholarship_external_id))
        ceiling = proposed_award(program)
        recommended = recommended_map.get(app.id, ceiling)
        award, is_manual = resolve_proposed_award_amount(app, program, recommended)
        merit = ranking_merit_weight(app, program)
        cumulative += award
        within_budget = cumulative <= budget + 0.01
        if not within_budget and cutoff_rank is None:
            cutoff_rank = idx
        scale_pct = round((award / ceiling) * 100) if ceiling > 0 else 100
        rows.append(
            {
                "rank": idx,
                "application_id": app.id,
                "anonymized_id": app.anonymized_id,
                "scholarship_name": program.title if program else app.scholarship_external_id,
                "consensus_score": float(app.consensus_score),
                "score_std_dev": float(app.score_std_dev) if app.score_std_dev is not None else None,
                "need_index": app.need_index,
                "merit_weight": round(merit, 3),
                "max_scholarship_amount": ceiling,
                "recommended_award": recommended,
                "proposed_award": award,
                "award_scale_pct": scale_pct,
                "is_manual_override": is_manual,
                "cumulative_liability": cumulative,
                "within_budget": within_budget,
                "award_stage": app.award_stage,
                "award_status_label": _stack_award_label(app, within_budget),
            }
        )

    if cutoff_rank is None:
        cutoff_rank = len(rows) + 1

    return {
        "budget": budget,
        "cutoff_rank": cutoff_rank,
        "total_liability": cumulative,
        "total_ceiling": total_ceiling,
        "budget_constrained": budget_constrained,
        "allocation_formula": (
            "Awards scale down from the scholarship maximum when the pool is tight. "
            "Merit weight = consensus score × (0.6 + 0.4 × need index) for need-based programmes, "
            "else consensus score. Budget is shared proportionally by merit weight."
        ),
        "proposed_count": sum(1 for r in rows if r["within_budget"]),
        "funded_count": sum(
            1 for r in rows if r["within_budget"] and r.get("award_stage") == "credited"
        ),
        "rows": rows,
    }
