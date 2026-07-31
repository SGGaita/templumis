/** Mock scholarship catalog (merged with API until Excel catalog is complete). */

export const MOCK_SCHOLARSHIPS = [
  {
    id: "MOCK-MERIT-01",
    scholarship_name: "TemplumIS Academic Excellence Award",
    type: "merit",
    status: "open",
    min_gpa: 3.5,
    year: "Any",
    open_to: "All",
    "amount_(kes)": 150000,
    frequency: "Annual",
    slots: 10,
    remaining: 7,
    description:
      "Merit scholarship for students with outstanding academic performance. Requires essay and one academic reference.",
    requires_references: 1,
    is_mock: true,
  },
  {
    id: "MOCK-NEED-02",
    scholarship_name: "Access & Equity Bursary",
    type: "need-based",
    status: "open",
    min_gpa: 2.0,
    year: "Any",
    open_to: "All",
    "amount_(kes)": 80000,
    frequency: "Annual",
    slots: 20,
    remaining: 12,
    description:
      "Need-based support for students demonstrating financial need. Income verification documents required.",
    requires_references: 0,
    is_mock: true,
  },
  {
    id: "MOCK-TALENT-03",
    scholarship_name: "Sports & Athletics Scholarship",
    type: "talent",
    status: "open",
    min_gpa: 2.5,
    year: "Any",
    open_to: "All",
    "amount_(kes)": 120000,
    frequency: "Annual",
    slots: 5,
    remaining: 3,
    description:
      "Talent scholarship for student-athletes. Portfolio links and coach reference required.",
    requires_references: 1,
    is_mock: true,
  },
  {
    id: "MOCK-TALENT-04",
    scholarship_name: "Innovation & Research Grant (UG)",
    type: "talent",
    status: "open",
    min_gpa: 3.0,
    year: "3+",
    open_to: "STEM",
    "amount_(kes)": 200000,
    frequency: "One-time",
    slots: 4,
    remaining: 2,
    description:
      "Supports undergraduate research portfolios (GitHub, publications, media samples).",
    requires_references: 1,
    is_mock: true,
  },
  {
    id: "MOCK-MERIT-05",
    scholarship_name: "Dean's List Honour Scholarship",
    type: "merit",
    status: "open",
    min_gpa: 3.7,
    year: "2+",
    open_to: "All",
    "amount_(kes)": 100000,
    frequency: "Annual",
    slots: 8,
    remaining: 5,
    description:
      "Prestigious merit award with committee review. Two academic references required.",
    requires_references: 2,
    is_mock: true,
  },
];

export function mergeScholarshipCatalog(apiList = []) {
  const seen = new Set(apiList.map((s) => String(s.id)));
  const merged = [...apiList];
  for (const m of MOCK_SCHOLARSHIPS) {
    if (!seen.has(String(m.id))) merged.push({ ...m, deadline: m.deadline || defaultDeadline(m.id) });
  }
  return merged;
}

function defaultDeadline(id) {
  const d = new Date();
  if (id === "MOCK-NEED-02") d.setDate(d.getDate() + 2);
  else if (id === "MOCK-MERIT-05") d.setDate(d.getDate() + 1);
  else d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}
