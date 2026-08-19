export const userGuideTitle = "User guide";
export const userGuideSubtitle =
  "How to sign in, work in each portal, and complete scholarship and grant workflows.";

export const userGuideBlocks = [
  { type: "h2", id: "getting-started", text: "Getting started" },
  { type: "h3", id: "create-account", text: "Create an account" },
  {
    type: "ol",
    items: [
      "Open **Sign up** from the home page.",
      "Choose **Student** or **Admin staff**.",
      "Students enter their official **student registration number**. TemplumIS looks up the SIS record and fills name and institutional email when a match exists.",
      "Use an email on a domain registered to your institution (for example `@university.edu`). Unregistered domains are rejected.",
      "Complete account details and submit. If email verification is required, enter the code sent to your inbox.",
    ],
  },
  {
    type: "callout",
    tone: "note",
    title: "Who can self-register",
    text: "Students and staff sign up through the public form, gated by institution email domains. Institution admins are created by a global admin. Global admins are created from the server CLI (`python manage.py create-global-admin`), not from the website. Reviewers join via an invite link.",
  },
  { type: "h3", id: "sign-in", text: "Sign in" },
  {
    type: "ul",
    items: [
      "Standard login: `/login` — students, staff, reviewers, sponsors.",
      "Institution admin: `/institution/login`.",
      "Global admin: `/global-admin/login`.",
    ],
  },
  {
    type: "p",
    text: "After a successful login you are sent to the portal that matches your account. Inactive accounts cannot sign in.",
  },

  { type: "h2", id: "students", text: "Student portal" },
  {
    type: "p",
    text: "The student sidebar changes with cohort level. Undergraduates see scholarships; postgraduates see grants and research support.",
  },
  { type: "h3", id: "ug-nav", text: "Undergraduate navigation" },
  {
    type: "table",
    headers: ["Area", "Pages", "What you can do"],
    rows: [
      ["Overview", "Dashboard", "See journey progress, alerts, and eligible awards."],
      ["Academics", "Courses, grades, attendance", "Review enrolled courses, results, and attendance."],
      ["Finance & awards", "Financials, my scholarships, available scholarships", "Check balances, track applications, and apply."],
      ["Support", "Student services", "Open library, advising, writing centre, and other support links."],
    ],
  },
  { type: "h3", id: "pg-nav", text: "Postgraduate navigation" },
  {
    type: "table",
    headers: ["Area", "Pages", "What you can do"],
    rows: [
      ["Overview", "Dashboard", "Research-oriented snapshot of progress and funding."],
      ["Academics", "Courses, grades, attendance", "Same academic records as undergraduates."],
      ["Grant information", "Financials, my grants, funding opportunities", "Apply to university, PI, or external grants and track lifecycle."],
      ["Research & support", "Student services", "Advisor, supervisor, writing centre, and library resources."],
    ],
  },
  {
    type: "p",
    text: "Your profile (`/student/profile`) shows registration number, programme, and contact details used to auto-fill applications.",
  },

  { type: "h2", id: "scholarships", text: "Scholarships" },
  {
    type: "p",
    text: "Undergraduate students browse published opportunities, save drafts, upload documents, request references, and respond to offers. Staff run triage, committee scoring, and disbursement behind the scenes.",
  },
  { type: "h3", id: "apply-scholarship", text: "Apply for a scholarship" },
  {
    type: "ol",
    items: [
      "Open **Available Scholarships**. Only **open** programmes you have not already applied to are highlighted as eligible.",
      "Confirm auto-filled profile fields (name, student ID, email, programme, GPA, credits).",
      "Complete type-specific fields: merit essay, need-based supporting documents, or talent portfolio and statement.",
      "If references are required, invite recommenders and choose a FERPA waiver option before submit.",
      "Upload PDF, PNG, or JPEG files (typically ≤ 10 MB; media up to 50 MB).",
      "Submit. Status moves from **draft** into administrative review.",
    ],
  },
  { type: "h3", id: "scholarship-pipeline", text: "What happens after you submit" },
  {
    type: "table",
    headers: ["Stage", "What you see", "What staff do"],
    rows: [
      ["Submit", "Application received", "High-pass eligibility check against programme rules."],
      ["Admin review (triage)", "Under triage", "Document verification; automated rejection if ineligible."],
      ["Committee", "Committee phase", "Blind scoring on academic, need, and leadership (1–5)."],
      ["Decision", "Awaiting decision", "Stack-ranking against budget; proposed award amounts."],
      ["Offer", "Offer received — action required", "Offer letter issued; 14 business-day response window."],
      ["Tuition credit", "Applied to tuition", "Finance credits the award after you accept."],
    ],
  },
  {
    type: "callout",
    tone: "info",
    title: "Offers",
    text: "When an offer is sent, open **My Scholarships** and accept or decline. Declining may release the slot to a runner-up. Expired offers cannot be accepted.",
  },

  { type: "h2", id: "grants", text: "Grants" },
  {
    type: "p",
    text: "Grant opportunities are catalogue programmes with `program_kind = grant`. The student workflow depends on category.",
  },
  {
    type: "table",
    headers: ["Category", "Student steps", "Notes"],
    rows: [
      ["University grant", "Apply → compliance → award decision → active grant", "Ethics and awards committee handled by the grants office."],
      ["PI grant", "Project brief → apply (or accept PI invite) → compliance → offer → active work", "Supervisor endorsement is required before compliance review."],
      ["External database (db)", "Follow the external portal", "TemplumIS stores a pointer; application happens outside the system."],
    ],
  },
  {
    type: "p",
    text: "On PI grants you review the scope of work, acknowledge the brief, upload proposal documents, and either self-apply or accept an invitation. After award you track milestones, reporting, and close-out from the grant lifecycle page.",
  },

  { type: "h2", id: "staff", text: "Staff portal" },
  {
    type: "p",
    text: "Staff with roles such as registrar, student services, research office, or vice chancellor land on `/staff`. Scholarship officers land on the financial-aid dashboard instead.",
  },
  { type: "h3", id: "staff-success", text: "Student success" },
  {
    type: "ul",
    items: [
      "**At-risk students** — filter by finances, attendance, or academic flags and open a student record.",
      "**Student support** — review tickets, resources, and postgraduate support context.",
      "**Students** — browse all students and filter undergraduates / postgraduates from one registry. Import SIS extracts where enabled.",
    ],
  },
  { type: "h3", id: "staff-aid", text: "Financial aid officers" },
  {
    type: "ol",
    items: [
      "**Configure** a scholarship or grant (eligibility, valuation, slots, deadline).",
      "Submit for review; a **director-level** role (registrar, institution admin, vice chancellor) **publishes** it (maker-checker).",
      "**Triage** submitted applications: run the high-pass, verify documents, assign reviewers.",
      "Committee reviewers score in the reviewer portal. Officers resolve **disputed** scores when reviewer variance is high.",
      "**Review outcome and awards** — apply recommended awards, send offers, and credit tuition after acceptance.",
    ],
  },
  { type: "h3", id: "staff-grants-rankings", text: "Grants, rankings, and analytics" },
  {
    type: "ul",
    items: [
      "Grant applications can be reviewed, routed (PI → chair → dean → OSP), peer-reviewed, and moved through post-award and procurement steps.",
      "**University rankings** tracks indicators per ranking system and can stream live updates.",
      "**Analytics** provides executive enrollment, retention, and aid summaries for the institution.",
    ],
  },

  { type: "h2", id: "reviewers", text: "Reviewers, advisors, and sponsors" },
  { type: "h3", id: "reviewer-guide", text: "Scholarship reviewers" },
  {
    type: "p",
    text: "Reviewers are invited by the scholarship office. They set a password from the invite link, then work in `/reviewer`. Applications may be anonymized (`APP-YYYY-XXXXXXXX`) when blind review is enabled. Score **academic**, **need**, and **leadership** as whole numbers from 1 to 5. Composite score uses institution (or programme) weights that default to 0.34 / 0.33 / 0.33.",
  },
  { type: "h3", id: "sponsor-guide", text: "Sponsors and advisors" },
  {
    type: "p",
    text: "Accounts with category `sponsor` or `advisor` open **Sponsorship requests**. Open a request, review the project brief, and respond. Past requests remain under **Past requests**.",
  },

  { type: "h2", id: "admins", text: "Administrators" },
  { type: "h3", id: "institution-admin", text: "Institution admin" },
  {
    type: "ul",
    items: [
      "Login at `/institution/login`.",
      "Maintain institution **profile** (name, contact, address).",
      "Register **email domains** that gate signup and login.",
      "Create users and assign roles: registrar, scholarship office, student services, research office, vice chancellor, and related staff.",
      "Activate or deactivate users; review the institution **activity log**.",
    ],
  },
  { type: "h3", id: "global-admin", text: "Global admin" },
  {
    type: "ul",
    items: [
      "Provision institutions (name, slug, contact).",
      "Attach domains and create the first institution admin for each tenant.",
      "Activate, deactivate, or delete institutions.",
      "Inspect cross-tenant stats, activity, and platform settings (name, support email, registration, email verification, maintenance mode).",
    ],
  },
];
