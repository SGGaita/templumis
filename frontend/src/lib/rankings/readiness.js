/**
 * Readiness maths and IAQRI helpers shared by the rankings pages.
 * Moved verbatim from app/staff/rankings/page.jsx.
 */

import { frameworkMeta } from "@/lib/rankings/catalog";

export function parseWeightPercent(weight) {
  if (!weight || !String(weight).includes("%")) return null;
  const n = parseFloat(weight);
  return Number.isFinite(n) ? n : null;
}

export function parseWeightPoints(weight) {
  if (!weight) return null;
  const match = String(weight).match(/([\d.]+)\s*pts?/i);
  return match ? parseFloat(match[1]) : null;
}

export function indicatorWeight(indicator) {
  const pct = parseWeightPercent(indicator?.weight);
  if (pct != null) return pct;
  const pts = parseWeightPoints(indicator?.weight);
  if (pts != null) return pts;
  return 1;
}

export function effectiveScore(indicator) {
  if (!indicator) return 0;
  if (indicator.status === "No data" || indicator.status === "Not applicable") return 0;
  const n = Number(indicator.score);
  return Number.isFinite(n) ? n : 0;
}

export function weightedReadiness(indicators = []) {
  let weightSum = 0;
  let scored = 0;
  for (const indicator of indicators) {
    const weight = indicatorWeight(indicator);
    if (!weight) continue;
    weightSum += weight;
    scored += effectiveScore(indicator) * weight;
  }
  if (!weightSum) return 0;
  return Math.round(scored / weightSum);
}

export function systemReadiness(system) {
  const items = system.criteria?.length
    ? system.criteria.flatMap((criterion) => criterion.indicators || [])
    : system.indicators || [];
  return weightedReadiness(items);
}

export function formatScorePct(score) {
  const n = Math.round(Number(score) || 0);
  return `${n}%`;
}

export function contributionFor(indicator) {
  const score = effectiveScore(indicator);
  const pct = parseWeightPercent(indicator?.weight);
  if (pct != null) {
    return { value: (score / 100) * pct, scaleLabel: `${pct}% weight`, score };
  }
  const pts = parseWeightPoints(indicator?.weight);
  if (pts != null) {
    return { value: (score / 100) * pts, scaleLabel: `${pts} pts`, score };
  }
  return null;
}

export function scoreInterpretation(score, status) {
  if (status === "Not applicable") {
    return "This indicator does not currently apply to the institution.";
  }
  if (status === "No data") {
    return "Score is 0% because the required evidence is not in the SIS/LMS or the relevant external index. This is not a ranking-agency result - the indicator cannot be scored until the data exists.";
  }
  if (status === "Limited") {
    return "Some relevant records exist, but coverage is still incomplete relative to how this indicator is measured.";
  }
  if (status === "Good" || status === "Excellent") {
    return "Institutional data already supports a strong position on this indicator relative to typical ranking requirements.";
  }
  if (score >= 60) return "Readiness is relatively strong on this indicator.";
  if (score >= 40) return "Readiness is moderate; targeted evidence or output would move this score.";
  return "Readiness is currently low on this indicator.";
}

export function defaultActions(indicator) {
  if (indicator.status === "Excellent" || indicator.status === "Good") {
    return ["Keep current records complete and refresh them each ranking cycle."];
  }
  if (indicator.status === "Not applicable") {
    return ["Revisit this indicator if the institution's mission or programme mix changes."];
  }
  if (indicator.status === "No data") {
    return [
      `Capture evidence for "${indicator.name}" in SIS/LMS or the relevant external index.`,
      "Assign an owner to update this indicator before the next ranking cycle.",
    ];
  }
  return [
    "Close the remaining data gaps noted in the current assessment.",
    "Document evidence so it can be reused across ranking frameworks that share this metric.",
  ];
}

export function resolveDetail(indicator) {
  const custom = indicator.detail || {};
  return {
    source: custom.source || indicator.description,
    evidence: custom.evidence?.length
      ? custom.evidence
      : [{ label: "Current assessment", value: indicator.performance }],
    gaps:
      custom.gaps ||
      (indicator.status === "Excellent" || indicator.status === "Good" || indicator.status === "Not applicable"
        ? []
        : ["Evidence is incomplete relative to the ranking's published definition of this indicator."]),
    actions: custom.actions || defaultActions(indicator),
    factors: custom.factors || [],
  };
}

// Root causes are derived live from the pillar's own indicators - whichever
// indicators are actually scoring "Limited" or "No data" right now, ordered
// weakest first - rather than a separate hand-written list that can drift out
// of sync with the scores shown above.
export function causesForCriterion(criterion) {
  const weak = (criterion.indicators || [])
    .filter((ind) => ind.status === "No data" || ind.status === "Limited")
    .sort((a, b) => a.score - b.score);
  const pool = weak.length ? weak : criterion.indicators || [];
  return pool.map((ind) => `${ind.name}: ${ind.performance}`);
}

