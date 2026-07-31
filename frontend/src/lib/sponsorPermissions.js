import { resolveAccountCategory } from "@/lib/auth-routing";

const SPONSOR_CATEGORIES = new Set(["sponsor", "advisor"]);

/** Faculty PI / sponsor portal users (not general staff). */
export function isSponsorUser(user) {
  if (!user) return false;
  const category = resolveAccountCategory(user);
  return SPONSOR_CATEGORIES.has(category) || SPONSOR_CATEGORIES.has(user.account_category);
}

export const SPONSOR_ALLOWED_PATH_PREFIXES = [
  "/sponsor",
  "/advisor",
];

export function isPathAllowedForSponsor(pathname) {
  if (!pathname) return true;
  return SPONSOR_ALLOWED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
