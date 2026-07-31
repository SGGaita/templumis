const STAFF_ROLES = new Set([

  "vice_chancellor",

  "registrar",

  "scholarship_office",

  "student_services",

  "research_office",

]);



const SPONSOR_CATEGORIES = new Set(["sponsor", "advisor"]);



/** Resolve where to send a user after login (handles null account_category). */

export function resolveAccountCategory(user) {

  if (!user) return null;

  if (

    user.account_category === "staff" ||

    user.account_category === "student" ||

    user.account_category === "reviewer" ||

    SPONSOR_CATEGORIES.has(user.account_category)

  ) {

    return user.account_category;

  }

  if (user.role === "scholarship_reviewer") return "reviewer";

  if (user.role === "student") return "student";

  if (STAFF_ROLES.has(user.role)) return "staff";

  if (user.role === "institution_admin") return "institution_admin";

  if (user.role === "global_admin") return "global_admin";

  return user.account_category || null;

}



export function isSponsorCategory(user) {

  return SPONSOR_CATEGORIES.has(resolveAccountCategory(user));

}



export function getPostLoginPath(user) {

  const category = resolveAccountCategory(user);

  if (isSponsorCategory(user)) {

    return "/sponsor/requests";

  }

  if (user?.role === "scholarship_office") {

    return "/staff/financial-aid";

  }

  if (user?.role === "scholarship_reviewer" || category === "reviewer") {

    return "/reviewer";

  }

  switch (category) {

    case "staff":

      return "/staff";

    case "student":

      return "/student";

    case "institution_admin":

      return "/institution/admin";

    case "global_admin":

      return "/global-admin";

    default:

      return null;

  }

}


