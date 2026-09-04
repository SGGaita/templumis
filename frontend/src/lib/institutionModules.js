export const INSTITUTION_MODULES = [
  { id: "enrollment", student: true, staff: true },
  { id: "scholarships", student: true, staff: true },
  { id: "support", student: true, staff: true },
  { id: "grants", student: true, staff: true },
  { id: "rankings", student: false, staff: true },
];

export const DEFAULT_ENABLED_MODULES = {
  student: ["enrollment", "scholarships", "support", "grants"],
  staff: ["enrollment", "scholarships", "support", "grants", "rankings"],
};

export const STAFF_ACCESS_ROLES = [
  "vice_chancellor",
  "registrar",
  "scholarship_office",
  "student_services",
  "research_office",
];

/** Controllable staff sidebar items grouped by product module */
export const STAFF_MODULE_NAV_ITEMS = {
  enrollment: [
    { id: "at_risk", path: "/staff/at-risk", labelKey: "atRisk" },
    {
      id: "students",
      path: "/staff/students",
      labelKey: "students",
      matchPrefixes: ["/staff/enrollment"],
    },
  ],
  support: [{ id: "support", path: "/staff/support", labelKey: "support" }],
  scholarships: [
    { id: "scholarships", path: "/staff/scholarships", labelKey: "scholarships" },
    { id: "financial_aid", path: "/staff/financial-aid", labelKey: "financialAid" },
    { id: "applications", path: "/staff/scholarships/applications", labelKey: "applications" },
    { id: "triage", path: "/staff/scholarships/triage", labelKey: "triage" },
    { id: "decisions", path: "/staff/scholarships/decisions", labelKey: "decisions" },
    { id: "opportunities", path: "/staff/scholarships/opportunities", labelKey: "scholarshipOpportunities" },
    { id: "configure", path: "/staff/scholarships/configure", labelKey: "configureScholarships" },
  ],
  grants: [
    { id: "grants", path: "/staff/grants", labelKey: "grants" },
    { id: "lifecycle", path: "/staff/grants/lifecycle", labelKey: "grantLifecycle" },
    { id: "applications", path: "/staff/grants/applications", labelKey: "grantApplications" },
    { id: "opportunities", path: "/staff/grants/opportunities", labelKey: "grantOpportunities" },
    { id: "configure", path: "/staff/grants/configure", labelKey: "configureGrants" },
  ],
  rankings: [{ id: "rankings", path: "/staff/rankings", labelKey: "rankings" }],
};

export const FULL_MODULE = "*";

const STUDENT_ALWAYS = ["/student", "/student/profile"];
const STAFF_ALWAYS = ["/staff", "/staff/profile", "/staff/analytics"];
const INSTITUTION_ADMIN_ALWAYS = [
  "/institution/admin",
  "/institution/admin/analytics",
  "/institution/admin/users",
  "/institution/admin/domains",
  "/institution/admin/profile",
  "/institution/admin/access",
  "/institution/admin/activity",
];

const STUDENT_PATH_MODULES = [
  { prefixes: ["/student/courses", "/student/grades", "/student/attendance"], modules: ["enrollment"] },
  { prefixes: ["/student/scholarships"], modules: ["scholarships"] },
  { prefixes: ["/student/grants"], modules: ["grants"] },
  { prefixes: ["/student/financials"], modules: ["scholarships", "grants"] },
  { prefixes: ["/student/support"], modules: ["support"] },
];

const STAFF_PATH_MODULES = [
  { prefixes: ["/staff/students", "/staff/enrollment", "/staff/at-risk"], modules: ["enrollment"] },
  { prefixes: ["/staff/scholarships", "/staff/financial-aid"], modules: ["scholarships"] },
  { prefixes: ["/staff/support"], modules: ["support"] },
  { prefixes: ["/staff/grants"], modules: ["grants"] },
  { prefixes: ["/staff/rankings"], modules: ["rankings"] },
];

const INSTITUTION_ADMIN_PATH_MODULES = [
  { prefixes: ["/institution/admin/grants"], modules: ["grants"] },
];

export function normalizeEnabledModules(raw) {
  const fallback = {
    student: [...DEFAULT_ENABLED_MODULES.student],
    staff: [...DEFAULT_ENABLED_MODULES.staff],
  };
  if (!raw || typeof raw !== "object") return fallback;
  const allowed = {
    student: new Set(DEFAULT_ENABLED_MODULES.student),
    staff: new Set(DEFAULT_ENABLED_MODULES.staff),
  };
  const out = { ...fallback };
  for (const portal of ["student", "staff"]) {
    const items = raw[portal];
    if (!Array.isArray(items)) continue;
    const seen = [];
    for (const item of items) {
      if (typeof item === "string" && allowed[portal].has(item) && !seen.includes(item)) {
        seen.push(item);
      }
    }
    out[portal] = seen;
  }
  return out;
}

