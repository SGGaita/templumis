export const overviewTitle = "TemplumIS documentation";
export const overviewSubtitle =
  "Institutional intelligence for enrollment, student success, financial aid, grants, and rankings.";

export const overviewBlocks = [
  {
    type: "lead",
    text: "TemplumIS is an open-infrastructure platform for Tier 2–3 universities and research hospitals. It unifies siloed student, scholarship, grant, and ranking data into one operational layer for staff, students, reviewers, and administrators.",
  },
  {
    type: "h2",
    id: "who-it-is-for",
    text: "Who it is for",
  },
  {
    type: "table",
    headers: ["Audience", "What they do in TemplumIS"],
    rows: [
      ["Students", "View academics and finances, apply for scholarships or grants, track offers, and reach support services."],
      ["Registrars & student services", "Manage cohorts, monitor at-risk students, and intervene early."],
      ["Scholarship / financial-aid office", "Configure awards, triage applications, run committee review, and credit tuition."],
      ["Research office & PIs", "Publish grant opportunities and manage the research award lifecycle."],
      ["Reviewers, advisors & sponsors", "Score anonymized applications or respond to sponsorship requests."],
      ["Institution & global admins", "Provision tenants, domains, users, and platform settings."],
    ],
  },
  {
    type: "h2",
    id: "modules",
    text: "Core modules",
  },
  {
    type: "table",
    headers: ["Module", "Purpose"],
    rows: [
      ["Enrollment & student success", "Cohort tracking, Time-to-Degree signals, early-warning dashboards, and SIS/LMS student records."],
      ["Scholarship & financial aid", "Opportunity catalogue, applications, administrative triage, blind committee scoring, offers, and tuition credit."],
      ["Student support", "Journey milestones, advisor access, library and support resource links, postgraduate research support."],
      ["Grants & research", "University, PI, and external grant workflows with compliance, routing, peer review, and post-award tracking."],
      ["University rankings", "Indicator tracking across ranking systems, with Excel-backed dashboards and live updates."],
    ],
  },
  {
    type: "h2",
    id: "portals",
    text: "Portals",
  },
  {
    type: "p",
    text: "After sign-in, TemplumIS routes each account to a dedicated portal based on **role** and **account category**.",
  },
  {
    type: "table",
    headers: ["Portal", "Path", "Typical users"],
    rows: [
      ["Student", "/student", "Undergraduate and postgraduate students"],
      ["Staff", "/staff", "Registrar, student services, research office, vice chancellor"],
      ["Financial aid", "/staff/financial-aid", "Scholarship office"],
      ["Reviewer", "/reviewer", "Scholarship committee reviewers"],
      ["Sponsor / advisor", "/sponsor/requests", "Grant sponsors and academic advisors"],
      ["Institution admin", "/institution/admin", "Tenant administrators"],
      ["Global admin", "/global-admin", "Platform operators"],
    ],
  },
  {
    type: "h2",
    id: "how-to-use-these-docs",
    text: "How to use these docs",
  },
  {
    type: "ul",
    items: [
      "**User guide** — day-to-day tasks for each portal.",
      "**Technical documentation** — architecture, database metadata schema, and JSON payloads used by scholarships and grants.",
      "**API documentation** — REST endpoints, authentication, and request conventions. Interactive OpenAPI (Swagger) remains available at `/docs` on the API host.",
    ],
  },
  {
    type: "callout",
    tone: "info",
    title: "Version",
    text: "This documentation describes TemplumIS API version 0.2.0 (FastAPI) with the Next.js 14 App Router frontend.",
  },
];
