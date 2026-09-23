/** Client-side NSFAS tracking filters and aggregate recomputation. */

export const ALLOWANCE_CATEGORIES = [
  ["Tuition", "tuition_allowance_(kes)"],
  ["Accommodation", "accommodation_allowance_(kes)"],
  ["Transport", "transport_allowance_(kes)"],
  ["Living / Meals", "living_/_meals_allowance_(kes)"],
  ["Learning Materials", "learning_materials_allowance_(kes)"],
  ["Disability Support Top-Up", "disability_support_top-up_(kes)"],
];

/** Multi-select filter state — each field is a string array. */
export const EMPTY_FILTERS = {
  region: [],
  gender: [],
  disability: [],
  award: [],
  risk: [],
  standing: [],
  department: [],
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const parseMultiParam = (params, key) => {
  const all = params.getAll(key);
  if (all.length > 1) return all.map((s) => s.trim()).filter(Boolean);
  const single = params.get(key);
  if (!single) return [];
  return single.split(",").map((s) => s.trim()).filter(Boolean);
};

/** @param {URLSearchParams | { get: Function, getAll?: Function }} params */
export function parseFiltersFromParams(params) {
  return {
    region: parseMultiParam(params, "region"),
    gender: parseMultiParam(params, "gender"),
    disability: parseMultiParam(params, "disability"),
    award: parseMultiParam(params, "award"),
    risk: parseMultiParam(params, "risk"),
    standing: parseMultiParam(params, "standing"),
    department: parseMultiParam(params, "department"),
  };
}

export function filtersToSearchParams(filters) {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (Array.isArray(v) && v.length) p.set(k, v.join(","));
  });
  return p;
}

export function countActiveFilters(filters) {
  return Object.values(filters).reduce(
    (sum, v) => sum + (Array.isArray(v) ? v.length : v ? 1 : 0),
    0
  );
}

export function hasFilter(filters, key) {
  const v = filters[key];
  return Array.isArray(v) ? v.length > 0 : Boolean(v);
}

export function isSelected(filters, key, value) {
  const v = filters[key];
  if (Array.isArray(v)) return v.includes(value);
  return v === value;
}

/** Toggle a value in a multi-select filter field. */
export function toggleFilter(filters, key, value) {
  const arr = Array.isArray(filters[key]) ? [...filters[key]] : [];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
  return { ...filters, [key]: arr };
}

export function setMultiFilter(filters, key, values) {
  return { ...filters, [key]: Array.isArray(values) ? values : [] };
}

export function matchStudent(student, filters) {
  if (filters.region?.length) {
    const region = String(student.home_province || "Unspecified");
    if (!filters.region.includes(region)) return false;
  }
  if (filters.gender?.length) {
    const gender = String(student.gender || "Unspecified");
    if (!filters.gender.includes(gender)) return false;
  }
  if (filters.disability?.length) {
    const has = String(student.has_disability || "").toLowerCase() === "yes";
    const matchYes = filters.disability.includes("yes") && has;
    const matchNo = filters.disability.includes("no") && !has;
    if (!matchYes && !matchNo) return false;
  }
  if (filters.award?.length && !filters.award.includes(String(student.award_status || ""))) return false;
  if (filters.risk?.length && !filters.risk.includes(String(student.continuation_risk || ""))) return false;
  if (filters.standing?.length && !filters.standing.includes(String(student.academic_standing || ""))) return false;
  if (filters.department?.length) {
    const dept = String(student.department || "Unspecified");
    if (!filters.department.includes(dept)) return false;
  }
  return true;
}

