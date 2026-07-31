/** Scholarship eligibility — match v2 criteria to logged-in student profile. */

import {
  INSTITUTION_COUNTRY_LABEL,
  isInstitutionCountryStudent,
} from "./residency";

const POSTGRAD_RE =
  /\b(msc|mphil|phd|doctorate|doctoral|mba|ma by research|postgraduate|post-grad|postgrad|master'?s?|graduate research)\b/i;
const UNDERGRAD_RE =
  /\b(undergraduate|undergrad|bachelor|bsc|b\.sc|ba\b|b\.a|llb|beng|b\.eng|under\s*graduate)\b/i;
const FEMALE_ONLY_RE = /\b(female|women|woman|girls)\b/i;
const INTERNATIONAL_ONLY_RE = /\b(non-kenyan|international students?|pan-african)\b/i;

/** Sector / program rules parsed from criteria text */
const SECTOR_RULES = [
  {
    test: (t) => /\b(llb|law & justice|law students?|moot court)\b/i.test(t),
    matchStudent: (s) => /\b(llb|law)\b/i.test(`${s.program} ${s.major}`),
    label: "LLB / Law students only",
  },
  {
    test: (t) => /\b(nursing|bpharm|pharm|nutrition|health sciences)\b/i.test(t),
    matchStudent: (s) =>
      /\b(nurs|pharm|nutrit|health|medicine|midwif)\b/i.test(`${s.program} ${s.major}`),
    label: "Health sciences programmes only",
  },
  {
    test: (t) => /\b(science\/engineering|science|engineering|stem)\b/i.test(t) && FEMALE_ONLY_RE.test(t),
    matchStudent: (s) =>
      /\b(computer|computing|science|engineering|math|physics|chemistry|biology|informatics|it|software|electrical|mechanical|civil|data)\b/i.test(
        `${s.program} ${s.major}`
      ),
    label: "Science / Engineering students only",
  },
  {
    test: (t) => /\bbsc\/msc\b/i.test(t),
    matchStudent: (s) => {
      const combined = `${s.program} ${s.major}`.toLowerCase();
      const isStem =
        /\b(computer|computing|science|engineering|math|physics|chemistry|biology|informatics|technology|software|electrical|mechanical|civil|data|statistics)\b/i.test(
          combined
        );
      return isStem && (s.level === "undergraduate" || /^b/i.test(s.program.toLowerCase()));
    },
    label: "STEM / BSc programmes only",
  },
];

export function parseStudentYear(yearOfStudy) {
  const m = String(yearOfStudy || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export function inferStudentLevel(student = {}) {
  const blob = `${student.student_type || ""} ${student.programme_level || ""} ${student.program || ""}`.toLowerCase();

  if (POSTGRAD_RE.test(blob) && !UNDERGRAD_RE.test(blob)) return "postgraduate";
  if (UNDERGRAD_RE.test(blob) || /\bundergraduate\b/i.test(blob)) return "undergraduate";

  const prog = String(student.program || "").toLowerCase();
  if (/^(m|phd|dphil|mba|msc|ma|mphil)/.test(prog) || POSTGRAD_RE.test(prog)) return "postgraduate";
  if (/^(b|llb)/.test(prog) || prog.includes("bsc") || prog.includes("bachelor") || prog.includes("ba")) {
    return "undergraduate";
  }

  return "undergraduate";
}

function inferScholarshipLevels(scholarship) {
  const text = `${scholarship.scholarship_name || ""} ${scholarship.description || ""} ${scholarship.type || ""} ${scholarship.open_to || ""}`;

  const hasPost =
    POSTGRAD_RE.test(text) ||
    /postgraduate\s+research/i.test(text) ||
    /fellowship/i.test(text) && /msc|ma|phd|research/i.test(text);
  const hasUnder =
    UNDERGRAD_RE.test(text) ||
    /\bbsc\b/i.test(text) ||
    /\bllb\b/i.test(text) ||
    /needy students/i.test(text) ||
    /financial hardship/i.test(text) ||
    /community leaders/i.test(text);

  if (hasPost && !hasUnder) return ["postgraduate"];
  if (hasUnder && !hasPost) return ["undergraduate"];
  if (hasPost && hasUnder) return ["undergraduate", "postgraduate"];
  return ["all"];
}

function parseGpaRequirements(scholarship) {
  const text = `${scholarship.description || ""} ${scholarship.criteria || ""}`;
  const rules = [];

  const fieldMin = Number(scholarship.min_gpa);
  if (!Number.isNaN(fieldMin) && fieldMin > 0) {
    rules.push({ kind: "min", value: fieldMin });
  }

  const range = text.match(/gpa\s*([\d.]+)\s*[–\-—]\s*([\d.]+)/i);
  if (range) {
    rules.push({ kind: "range", min: parseFloat(range[1]), max: parseFloat(range[2]) });
  }

  const minGpa = text.match(/(?:minimum\s+)?gpa\s*(?:≥|>=|at least|of)\s*([\d.]+)/i);
  if (minGpa) {
    rules.push({ kind: "min", value: parseFloat(minGpa[1]) });
  }

  const topPercent = text.match(/top\s*(\d+)\s*%/i);
  if (topPercent) {
    rules.push({ kind: "top_percent", value: parseInt(topPercent[1], 10) });
  }

  return rules;
}

function checkGpa(studentGpa, rules) {
  if (!rules.length) return { ok: true };

  for (const rule of rules) {
    if (rule.kind === "min" && studentGpa < rule.value) {
      return { ok: false, reason: `GPA ${rule.value.toFixed(1)}+ required` };
    }
    if (rule.kind === "range" && (studentGpa < rule.min || studentGpa > rule.max)) {
      return { ok: false, reason: `GPA ${rule.min.toFixed(2)}–${rule.max.toFixed(2)} required` };
    }
    if (rule.kind === "top_percent") {
      return { ok: false, reason: `Top ${rule.value}% GPA required` };
    }
  }
  return { ok: true };
}

function normalizeGender(g) {
  const v = String(g || "").trim().toLowerCase();
  if (v.startsWith("f")) return "female";
  if (v.startsWith("m")) return "male";
  return v || "unknown";
}

function getStudentSnapshot(profile) {
  const s = profile?.student ?? {};
  return {
    gpa: Number(profile?.statistics?.gpa ?? s.gpa ?? 0),
    year: parseStudentYear(s.year_of_study),
    program: String(s.program || "").trim(),
    major: String(s.major || "").trim(),
    gender: normalizeGender(s.gender),
    nationality: String(s.nationality || "").trim().toLowerCase(),
    student_type: String(s.student_type || s.programme_level || "").trim(),
    programme_level: String(s.programme_level || s.program || "").trim(),
    level: inferStudentLevel(s),
  };
}

function checkAcademicLevel(student, scholarship) {
  const allowed = inferScholarshipLevels(scholarship);
  if (allowed.includes("all")) return { ok: true };

  if (!allowed.includes(student.level)) {
    if (student.level === "undergraduate") {
      return { ok: false, reason: "Postgraduate students only" };
    }
    return { ok: false, reason: "Undergraduate students only" };
  }
  return { ok: true };
}

function checkGender(student, scholarship) {
  const text = `${scholarship.description || ""} ${scholarship.scholarship_name || ""}`;
  if (!FEMALE_ONLY_RE.test(text)) return { ok: true };
  if (/\bmale\b/i.test(text) && !FEMALE_ONLY_RE.test(text)) return { ok: true };

  if (student.gender !== "female") {
    return { ok: false, reason: "Female students only" };
  }
  return { ok: true };
}

function checkResidency(student, scholarship) {
  const rules = scholarship.eligibility_rules || {};
  const residency = rules.residency || [];
  if (residency.length) {
    const codes = residency.map((c) => {
      const x = String(c).toLowerCase();
      if (["in_state", "kenyan", "kenya", "domestic"].includes(x)) return "institution_country";
      return x;
    });
    const domestic = isInstitutionCountryStudent(student);
    if (codes.includes("international") && !codes.includes("institution_country")) {
      if (domestic) return { ok: false, reason: "International students only" };
    }
    if (codes.includes("institution_country") && !codes.includes("international")) {
      if (!domestic) {
        return { ok: false, reason: `${INSTITUTION_COUNTRY_LABEL} (institution country) students only` };
      }
    }
    return { ok: true };
  }

  const text = `${scholarship.description || ""} ${scholarship.scholarship_name || ""}`;
  if (!INTERNATIONAL_ONLY_RE.test(text)) return { ok: true };

  if (isInstitutionCountryStudent(student)) {
    return { ok: false, reason: "International students only" };
  }
  return { ok: true };
}

function checkProgramAndMajor(student, scholarship) {
  const text = `${scholarship.description || ""} ${scholarship.open_to || ""} ${scholarship.scholarship_name || ""}`;

  for (const rule of SECTOR_RULES) {
    if (rule.test(text) && !rule.matchStudent(student)) {
      return { ok: false, reason: rule.label };
    }
  }

  const openTo = String(scholarship.open_to || "All").trim();
  if (!openTo || ["All", "All Programs", "All Students", "Any"].includes(openTo)) {
    return { ok: true };
  }

  const openLower = openTo.toLowerCase();
  const progLower = student.program.toLowerCase();
  const majorLower = student.major.toLowerCase();
  const combined = `${progLower} ${majorLower}`;

  if (openLower.includes("stem") && !/\b(computer|computing|science|engineering|math|technology|informatics)\b/i.test(combined)) {
    return { ok: false, reason: "STEM students only" };
  }

  const tokenMatch =
    openLower.includes(progLower) ||
    progLower.includes(openLower) ||
    openLower.includes(majorLower) ||
    majorLower.includes(openLower);

  if (!tokenMatch && openLower.length > 3) {
    return { ok: false, reason: `${openTo} only` };
  }

  return { ok: true };
}

function checkYear(student, scholarship) {
  const yearReq = scholarship.year;
  if (!yearReq || yearReq === "Any" || yearReq === "All Years") return { ok: true };

  if (String(yearReq).includes("+")) {
    const minYear = parseInt(String(yearReq).match(/\d+/)?.[0] || "1", 10);
    if (student.year < minYear) return { ok: false, reason: `${yearReq} only` };
    return { ok: true };
  }
  if (!String(yearReq).includes(String(student.year))) {
    return { ok: false, reason: `${yearReq} only` };
  }
  return { ok: true };
}

/**
 * Full eligibility check for "Open to you" list.
 * @returns {{ eligible: boolean, reason: string|null }}
 */
export function checkScholarshipEligibility(scholarship, profile) {
  const student = getStudentSnapshot(profile);

  const checks = [
    () => checkAcademicLevel(student, scholarship),
    () => checkGpa(student.gpa, parseGpaRequirements(scholarship)),
    () => checkGender(student, scholarship),
    () => checkResidency(student, scholarship),
    () => checkProgramAndMajor(student, scholarship),
    () => checkYear(student, scholarship),
  ];

  for (const run of checks) {
    const result = run();
    if (!result.ok) {
      return { eligible: false, reason: result.reason };
    }
  }

  return { eligible: true, reason: null };
}

export function countEligibleScholarships(scholarships, profile, appliedIds = new Set()) {
  return scholarships.filter((s) => {
    if (String(s.status || "").toLowerCase() !== "open") return false;
    if (appliedIds.has(String(s.id))) return false;
    return checkScholarshipEligibility(s, profile).eligible;
  }).length;
}
