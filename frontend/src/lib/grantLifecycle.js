/**
 * PI Grant student workflow — 5 steps:
 * Brief → Apply → Compliance → Offer → Active Work
 */

export const PI_GRANT_STAGES = [
  {
    key: "project_brief",
    label: "Project Brief",
    shortLabel: "Brief",
    index: 1,
    description: "Review the PI-authored scope of work — research question, milestones, reporting obligations, duration, and expected outputs.",
    backendStages: ["proposal_budget"],
  },
  {
    key: "apply",
    label: "Apply",
    shortLabel: "Apply",
    index: 2,
    description: "Submit your application (self-apply or PI invitation). Visible to admin and financial-aid staff. Supervisor must endorse before compliance review.",
    backendStages: ["proposal_budget"],
  },
  {
    key: "compliance_review",
    label: "Compliance Checks",
    shortLabel: "Compliance",
    index: 3,
    description: "RDO verifies funder eligibility (citizenship, right to work, degree status) and other compliance requirements.",
    backendStages: ["compliance"],
    readOnly: true,
  },
  {
    key: "offer_acceptance",
    label: "Offer & Acceptance",
    shortLabel: "Offer",
    index: 4,
    description: "Offer letter or contract issued after compliance clearance. Accept to begin grant-funded work.",
    backendStages: ["compliance", "peer_review"],
    readOnly: true,
  },
  {
    key: "active_work",
    label: "Active Work & Reporting",
    shortLabel: "Active",
    index: 5,
    description: "Execute project activities under PI supervision. Milestone reviews, funder reporting, and final close-out.",
    backendStages: ["post_award", "closeout"],
  },
];

/** University Grant workflow — 4 stages */
export const UNIVERSITY_GRANT_STAGES = [
  {
    key: "application",
    label: "Application",
    shortLabel: "Apply",
    index: 1,
    description: "Complete your application form and attach supporting documents.",
    backendStages: ["proposal_budget"],
  },
  {
    key: "compliance",
    label: "Compliance Review",
    shortLabel: "Compliance",
    index: 2,
    description: "Ethics and compliance checks are carried out by the grants office.",
    backendStages: ["compliance", "osp_routing"],
    readOnly: true,
  },
  {
    key: "decision",
    label: "Award Decision",
    shortLabel: "Decision",
    index: 3,
    description: "The awards committee reviews your application and makes a funding decision.",
    backendStages: ["peer_review"],
    readOnly: true,
  },
  {
    key: "active",
    label: "Active Grant",
    shortLabel: "Active",
    index: 4,
    description: "Award confirmed. Track spending and submit progress reports through this portal.",
    backendStages: ["post_award", "closeout"],
  },
];

export const DB_GRANT_STAGES = [
  {
    key: "portal",
    label: "External Portal",
    shortLabel: "Portal",
    index: 1,
    description: "Browse and apply on the external grant database.",
    backendStages: [],
    readOnly: true,
  },
];

export function getWorkflowStages(grantCategory) {
  if (grantCategory === "pi") return PI_GRANT_STAGES;
  if (grantCategory === "db") return DB_GRANT_STAGES;
  return UNIVERSITY_GRANT_STAGES;
}

export function backendStageToViewStep(backendStage, stages) {
  for (let i = 0; i < stages.length; i++) {
    if ((stages[i].backendStages || []).includes(backendStage)) return i;
  }
  return 0;
}

/** Map PI grant lifecycle → UI step index (0-based). */
export function resolvePiViewStep(backendStage, lifecycle = {}) {
  const proposal = lifecycle.proposal || {};
  const recruitment = lifecycle.recruitment || {};
  const cr = lifecycle.compliance_review || {};
  const offer = lifecycle.offer || {};

  const briefAck = Boolean(recruitment.brief_acknowledged);
  const submitted = Boolean(proposal.application_submitted);
  const endorsed = Boolean(proposal.pi_confirmed);

  if (backendStage === "closeout" || backendStage === "post_award") return 4;
  if (offer.status === "accepted") return 4;
  if (offer.status === "issued") return 3;
  if (cr.overall_status === "cleared" || offer.status === "pending") return 3;
  if (endorsed && submitted) return 2;
  if (briefAck || submitted) return 1;
  return 0;
}

