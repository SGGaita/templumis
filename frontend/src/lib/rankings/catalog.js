/**
 * Catalogue of ranking frameworks TemplumIS can assess, plus the rules for
 * which of them an institution / user sees.
 *
 * Ids must match `system.id` in lib/rankings/frameworks.js and
 * RANKING_FRAMEWORK_IDS in backend/app/institution_modules.py.
 */

export const RANKING_FRAMEWORK_GROUPS = [
  { id: "global", label: "Global rankings" },
  { id: "regional", label: "Regional rankings" },
  { id: "india", label: "India accreditation & ranking (IAQRI)" },
];

/**
 * dataSource:
 *  - "live"    scored from the institutional data feed
 *  - "partial" some indicators live, the rest static
 *  - "static"  assessment text/scores are fixed in frameworks.js for now
 */
export const RANKING_FRAMEWORK_CATALOG = [
  { id: "the", label: "THE World University Rankings", short: "THE", group: "global", dataSource: "static" },
  { id: "qs", label: "QS World University Rankings", short: "QS", group: "global", dataSource: "static" },
  { id: "arwu", label: "Shanghai Ranking (ARWU)", short: "Shanghai", group: "global", dataSource: "static" },
  { id: "cwts", label: "CWTS Leiden Ranking", short: "CWTS Leiden", group: "global", dataSource: "static" },
  { id: "web", label: "Webometrics", short: "Webometrics", group: "global", dataSource: "partial" },
  { id: "ssa", label: "THE Africa (Sub-Saharan Africa)", short: "THE Africa", group: "regional", dataSource: "static" },
  { id: "aur", label: "Arab Ranking for Universities (AAUR)", short: "AAUR", group: "regional", dataSource: "static" },
  { id: "the-arab", label: "THE Arab University Rankings", short: "THE Arab", group: "regional", dataSource: "static" },
  { id: "naac", label: "NAAC Accreditation", short: "NAAC", group: "india", dataSource: "live" },
  { id: "nirf", label: "NIRF Ranking", short: "NIRF", group: "india", dataSource: "live" },
];

export const ALL_RANKING_FRAMEWORK_IDS = RANKING_FRAMEWORK_CATALOG.map((f) => f.id);

export function frameworkMeta(id) {
  return RANKING_FRAMEWORK_CATALOG.find((f) => f.id === id) || null;
}

function cleanList(list) {
  if (!Array.isArray(list)) return null;
  const set = new Set(list.filter((id) => typeof id === "string"));
  return ALL_RANKING_FRAMEWORK_IDS.filter((id) => set.has(id));
}

/**
 * Frameworks the institution has made available.
 * null / empty / missing  -> every framework (backwards compatible).
 */
export function institutionFrameworkIds(adminList) {
  const cleaned = cleanList(adminList);
  return cleaned && cleaned.length ? cleaned : [...ALL_RANKING_FRAMEWORK_IDS];
}

/**
 * Frameworks a user sees = institution list narrowed by the user's own choice.
 * An empty or invalid user choice falls back to the institution list.
 */
export function resolveFrameworkIds(adminList, userList) {
  const available = institutionFrameworkIds(adminList);
  const cleaned = cleanList(userList);
  if (!cleaned || !cleaned.length) return available;
  const narrowed = available.filter((id) => cleaned.includes(id));
  return narrowed.length ? narrowed : available;
}

export function filterSystemsByIds(systems, ids) {
  const allowed = new Set(ids);
  return (systems || []).filter((system) => allowed.has(system.id));
}

/** Per-user, per-institution browser storage for the Executive page picker. */
export function userFrameworkStorageKey(user) {
  return `templumis.rankings.executive.frameworks.${user?.institution_id ?? "none"}.${user?.id ?? "anon"}`;
}

export function readUserFrameworks(user) {
  try {
    const raw = window.localStorage.getItem(userFrameworkStorageKey(user));
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeUserFrameworks(user, ids) {
  try {
    window.localStorage.setItem(userFrameworkStorageKey(user), JSON.stringify(ids));
  } catch {
    /* storage unavailable - the choice simply isn't remembered */
  }
}