export function moduleItemPaths(moduleId) {
  return (STAFF_MODULE_NAV_ITEMS[moduleId] || []).map((item) => item.path);
}

function pathMatchesItem(pathname, item) {
  if (!pathname || !item?.path) return false;
  if (pathname === item.path || pathname.startsWith(`${item.path}/`)) return true;
  return (item.matchPrefixes || []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function findStaffNavCatalogItem(pathname) {
  const matches = [];
  for (const [moduleId, items] of Object.entries(STAFF_MODULE_NAV_ITEMS)) {
    for (const item of items) {
      if (pathMatchesItem(pathname, item)) {
        matches.push({ moduleId, item, score: item.path.length });
      }
    }
  }
  if (!matches.length) return null;
  matches.sort((a, b) => b.score - a.score);
  return matches[0];
}

function normalizeModuleGrant(value, moduleId) {
  const paths = moduleItemPaths(moduleId);
  const pathSet = new Set(paths);
  if (value === FULL_MODULE || value === "all" || value === true) return FULL_MODULE;
  if (!Array.isArray(value)) return [];
  const seen = [];
  for (const entry of value) {
    if (typeof entry === "string" && pathSet.has(entry) && !seen.includes(entry)) {
      seen.push(entry);
    }
  }
  const ordered = paths.filter((p) => seen.includes(p));
  if (!ordered.length) return [];
  if (ordered.length === paths.length) return FULL_MODULE;
  return ordered;
}

function defaultRoleGrants(ceiling) {
  const ceilingSet = new Set(ceiling);
  return Object.fromEntries(
    DEFAULT_ENABLED_MODULES.staff.map((moduleId) => [
      moduleId,
      ceilingSet.has(moduleId) ? FULL_MODULE : [],
    ])
  );
}

function legacyModulesToGrants(modules, ceiling) {
  const ceilingSet = new Set(ceiling);
  const selected = new Set(modules);
  return Object.fromEntries(
    DEFAULT_ENABLED_MODULES.staff.map((moduleId) => [
      moduleId,
      ceilingSet.has(moduleId) && selected.has(moduleId) ? FULL_MODULE : [],
    ])
  );
}

export function normalizeStaffRoleModules(raw, enabledStaff = null) {
  const ceiling = Array.isArray(enabledStaff)
    ? DEFAULT_ENABLED_MODULES.staff.filter((id) => enabledStaff.includes(id))
    : [...DEFAULT_ENABLED_MODULES.staff];
  const out = Object.fromEntries(
    STAFF_ACCESS_ROLES.map((role) => [role, defaultRoleGrants(ceiling)])
  );
  if (!raw || typeof raw !== "object") return out;

  for (const role of STAFF_ACCESS_ROLES) {
    const entry = raw[role];
    if (entry == null) continue;
    if (Array.isArray(entry)) {
      out[role] = legacyModulesToGrants(
        entry.filter((m) => typeof m === "string"),
        ceiling
      );
      continue;
    }
    if (typeof entry !== "object") continue;
    const grants = defaultRoleGrants([]);
    for (const moduleId of DEFAULT_ENABLED_MODULES.staff) {
      if (!ceiling.includes(moduleId)) {
        grants[moduleId] = [];
        continue;
      }
      grants[moduleId] = normalizeModuleGrant(
        Object.prototype.hasOwnProperty.call(entry, moduleId) ? entry[moduleId] : [],
        moduleId
      );
    }
    out[role] = grants;
  }
  return out;
}

export function modulesFromRoleGrants(grants) {
  if (!grants || typeof grants !== "object") return [];
  return DEFAULT_ENABLED_MODULES.staff.filter((moduleId) => {
    const value = grants[moduleId];
    return value === FULL_MODULE || (Array.isArray(value) && value.length > 0);
  });
}

export function isModuleEnabled(raw, portal, moduleId) {
  return normalizeEnabledModules(raw)[portal]?.includes(moduleId) ?? false;
}

export function isRoleModuleFullyEnabled(grants, moduleId) {
  return grants?.[moduleId] === FULL_MODULE;
}

export function isRoleNavItemEnabled(grants, moduleId, path) {
  const value = grants?.[moduleId];
  if (value === FULL_MODULE) return true;
  if (Array.isArray(value)) return value.includes(path);
  return false;
}

export function roleModuleSelectionState(grants, moduleId) {
  const paths = moduleItemPaths(moduleId);
  const value = grants?.[moduleId];
  if (value === FULL_MODULE) return { checked: true, indeterminate: false, selected: paths };
  if (!Array.isArray(value) || !value.length) {
    return { checked: false, indeterminate: false, selected: [] };
  }
  return {
    checked: false,
    indeterminate: true,
    selected: value,
  };
}

/** Toggle whole module for a role (full ↔ off). */
export function toggleRoleModuleSelection(staffRoleModules, role, moduleId, enabledModules = null) {
  const ceiling = normalizeEnabledModules(enabledModules).staff;
  const current = normalizeStaffRoleModules(staffRoleModules, ceiling);
  if (!STAFF_ACCESS_ROLES.includes(role) || !ceiling.includes(moduleId)) return current;
  const nextGrant = current[role][moduleId] === FULL_MODULE ? [] : FULL_MODULE;
  return {
    ...current,
    [role]: {
      ...current[role],
      [moduleId]: nextGrant,
    },
  };
}

/** Toggle a single sidebar item within a module. */
export function toggleRoleNavItemSelection(
  staffRoleModules,
  role,
  moduleId,
  path,
  enabledModules = null
) {
  const ceiling = normalizeEnabledModules(enabledModules).staff;
  const current = normalizeStaffRoleModules(staffRoleModules, ceiling);
  if (!STAFF_ACCESS_ROLES.includes(role) || !ceiling.includes(moduleId)) return current;
  const paths = moduleItemPaths(moduleId);
  if (!paths.includes(path)) return current;

  let selected;
  const value = current[role][moduleId];
  if (value === FULL_MODULE) selected = [...paths];
  else if (Array.isArray(value)) selected = [...value];
  else selected = [];

  if (selected.includes(path)) selected = selected.filter((p) => p !== path);
  else selected.push(path);

  const ordered = paths.filter((p) => selected.includes(p));
  const nextGrant =
    ordered.length === 0 ? [] : ordered.length === paths.length ? FULL_MODULE : ordered;

  return {
    ...current,
    [role]: {
      ...current[role],
      [moduleId]: nextGrant,
    },
  };
}

export function roleAllowsStaffPath(staffRoleAccess, pathname) {
  const match = findStaffNavCatalogItem(pathname);
  if (!match) return true;
  if (!staffRoleAccess || typeof staffRoleAccess !== "object") return true;
  return isRoleNavItemEnabled(staffRoleAccess, match.moduleId, match.item.path);
}

export function navItemAllowed(item, enabledList, staffRoleAccess = null) {
  if (!item.module && !item.modules?.length) return true;
  if (item.modules?.length) {
    if (!item.modules.some((m) => enabledList.includes(m))) return false;
  } else if (item.module && !enabledList.includes(item.module)) {
    return false;
  }
  if (!staffRoleAccess || !item.path) return true;
  if (!item.module) return true;
  return isRoleNavItemEnabled(staffRoleAccess, item.module, item.path);
}

export function filterNavGroupsByModules(groups, enabledList, staffRoleAccess = null) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => navItemAllowed(item, enabledList, staffRoleAccess)),
    }))
    .filter((group) => group.items.length > 0);
}

