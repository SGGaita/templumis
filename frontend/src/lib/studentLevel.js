/** Normalized student cohort detection (undergraduate vs postgraduate). */

const POSTGRAD_RE =
  /\b(msc|mphil|phd|doctorate|doctoral|mba|ma\b|postgraduate|post-grad|postgrad|master'?s?)\b/i;
const PHD_RE = /\b(phd|doctorate|doctoral|dphil)\b/i;
const UNDERGRAD_RE =
  /\b(undergraduate|undergrad|bachelor|bsc|b\.sc|ba\b|b\.a|llb|beng)\b/i;

export function inferStudentLevel(student = {}) {
  const blob = `${student.student_type || ""} ${student.programme_level || ""} ${student.program || ""} ${student.cohort_level || ""}`.toLowerCase();

  if (student.cohort_level === "postgraduate" || student.cohort_level === "undergraduate") {
    return student.cohort_level;
  }
  if (POSTGRAD_RE.test(blob) && !UNDERGRAD_RE.test(blob)) return "postgraduate";
  if (UNDERGRAD_RE.test(blob) || /\bundergraduate\b/i.test(blob)) return "undergraduate";

  const prog = String(student.program || "").toLowerCase();
  if (/^(m|phd|dphil|mba|msc|ma|mphil)/.test(prog) || POSTGRAD_RE.test(prog)) return "postgraduate";
  return "undergraduate";
}

export function inferDegreeTier(student = {}) {
  const blob = `${student.programme_level || ""} ${student.program || ""}`.toLowerCase();
  if (PHD_RE.test(blob)) return "phd";
  if (POSTGRAD_RE.test(blob)) return "masters";
  return "undergraduate";
}

export function isPostgraduateStudent(student = {}) {
  return inferStudentLevel(student) === "postgraduate";
}

export function studentNavGroups(level = "undergraduate") {
  const academics = {
    label: "Academics",
    items: [
      { text: "My Courses", icon: "courses", path: "/student/courses" },
      { text: "Grades & Results", icon: "grades", path: "/student/grades" },
      { text: "Attendance", icon: "attendance", path: "/student/attendance" },
    ],
  };

  if (level === "postgraduate") {
    return [
      { label: "Overview", items: [{ text: "Dashboard", icon: "dashboard", path: "/student" }] },
      academics,
      {
        label: "Grant information",
        items: [
          { text: "Financials", icon: "financials", path: "/student/financials" },
          { text: "My Grants", icon: "grants", path: "/student/grants" },
          { text: "Funding Opportunities", icon: "funding", path: "/student/grants/opportunities" },
        ],
      },
      {
        label: "Research & support",
        items: [
          { text: "Student Services", icon: "support", path: "/student/support" },
        ],
      },
    ];
  }

  return [
    { label: "Overview", items: [{ text: "Dashboard", icon: "dashboard", path: "/student" }] },
    academics,
    {
      label: "Finance & awards",
      items: [
        { text: "Financials", icon: "financials", path: "/student/financials" },
        { text: "My Scholarships", icon: "scholarships", path: "/student/scholarships" },
        { text: "Available Scholarships", icon: "available", path: "/student/scholarships/available" },
      ],
    },
    { label: "Support", items: [{ text: "Student Services", icon: "support", path: "/student/support" }] },
  ];
}
