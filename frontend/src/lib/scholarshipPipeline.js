import { ST } from "@/lib/staffTheme";
import { BRAND } from "@/lib/brand";

/** Canonical stages shown in the global pipeline guide. */
export const PIPELINE_GUIDE = [
  { key: "submitted", label: "Submit", short: "Apply" },
  { key: "triage", label: "Admin review", short: "Screen" },
  { key: "committee", label: "Committee", short: "Review" },
  { key: "decision", label: "Decision", short: "Decide" },
  { key: "offer", label: "Offer", short: "Offer" },
  { key: "credited", label: "Tuition credit", short: "Credit" },
];

export const STEP_VISUAL = {
  complete: { color: ST.colors.success, bg: ST.colors.successLight },
  current: { color: BRAND.teal, bg: BRAND.tealLight },
  pending: { color: ST.colors.textSecondary, bg: ST.colors.bg },
  failed: { color: ST.colors.error, bg: ST.colors.errorLight },
};

export function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function appCategory(app) {
  const status = normalizeStatus(app?.status);
  if (status === "draft") return "draft";
  if (app?.award_stage === "offer_sent") return "offer";
  if (app?.award_stage === "credited" || status === "awarded") return "awarded";
  if (app?.award_stage) return "decision";
  return "in_review";
}

export function awardAmount(app) {
  const v = app?.["award_amount_(kes)"];
  if (v != null && v !== "") return Number(v);
  const fromSchol = app?.scholarship_details?.["amount_(kes)"];
  return fromSchol != null ? Number(fromSchol) : 0;
}
