/** Financial Aid Officer — configures scholarship opportunities (DB role: scholarship_office). */
export const FINANCIAL_AID_OFFICER_ROLES = new Set(["scholarship_office", "global_admin"]);

export const SCHOLARSHIP_PUBLISHER_ROLES = new Set([
  "registrar",
  "institution_admin",
  "vice_chancellor",
  "global_admin",
]);

export function isFinancialAidOfficer(user) {
  return user && FINANCIAL_AID_OFFICER_ROLES.has(user.role);
}

/** Dedicated portal: scholarships & grants only (not global admin). */
export function isFinancialAidOfficerOnly(user) {
  return user?.role === "scholarship_office";
}

const FAO_ALLOWED_PATH_PREFIXES = [
  "/staff/financial-aid",
  "/staff/scholarships",
  "/staff/grants",
  "/staff/profile",
];

export const SCHOLARSHIP_COMMITTEE_ROLES = new Set([
  "registrar",
  "institution_admin",
  "vice_chancellor",
  "global_admin",
]);

export const SCHOLARSHIP_DECISION_ROLES = new Set([
  "scholarship_office",
  "vice_chancellor",
  "institution_admin",
  "global_admin",
]);

export function canViewAwardDecisions(user) {
  return user && SCHOLARSHIP_DECISION_ROLES.has(user.role);
}

export function isPathAllowedForFinancialAid(pathname) {
  if (!pathname?.startsWith("/staff")) return true;
  if (pathname === "/staff" || pathname === "/staff/") return true;
  return FAO_ALLOWED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function canConfigureScholarships(user) {
  return isFinancialAidOfficer(user);
}

export function canPublishScholarships(user) {
  return user && SCHOLARSHIP_PUBLISHER_ROLES.has(user.role);
}

export const ROLE_LABELS = {
  scholarship_office: "Financial Aid Officer",
  vice_chancellor: "Vice Chancellor",
  registrar: "Registrar",
  student_services: "Student Services",
  research_office: "Research Office",
  global_admin: "Global Admin",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role?.replace(/_/g, " ") || "";
}
