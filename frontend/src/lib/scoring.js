/** Rubric scoring helpers — weights must sum to 1.0; scores are integers 1–5. */

const DEFAULT_WEIGHTS = { academic: 0.34, need: 0.33, lead: 0.33 };

/** Accept 0.34 decimals or legacy 34 / 3.4 percentage-style values. */
export function normalizeRubricWeights(weights = {}) {
  let a = Number(weights.academic ?? DEFAULT_WEIGHTS.academic);
  let n = Number(weights.need ?? DEFAULT_WEIGHTS.need);
  let l = Number(weights.lead ?? DEFAULT_WEIGHTS.lead);

  if (![a, n, l].every(Number.isFinite)) {
    return { ...DEFAULT_WEIGHTS };
  }

  if (Math.max(a, n, l) > 1.5) {
    a /= 100;
    n /= 100;
    l /= 100;
  }

  const sum = a + n + l;
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  if (sum > 1.01) {
    return { academic: a / sum, need: n / sum, lead: l / sum };
  }

  return { academic: a, need: n, lead: l };
}

/** Parse a rubric score; returns integer 1–5 or null. */
export function parseRubricScore(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n;
}

export function previewComposite(scores, weights) {
  const w = normalizeRubricWeights(weights);
  const a = parseRubricScore(scores.academic);
  const n = parseRubricScore(scores.need);
  const l = parseRubricScore(scores.lead);
  if (a == null || n == null || l == null) return null;
  return (w.academic * a + w.need * n + w.lead * l).toFixed(2);
}

export function validateRubricScores(scores) {
  const parsed = {
    academic: parseRubricScore(scores.academic),
    need: parseRubricScore(scores.need),
    lead: parseRubricScore(scores.lead),
  };
  const missing = Object.entries(parsed)
    .filter(([, v]) => v == null)
    .map(([k]) => k.replace(/_/g, " "));
  if (missing.length) {
    return {
      ok: false,
      message: `Enter whole numbers from 1 to 5 for: ${missing.join(", ")}`,
      parsed: null,
    };
  }
  return { ok: true, message: "", parsed };
}