function pathMatches(pathname, prefixes) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPathAllowed(pathname, enabledList, always, rules) {
  if (!pathname) return true;
  if (pathMatches(pathname, always)) return true;
  const rule = rules.find((r) => pathMatches(pathname, r.prefixes));
  if (!rule) return true;
  return rule.modules.some((m) => enabledList.includes(m));
}

export function isStudentPathAllowed(pathname, enabled) {
  const list = normalizeEnabledModules(enabled).student;
  return isPathAllowed(pathname, list, STUDENT_ALWAYS, STUDENT_PATH_MODULES);
}

export function isStaffPathAllowed(pathname, enabled, staffRoleAccess = null) {
  const list = normalizeEnabledModules(enabled).staff;
  if (pathname === "/staff" || pathname === "/staff/") return true;
  if (!isPathAllowed(pathname, list, STAFF_ALWAYS, STAFF_PATH_MODULES)) return false;
  return roleAllowsStaffPath(staffRoleAccess, pathname);
}

export function isInstitutionAdminPathAllowed(pathname, enabled) {
  const list = normalizeEnabledModules(enabled).staff;
  if (pathname === "/institution/admin" || pathname === "/institution/admin/") return true;
  return isPathAllowed(pathname, list, INSTITUTION_ADMIN_ALWAYS, INSTITUTION_ADMIN_PATH_MODULES);
}

export function staffHomePath(user) {
  const enabled = normalizeEnabledModules(user?.enabled_modules).staff;
  if (user?.role === "scholarship_office") {
    if (enabled.includes("scholarships")) return "/staff/financial-aid";
    if (enabled.includes("grants")) return "/staff/grants";
    return "/staff";
  }
  return "/staff";
}

export function toggleModuleSelection(raw, portal, moduleId) {
  const current = normalizeEnabledModules(raw);
  const allowed = portal === "student"
    ? DEFAULT_ENABLED_MODULES.student
    : DEFAULT_ENABLED_MODULES.staff;
  if (!allowed.includes(moduleId)) return current;
  const set = new Set(current[portal]);
  if (set.has(moduleId)) set.delete(moduleId);
  else set.add(moduleId);
  return { ...current, [portal]: allowed.filter((id) => set.has(id)) };
}
