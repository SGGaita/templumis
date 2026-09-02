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

const STUDENT_ALWAYS = ["/student", "/student/profile"];
const STAFF_ALWAYS = ["/staff", "/staff/profile", "/staff/settings", "/staff/analytics"];
const INSTITUTION_ADMIN_ALWAYS = [
  "/institution/admin",
  "/institution/admin/analytics",
  "/institution/admin/users",
  "/institution/admin/domains",
  "/institution/admin/profile",
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

export function isModuleEnabled(raw, portal, moduleId) {
  return normalizeEnabledModules(raw)[portal]?.includes(moduleId) ?? false;
}

export function navItemAllowed(item, enabledList) {
  if (item.modules?.length) return item.modules.some((m) => enabledList.includes(m));
  if (item.module) return enabledList.includes(item.module);
  return true;
}

export function filterNavGroupsByModules(groups, enabledList) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => navItemAllowed(item, enabledList)),
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

export function isStaffPathAllowed(pathname, enabled) {
  const list = normalizeEnabledModules(enabled).staff;
  if (pathname === "/staff" || pathname === "/staff/") return true;
  return isPathAllowed(pathname, list, STAFF_ALWAYS, STAFF_PATH_MODULES);
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