// Scenario Modelling driver config - data-driven so new pillar-specific
// driver sets can be appended here later without touching the render logic.
// Each driver's `effects` map is {pillarId: pointsPerUnit}, describing how
// many NIRF pillar points one unit of the slider is worth; `primaryPillar`
// groups sliders under a heading. TLR is the first pillar with its own
// dedicated driver set - RP/GO/OI/PR still fall back to their legacy shared
// sliders (publications, PhD completions) until dedicated drivers are added
// for them too, which this structure makes a simple append rather than a
// rewrite.
export const IAQRI_SCENARIO_DRIVERS = [
  {
    key: "pubs",
    label: "New peer-reviewed publications this year",
    max: 30,
    primaryPillar: "tlr",
    effects: { tlr: 0.8, rp: 2.3 },
  },
  {
    key: "faculty",
    label: "New professors hired (PhD-qualified faculty)",
    max: 20,
    primaryPillar: "tlr",
    effects: { tlr: 1.6 },
  },
  {
    key: "funding",
    label: "% increase in funding",
    max: 50,
    suffix: "%",
    primaryPillar: "tlr",
    effects: { tlr: 0.3 },
  },
  {
    key: "partnerships",
    label: "University-industry partnerships",
    max: 10,
    primaryPillar: "tlr",
    effects: { tlr: 1.5 },
  },
  {
    key: "patents",
    label: "Filed patents",
    max: 20,
    primaryPillar: "tlr",
    effects: { tlr: 1.0 },
  },
  {
    key: "endowment",
    label: "Endowment fund growth",
    max: 30,
    suffix: "%",
    primaryPillar: "tlr",
    effects: { tlr: 0.4 },
  },
  {
    key: "phds",
    label: "Additional PhD completions",
    max: 10,
    primaryPillar: "go",
    effects: { go: 4.5 },
  },
];

// Flags indicators currently scoring "Limited" or "No data" across both live
// frameworks, ranked by how much weight each carries - the single source both
// the early-warning list and the action tracker draw from, so they never
// disagree with each other or with the scores shown above.
export function flagIndicators(naacSystem, nirfSystem, limit) {
  const items = [];
  const collect = (system, framework) => {
    (system?.criteria || []).forEach((crit) => {
      (crit.indicators || []).forEach((ind) => {
        if (ind.status === "No data" || ind.status === "Limited") {
          items.push({
            key: `${framework}-${crit.id}-${ind.name}`,
            name: ind.name,
            weight: indicatorWeight(ind),
            score: ind.score,
            status: ind.status,
            performance: ind.performance,
            framework,
            criterionId: crit.id,
            criterionCode: crit.code || crit.id,
            criterionTitle: criterionTitle({ ...crit, label: crit.shortLabel }),
          });
        }
      });
    });
  };
  collect(naacSystem, "NAAC");
  collect(nirfSystem, "NIRF");
  items.sort((a, b) => b.weight - a.weight || a.score - b.score);
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export const IAQRI_CRITERION_OWNER = {
  curricular: "Academic Office",
  "teaching-learning": "Registrar",
  research: "Director of Research",
  infrastructure: "Facilities & IT",
  "student-support": "Student Services",
  governance: "Registrar",
  values: "IQAC Coordinator",
  tlr: "Registrar",
  rp: "Director of Research",
  go: "Student Services",
  oi: "IQAC Coordinator",
  pr: "Communications Office",
};
// ---------------------------------------------------------------------------
// Executive brief helpers (new). Framework-agnostic: they work for systems
// with `criteria` (NAAC, NIRF, THE, AAUR …) and flat `indicators` lists alike.
// ---------------------------------------------------------------------------

export const GAP_STATUSES = ["No data", "Limited"];

function frameworkShortLabel(system) {
  return frameworkMeta(system.id)?.short || system.tabLabel || system.badge;
}

/** Full name without a trailing "(CODE)": "Perception (PR)" -> "Perception". */
export function criterionFullName(criterion) {
  const name = String(criterion?.name || "");
  return name.replace(/\s*\([^)]*\)\s*$/, "") || name;
}

/**
 * Human-readable criterion title that never shows a bare abbreviation:
 *  - NAAC  "C3 · Research"
 *  - NIRF  "TLR · Teaching, Learning & Resources" (label is only the code, so spell it out)
 */
export function criterionTitle(criterion) {
  if (!criterion) return "";
  const label = criterion.label || criterion.shortLabel || criterion.name;
  if (criterion.code && criterion.code === label) {
    const full = criterionFullName(criterion);
    return full && full !== label ? `${label} · ${full}` : label;
  }
  return criterion.code ? `${criterion.code} · ${label}` : label;
}