export function resolveViewStep(grantCategory, backendStage, lifecycle, stages) {
  if (grantCategory === "pi") return resolvePiViewStep(backendStage, lifecycle);
  return backendStageToViewStep(backendStage, stages);
}

export function isPiApplicationSubmitted(lifecycle = {}) {
  return Boolean(lifecycle.proposal?.application_submitted);
}

export function isPiEndorsed(lifecycle = {}) {
  return Boolean(lifecycle.proposal?.pi_confirmed);
}

export function isPiBriefAcknowledged(lifecycle = {}) {
  return Boolean(lifecycle.recruitment?.brief_acknowledged);
}

export const GRANT_STAGES = [
  { key: "proposal_budget", label: "Proposal & Budgeting", index: 1 },
  { key: "compliance", label: "Compliance & Ethics Gates", index: 2 },
  { key: "osp_routing", label: "Internal Routing (OSP)", index: 3 },
  { key: "peer_review", label: "Peer Review Panel", index: 4 },
  { key: "post_award", label: "Post-Award & Effort Tracking", index: 5 },
  { key: "closeout", label: "Milestone & Closeout", index: 6 },
];

export const BUDGET_CATEGORIES = [
  { value: "stipend", label: "Personnel / Stipend" },
  { value: "materials", label: "Materials & Supplies" },
  { value: "travel", label: "Travel & Fieldwork" },
  { value: "equipment", label: "Capital Equipment (≥ KES 5,000)" },
  { value: "other", label: "Other Direct Costs" },
];

export const DEFAULT_FA_RATE = 52;
export const EQUIPMENT_CAP = 5000;

export function lineAmount(line) {
  if (line.category === "stipend") {
    return (Number(line.fte) || 0) * (Number(line.months) || 0) * (Number(line.monthly_rate) || 0);
  }
  return Number(line.amount) || 0;
}

export function calculateBudget(lines = [], tuitionRemission = 0, faRatePct = DEFAULT_FA_RATE) {
  let equipment = 0;
  let totalDirect = 0;
  const errors = [];
  lines.forEach((line) => {
    const amt = lineAmount(line);
    if (line.category === "equipment" && amt >= EQUIPMENT_CAP) equipment += amt;
    if (line.category === "materials" && amt > 1000 && !line.quote_attached) {
      errors.push(`Vendor quote required for materials > KES 1,000 (${line.description || "line"})`);
    }
    totalDirect += amt;
  });
  const mtdc = Math.max(0, totalDirect - equipment - Number(tuitionRemission || 0));
  const indirect = mtdc * (faRatePct / 100);
  return {
    lines,
    equipment_total: equipment,
    tuition_remission: Number(tuitionRemission || 0),
    fa_rate_pct: faRatePct,
    total_direct: totalDirect,
    mtdc,
    indirect,
    total_requested: totalDirect + indirect,
    validation_errors: errors,
  };
}

export function stageIndex(stageKey) {
  return GRANT_STAGES.find((s) => s.key === stageKey)?.index || 1;
}

export function stageLabel(stageKey) {
  return GRANT_STAGES.find((s) => s.key === stageKey)?.label || stageKey;
}

export function peerReviewComposite(scores) {
  const w = { merit: 0.3, impact: 0.25, feasibility: 0.25, budget: 0.2 };
  return Object.entries(w).reduce((sum, [k, wt]) => sum + wt * (Number(scores?.[k]) || 0), 0);
}

export const ROUTING_LABELS = {
  pi: "Sponsoring Faculty PI",
  department_chair: "Department Chair",
  dean: "Dean of College",
  osp: "Office of Sponsored Programs",
};
