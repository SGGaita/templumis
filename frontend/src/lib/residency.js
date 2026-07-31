/**
 * Residency eligibility: institution home country vs international.
 * Institution country defaults to Kenya (TemplumIS); extend via config when multi-country.
 */

export const INSTITUTION_COUNTRY = "kenya";
export const INSTITUTION_COUNTRY_LABEL = "Kenya";

export const RESIDENCY_FILTER_OPTIONS = [
  { id: "", label: "No restriction (all nationalities)" },
  {
    id: "institution_country",
    label: `Institution country (${INSTITUTION_COUNTRY_LABEL})`,
    description: "Students whose nationality is the same as the institution's country",
  },
  {
    id: "international",
    label: "International",
    description: `Students from countries other than ${INSTITUTION_COUNTRY_LABEL}`,
  },
];

/** Map legacy DB values to current codes. */
export function normalizeResidencyCode(code) {
  const c = String(code || "").toLowerCase().trim();
  if (["in_state", "out_of_state", "kenyan", "kenya", "domestic", "institution_country"].includes(c)) {
    if (c === "international") return "international";
    return "institution_country";
  }
  return c;
}

/** Single radio value from stored residency array. */
export function residencyArrayToSelection(residency) {
  if (!residency?.length) return "";
  const codes = residency.map(normalizeResidencyCode);
  if (codes.includes("international") && !codes.includes("institution_country")) {
    return "international";
  }
  if (codes.includes("institution_country")) return "institution_country";
  return "";
}

export function selectionToResidencyArray(selection) {
  if (!selection) return [];
  return [selection];
}

export function isInstitutionCountryStudent(student, institutionCountry = INSTITUTION_COUNTRY) {
  const nat = String(student?.nationality || "").toLowerCase().trim();
  const home = institutionCountry.toLowerCase();
  if (!nat) return true;
  if (nat === home || nat === "kenyan" && home === "kenya") return true;
  if (nat.includes(home) || home.includes(nat)) return true;
  return false;
}

export function residencySummary(residency) {
  const sel = residencyArrayToSelection(residency);
  if (sel === "institution_country") {
    return `${INSTITUTION_COUNTRY_LABEL} (institution country) students only`;
  }
  if (sel === "international") return "International students only";
  return "";
}