/** Short tab/chip label; spells out pure abbreviations ("TLR" -> "Teaching, Learning & Resources (TLR)"). */
export function criterionTabLabel(criterion) {
  const short = criterion?.shortLabel || criterion?.name || "";
  const isAbbrev = /^[A-Z]{2,5}$/.test(short);
  return isAbbrev && criterion?.name && criterion.name !== short ? criterion.name : short;
}

export function systemIndicators(system) {
  if (!system) return [];
  if (system.criteria?.length) {
    return system.criteria.flatMap((criterion) =>
      (criterion.indicators || []).map((indicator) => ({ indicator, criterion }))
    );
  }
  return (system.indicators || []).map((indicator) => ({ indicator, criterion: null }));
}

/** Readiness per criterion / pillar, in framework order. */
export function criterionBreakdown(system) {
  return (system?.criteria || []).map((criterion) => ({
    id: criterion.id,
    code: criterion.code || null,
    label: criterion.shortLabel || criterion.name,
    name: criterion.name,
    weightLabel:
      criterion.weightLabel ||
      (criterion.points != null ? `${criterion.points} pts` : criterion.weight != null ? `${criterion.weight}%` : ""),
    readiness: weightedReadiness(criterion.indicators || []),
    indicators: criterion.indicators || [],
  }));
}

const OWNER_RULES = [
  [/international/i, "International Office"],
  [/publication|citation|research|patent|bibliometric|innovation|nobel|field medal|highly cited|scholarly|papers|indexed|nature & science|scientific output|academic performance/i, "Director of Research"],
  [/reputation|perception|visibility|web|employer|transparen|openness/i, "Communications Office"],
  [/income|funding|industry|financial|endowment/i, "Finance Office"],
  [/faculty|staff|teaching|student|ratio|enrol|doctorate|phd|graduat|employment|outcome/i, "Registrar"],
  [/sustainab|infrastructure|facilit|library/i, "Facilities & IT"],
  [/accessib|affordab|mental health|counsel|heritage|welfare/i, "Student Services"],
  [/leadership|ethics|governance|professional development/i, "Vice-Chancellor's Office"],
];

export function ownerFor(indicator, criterion) {
  if (criterion?.id && IAQRI_CRITERION_OWNER[criterion.id]) return IAQRI_CRITERION_OWNER[criterion.id];
  const text = `${indicator?.name || ""} ${criterion?.name || ""}`;
  const rule = OWNER_RULES.find(([pattern]) => pattern.test(text));
  return rule ? rule[1] : "Unassigned";
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * One ranked list of weak indicators across the given systems.
 * `share` = the indicator's weight as a % of its framework's total weight, so
 * points-based (AAUR) and %-based frameworks can be ranked together.
 */
export function rankPriorities(systems) {
  const items = [];
  for (const system of systems || []) {
    const rows = systemIndicators(system);
    const total = rows.reduce((sum, row) => sum + indicatorWeight(row.indicator), 0) || 1;
    const shares = rows.map((row) => (indicatorWeight(row.indicator) / total) * 100);
    const highCut = median(shares);
    rows.forEach((row, index) => {
      const { indicator, criterion } = row;
      if (!GAP_STATUSES.includes(indicator.status)) return;
      const share = shares[index];
      items.push({
        key: `${system.id}::${criterion?.id || "all"}::${indicator.name}`,
        frameworkId: system.id,
        framework: frameworkShortLabel(system),
        criterion: criterion ? criterionTitle({ ...criterion, label: criterion.shortLabel }) : null,
        criterionName: criterion?.name || null,
        name: indicator.name,
        weight: indicator.weight,
        share,
        high: share > highCut,
        score: effectiveScore(indicator),
        status: indicator.status,
        performance: indicator.performance,
        owner: ownerFor(indicator, criterion),
        action: indicator.detail?.actions?.[0] || defaultActions(indicator)[0],
      });
    });
  }
  items.sort((a, b) => b.share - a.share || a.score - b.score);
  return items;
}

/** Status → colour tone. The only place the brief uses colour. */
export function statusTone(status, palette) {
  switch (status) {
    case "Excellent":
      return { fg: palette.successDark, bg: palette.successLight };
    case "Good":
      return { fg: palette.success, bg: palette.successLight };
    case "Limited":
      return { fg: palette.warning, bg: palette.warningLight };
    case "No data":
    case "Not applicable":
    default:
      return { fg: palette.neutral, bg: palette.neutralLight };
  }
}

/** Plain percentage, no tilde - the page states once that figures are estimates. */
export function pct(value) {
  return `${Math.round(Number(value) || 0)}%`;
}