function breakdown(students, field, fallback = "Unspecified") {
  const counts = {};
  students.forEach((s) => {
    const key = String(s[field] || fallback);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

export function computeNsfasAnalytics(students, filters = EMPTY_FILTERS) {
  const filtered = (students || []).filter((s) => matchStudent(s, filters));
  const gpas = filtered.map((s) => num(s.gpa)).filter((g) => g > 0);
  const attendances = filtered.map((s) => num(s.attendance_pct)).filter((a) => a > 0);

  const withDisability = filtered.filter(
    (s) => String(s.has_disability || "").toLowerCase() === "yes"
  );
  const withoutDisability = filtered.filter(
    (s) => String(s.has_disability || "").toLowerCase() !== "yes"
  );

  const allowanceTotals = Object.fromEntries(
    ALLOWANCE_CATEGORIES.map(([label, key]) => [
      label,
      filtered.reduce((sum, s) => sum + num(s[key]), 0),
    ])
  );

  const disabilityTopUp = filtered.reduce(
    (sum, s) => sum + num(s["disability_support_top-up_(kes)"]),
    0
  );

  const highRisk = filtered.filter((s) => {
    const r = String(s.continuation_risk || "").toLowerCase();
    return r === "high risk" || r === "critical — funding discontinued";
  }).length;

  return {
    students: filtered,
    kpis: {
      total_beneficiaries: filtered.length,
      "total_support_awarded_(kes)": filtered.reduce(
        (sum, s) => sum + num(s["total_support_(kes)"]),
        0
      ),
      "total_disbursed_(kes)": filtered.reduce(
        (sum, s) => sum + num(s["disbursed_(kes)"]),
        0
      ),
      "total_outstanding_balance_(kes)": filtered.reduce(
        (sum, s) => sum + num(s["outstanding_balance_(kes)"]),
        0
      ),
      average_gpa: gpas.length ? Math.round((gpas.reduce((a, b) => a + b, 0) / gpas.length) * 100) / 100 : null,
      average_attendance_pct: attendances.length
        ? Math.round((attendances.reduce((a, b) => a + b, 0) / attendances.length) * 10) / 10
        : null,
      with_disability: withDisability.length,
      high_risk_or_critical: highRisk,
    },
    breakdowns: {
      by_award_status: breakdown(filtered, "award_status"),
      by_academic_standing: breakdown(filtered, "academic_standing"),
      by_continuation_risk: breakdown(filtered, "continuation_risk"),
      by_department: breakdown(filtered, "department"),
      by_home_province: breakdown(filtered, "home_province"),
      by_gender: breakdown(filtered, "gender"),
      disability: {
        with_disability: {
          count: withDisability.length,
          "top_up_disbursed_(kes)": disabilityTopUp,
          avg_gpa: withDisability.length
            ? Math.round(
                (withDisability.reduce((sum, s) => sum + num(s.gpa), 0) / withDisability.length) * 100
              ) / 100
            : null,
        },
        without_disability: {
          count: withoutDisability.length,
          avg_gpa: withoutDisability.length
            ? Math.round(
                (withoutDisability.reduce((sum, s) => sum + num(s.gpa), 0) / withoutDisability.length) *
                  100
              ) / 100
            : null,
        },
      },
      "allowance_category_totals_(kes)": allowanceTotals,
    },
  };
}

export function filterOptions(students) {
  const uniq = (field, fallback = "Unspecified") => {
    const set = new Set(
      (students || []).map((s) => String(s[field] || fallback)).filter(Boolean)
    );
    return [...set].sort((a, b) => a.localeCompare(b));
  };
  return {
    regions: uniq("home_province"),
    genders: uniq("gender"),
    awards: uniq("award_status"),
    risks: uniq("continuation_risk"),
    standings: uniq("academic_standing"),
    departments: uniq("department"),
  };
}

/** Flat list of active filter chips for display. */
export function flattenFilterChips(filters, labels) {
  const chips = [];
  const pushMulti = (key, prefix, values) => {
    values.forEach((v) => chips.push({ key, value: v, label: `${prefix}: ${v}` }));
  };
  pushMulti("region", labels.region, filters.region || []);
  pushMulti("gender", labels.gender, filters.gender || []);
  (filters.disability || []).forEach((d) => {
    chips.push({
      key: "disability",
      value: d,
      label: `${labels.disability}: ${d === "yes" ? labels.withDisability : labels.withoutDisability}`,
    });
  });
  pushMulti("department", labels.department, filters.department || []);
  pushMulti("award", labels.award, filters.award || []);
  pushMulti("risk", labels.risk, filters.risk || []);
  pushMulti("standing", labels.standing, filters.standing || []);
  return chips;
}
