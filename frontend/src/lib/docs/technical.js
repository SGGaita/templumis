export const technicalTitle = "Technical documentation";
export const technicalSubtitle =
  "Architecture, identity, relational metadata schema, and JSON contracts used across TemplumIS.";

export const technicalBlocks = [
  { type: "h2", id: "architecture", text: "Architecture" },
  {
    type: "p",
    text: "TemplumIS is a containerized four-service stack. Nginx terminates HTTP and routes `/api/` to FastAPI and all other paths to Next.js. PostgreSQL is the system of record for identity, applications, configuration, and audit. SIS/LMS operational data (courses, enrollments, grades) is also harvested from Excel workbooks mounted under `/data` for institutions that have not completed a live SIS connector.",
  },
  {
    type: "table",
    headers: ["Layer", "Technology", "Default ports"],
    rows: [
      ["Frontend", "Next.js 14 (App Router), Material UI, Montserrat", "3000"],
      ["Backend", "Python 3.12, FastAPI, SQLAlchemy, Alembic", "8000 in-container / 8001 on host"],
      ["Database", "PostgreSQL 16", "5432 in-container / 5434 on host"],
      ["Edge", "Nginx reverse proxy", "80"],
      ["CI/CD", "GitHub Actions → SSH deploy to `/opt/templumis`", "—"],
    ],
  },
  {
    type: "p",
    text: "JWT access tokens (HS256) expire after 24 hours. Passwords are hashed with bcrypt. CORS origins and SMTP settings come from environment variables. Tenant isolation is **shared-schema**: every institutional row carries `institution_id`, and API handlers scope queries to the authenticated user's institution (global admins excepted).",
  },
  {
    type: "callout",
    tone: "note",
    title: "Deployment modes",
    text: "The same codebase supports multitenant SaaS, single-institution on-premise, and hybrid. Global admin provisions tenants; institution admin owns domains and local users.",
  },

  { type: "h2", id: "identity", text: "Identity, roles, and account categories" },
  {
    type: "p",
    text: "A user has a **role** (authorization) and an **account_category** (which portal they enter). If category is missing on a legacy row, the API derives it from role on login.",
  },
  {
    type: "table",
    headers: ["Role (`user_role` enum)", "Typical category", "Capabilities"],
    rows: [
      ["global_admin", "global_admin", "All tenants, platform settings, seed institution admins."],
      ["institution_admin", "institution_admin", "Tenant profile, domains, users, activity."],
      ["vice_chancellor", "staff", "Staff portal; can publish scholarships and sit on committee."],
      ["registrar", "staff", "Enrollment, committee, publisher (maker-checker)."],
      ["scholarship_office", "staff", "Financial-aid officer: configure, triage, awards."],
      ["scholarship_reviewer", "reviewer", "Blind scoring portal only."],
      ["student_services", "staff", "At-risk, support, student records."],
      ["research_office", "staff", "Grants; may also act as advisor."],
      ["student", "student", "Student portal (UG scholarships / PG grants)."],
    ],
  },
  {
    type: "p",
    text: "Additional categories `sponsor` and `advisor` are stored on the user even when the role is a staff role, so those accounts open the sponsorship portal instead of the full staff nav.",
  },
  {
    type: "table",
    headers: ["Permission set", "Roles"],
    rows: [
      ["Financial aid officer (configure opportunities)", "scholarship_office, global_admin"],
      ["Scholarship publisher (go-live)", "registrar, institution_admin, vice_chancellor, global_admin"],
      ["Committee / blind review", "registrar, institution_admin, vice_chancellor, global_admin, scholarship_reviewer"],
      ["Staff portal", "vice_chancellor, registrar, scholarship_office, student_services, research_office, global_admin"],
    ],
  },

  { type: "h2", id: "metadata-schema", text: "Metadata schema" },
  {
    type: "p",
    text: "The following tables are the canonical metadata model. Types follow PostgreSQL. JSON columns are documented in the next section. Unless noted, timestamps are timezone-naive UTC from the database server.",
  },

  { type: "h3", id: "schema-tenancy", text: "Tenancy and identity" },
  {
    type: "table",
    headers: ["Table", "Key fields", "Purpose"],
    rows: [
      ["institutions", "id, name, slug (unique), logo_url, contact_email, address, is_active, created_at, updated_at", "Tenant root."],
      ["institution_domains", "id, institution_id, domain (unique), is_primary, created_at", "Email domain gate for signup."],
      ["users", "id, email (unique), hashed_password, full_name, role, institution_id, account_category, student_registration_number, email_verified, verification_code, verification_code_expires, invite_token, invite_token_expires, is_active, created_at, updated_at", "All human accounts."],
      ["platform_settings", "id, setting_key (unique), setting_value, description, updated_at, updated_by", "Global key/value configuration."],
      ["audit_log", "id, institution_id, user_id, action, entity_type, entity_id, details (JSON), ip_address, created_at", "Immutable activity trail."],
    ],
  },

  { type: "h3", id: "schema-enrollment", text: "Enrollment and student success" },
  {
    type: "table",
    headers: ["Table", "Key fields", "Purpose"],
    rows: [
      ["programs", "id, institution_id, name, department, degree_level, expected_duration_years, minimum_gpa", "Academic programmes."],
      ["cohorts", "id, institution_id, name, start_year, start_semester, program_id", "Intake groups."],
      ["students", "id, institution_id, student_number, full_name, email, phone, program_id, cohort_id, status, compliance, gpa, credits_completed, enrollment_date, expected_graduation, actual_graduation, address, date_of_birth, current_milestone, risk_level, last_advisor_contact_date, program_level", "Canonical student record."],
      ["student_milestones", "id, student_id, milestone_type, milestone_date, academic_year, semester, notes, created_by", "Registrar-recorded milestones."],
      ["student_status_history", "id, student_id, old_status, new_status, old_compliance, new_compliance, change_date, reason, changed_by, notes", "Status transitions."],
      ["student_withdrawals", "id, student_id, withdrawal_date, withdrawal_reason, detailed_reason, academic_year, semester, gpa_at_withdrawal, credits_at_withdrawal, financial_balance, exit_interview_completed, is_eligible_for_readmission", "Leaver records."],
      ["semester_enrollments", "id, student_id, academic_year, semester, enrollment_date, is_enrolled, credits_enrolled, is_full_time", "Term-by-term enrollment."],
      ["cohort_retention_metrics", "id, institution_id, cohort_id, program_id, snapshot_date, initial_cohort_size, current_enrolled, graduated, withdrawn, on_leave, transferred_out, retention_rate_1yr–4yr, graduation_rate_4yr–6yr, avg_gpa, avg_credits_completed", "TTD / retention snapshots."],
      ["early_warning_alerts", "id, student_id, alert_type, severity, alert_date, description, is_resolved, resolved_date, resolution_notes, assigned_to", "Early-warning flags."],
      ["student_interventions", "id, student_id, alert_id, intervention_type, intervention_date, provider, description, outcome, follow_up_required, follow_up_date, intervention_category, success_metric, completion_date, effectiveness_rating, created_by", "Interventions against alerts."],
      ["student_risk_scores", "id, student_id, risk_score, risk_level, risk_factors (JSON), intervention_recommended, calculated_at", "Computed risk."],
    ],
  },
  {
    type: "p",
    text: "**students.status** typical values: `active`, `on_leave`, `withdrawn`, `graduated`, `transferred`. **compliance** uses a traffic-light: `green`, `amber`, `red`. **risk_level**: `low`, `medium`, `high`, `critical`. **program_level**: `undergraduate`, `masters`, `phd`.",
  },

  { type: "h3", id: "schema-support", text: "Student journey and support" },
  {
    type: "table",
    headers: ["Table", "Key fields", "Purpose"],
    rows: [
      ["student_journey_milestones", "id, student_id, milestone_type, milestone_date, status, notes", "Journey tracker (pending / completed / at_risk / missed)."],
      ["student_advisors", "id, student_id, advisor_id, assignment_date, advisor_type, is_active, notes", "Academic, financial, research, or thesis advisor."],
      ["library_resources", "id, institution_id, resource_name, resource_type, url, description, access_instructions, is_active", "Library catalogue links."],
      ["support_resource_links", "id, institution_id, resource_category, title, description, url, contact_email, phone, office_hours, program_level_filter, is_active", "Support directory. `program_level_filter`: all / undergraduate / postgraduate."],
      ["postgrad_support", "id, student_id (unique), research_area, thesis_advisor_id, thesis_status, conference_attendance (JSON), publications (JSON), grant_applications (JSON)", "PG research dossier."],
    ],
  },

  { type: "h3", id: "schema-aid", text: "Scholarships, grants, triage, and awards" },
  {
    type: "table",
    headers: ["Table", "Key fields", "Purpose"],
    rows: [
      ["scholarship_programs", "id, external_id (unique), program_kind, institution_id, title, sponsoring_entity, gl_code, program_type, criteria_text, value_kes, coverage, slots_available, slots_filled, workflow_status, budget_total_allocated, valuation_type, valuation_config (JSON), eligibility_rules (JSON), logic_expression (JSON), over_award_tolerance_pct, min_gpa, requires_references, academic_year, open_to, application_deadline, created_by, approved_by, approved_at", "Catalogue of scholarships and grants."],
      ["student_scholarship_applications", "id, institution_id, student_number, scholarship_external_id, status, form_data (JSON), references_data (JSON), ferpa_waived, progress_pct, gpa_at_application, award_amount, applied_date, review_notes, triage_queue, auto_reject_reason, anonymized_id, documents_verified, documents_verified_at, documents_verified_by, eligibility_snapshot (JSON), need_index, triage_notes, consensus_score, score_std_dev, evaluation_status, award_stage, offer_sent_at, offer_deadline, offer_accepted_at, offer_declined_at, approved_at, approved_by, credited_at, offer_data (JSON), scholarship_probation", "Student scholarship applications through credit."],
      ["student_grant_applications", "id, institution_id, student_number, grant_external_id, project_title, status, lifecycle_stage, form_data (JSON), amount_requested, award_amount, applied_date, review_notes, progress_pct", "Grant applications; lifecycle lives in form_data."],
      ["scholarship_triage_config", "id, institution_id (unique), blind_review_enabled, min_reviewers_per_application, cycle_year, anonymization_salt, variance_threshold, weight_academic, weight_need, weight_lead, award_budget_pool, updated_by", "Per-tenant triage and rubric defaults."],
      ["scholarship_review_assignments", "id, application_id, reviewer_user_id, assignment_slot, status, score_academic, score_need, score_lead, composite_score, scored_at", "One row per reviewer × application."],
    ],
  },
  {
    type: "p",
    text: "**scholarship_programs.program_kind**: `scholarship` | `grant`. **workflow_status**: `draft` | `in_review` | `published`. **valuation_type**: `fixed_sum` | `percent` | `full_ride` | `cap`.",
  },
  {
    type: "p",
    text: "**student_scholarship_applications.status**: `draft` | `submitted` | `awarded` | `rejected` (plus staff-facing workflow labels). **triage_queue**: `pending_triage` | `rejection_automated` | `document_verification` | `ready_for_committee` | `assigned`. **evaluation_status**: `pending_scores` | `disputed` | `reconciled`. **award_stage**: `proposed` | `approved` | `offer_sent` | `offer_accepted` | `offer_declined` | `offer_expired` | `credited`.",
  },
  {
    type: "p",
    text: "**student_grant_applications.lifecycle_stage**: `proposal_budget` | `compliance` | `osp_routing` | `peer_review` | `post_award` | `closeout`.",
  },

  { type: "h3", id: "schema-rankings", text: "Rankings" },
  {
    type: "table",
    headers: ["Table", "Key fields", "Purpose"],
    rows: [
      ["ranking_systems", "id, name (unique), code (unique), description, website_url, logo_url, is_active", "e.g. THE, QS."],
      ["ranking_indicators", "id, ranking_system_id, name, code, description, weight_percentage, category, measurement_unit, is_active", "Weighted indicators."],
      ["institution_ranking_data", "id, institution_id, indicator_id, satisfies_indicator, current_value, target_value, notes, last_assessed_date, assessed_by", "Current performance vs target."],
      ["institution_rankings", "id, institution_id, ranking_system_id, ranking_year, overall_rank, overall_score, national_rank, regional_rank, subject_area, ranking_url", "Published league-table outcomes."],
    ],
  },

  { type: "h2", id: "json-schemas", text: "JSON schemas" },
  { type: "h3", id: "json-eligibility", text: "eligibility_rules" },
  {
    type: "p",
    text: "Stored on `scholarship_programs`. Matching is conjunctive: every present constraint must pass.",
  },
  {
    type: "code",
    label: "eligibility_rules",
    text: `{
  "min_gpa": 3.2,
  "min_credits": 30,
  "majors": ["Computer Science", "Engineering"],
  "residency": ["institution_country"],
  "gender": "female",
  "level": "postgraduate",
  "gates": {
    "good_standing": true,
    "active_enrollment": true
  },
  "scope_of_work": "Optional PI grant brief shown to applicants"
}`,
  },
  {
    type: "ul",
    items: [
      "`residency` codes: `institution_country` (domestic) or `international`. Both together is rejected at save time.",
      "`min_gpa` may also be duplicated on the column `scholarship_programs.min_gpa`; the column is merged into rules during simulation.",
      "GPA and credits are read from SIS student fields (`gpa` / `cumulative_gpa`, `credits_completed`, and related aliases).",
    ],
  },

  { type: "h3", id: "json-valuation", text: "valuation_config and logic_expression" },
  {
    type: "code",
    label: "valuation_config",
    text: `{
  "percent": 50,
  "cap_kes": 75000,
  "rubric_weights": {
    "academic": 0.34,
    "need": 0.33,
    "lead": 0.33
  }
}`,
  },
  {
    type: "p",
    text: "`logic_expression` is a boolean tree used by the configure UI. If it contains `contradiction`, save is rejected. Rubric weights may be stored as fractions (0.34) or percentages (34); the evaluator always normalizes to fractions that sum to 1.",
  },

  { type: "h3", id: "json-application", text: "Scholarship form_data, references, offer_data" },
  {
    type: "code",
    label: "student_scholarship_applications.form_data (typical)",
    text: `{
  "full_name": "Ada Okonkwo",
  "student_id": "STU-10482",
  "email": "ada@university.edu",
  "major": "Computer Science",
  "program": "BSc Computer Science",
  "gpa": "3.71",
  "credits_completed": "96",
  "enrollment_status": "Active",
  "personal_statement_ack": true,
  "essay_merit": "…",
  "portfolio_url": "https://…",
  "talent_statement": "…",
  "supporting_documents": [
    {
      "name": "income-affidavit.pdf",
      "mime": "application/pdf",
      "size_mb": 0.8,
      "storage_key": "…",
      "integrity_ok": true,
      "scanned_at": "2026-08-13T12:00:00Z"
    }
  ]
}`,
  },
  {
    type: "p",
    text: "`references_data` is an array of `{ name, email, status }` where status is typically `pending` or `completed`. `eligibility_snapshot` is a frozen copy of rules and match results at triage time. `offer_data` holds letter metadata (amount, deadline, GL code). `risk_factors` on `student_risk_scores` is a free-form object of factor → weight/evidence.",
  },

  { type: "h3", id: "json-grant-lifecycle", text: "Grant lifecycle (form_data.lifecycle)" },
  {
    type: "p",
    text: "Grant applications store a nested lifecycle object (defaults shown). `lifecycle_stage` on the row is the current stage key.",
  },
  {
    type: "code",
    label: "Grant lifecycle envelope",
    text: `{
  "stage_key": "proposal_budget",
  "stage_index": 1,
  "proposal": {
    "abstract": "",
    "methodology": "",
    "dmp": "",
    "documents": [],
    "keywords": [],
    "pi_name": "",
    "pi_email": "",
    "pi_confirmed": false,
    "fit_statement": "",
    "application_submitted": false
  },
  "budget": {
    "lines": [],
    "equipment_total": 0,
    "tuition_remission": 0,
    "fa_rate_pct": 52.0,
    "total_direct": 0,
    "mtdc": 0,
    "indirect": 0,
    "total_requested": 0,
    "budget_unlocked": false,
    "validation_errors": []
  },
  "compliance": {
    "human_subjects": false,
    "animal_subjects": false,
    "recombinant_dna": false,
    "irb_protocol": "",
    "iacuc_protocol": "",
    "ibc_protocol": "",
    "coi_student_signed": false
  }
}`,
  },
  {
    type: "p",
    text: "Further keys exist for OSP routing (`pi` → `department_chair` → `dean` → `osp`), peer-review scores (merit 30%, impact 25%, feasibility 25%, budget 20%), post-award effort, procurement (vendor quotes above 1,000; equipment cap 5,000), and close-out milestone signatures.",
  },

  { type: "h2", id: "pipelines", text: "Operational pipelines" },
  { type: "h3", id: "pipe-scholarship", text: "Scholarship pipeline" },
  {
    type: "ol",
    items: [
      "Officer creates a programme (`draft`) → submits for review → publisher sets `published`.",
      "Student drafts and submits; documents stored by `storage_key`.",
      "High-pass evaluates `eligibility_rules`. Failures go to `rejection_automated`.",
      "Document verification, then `ready_for_committee`. Blind IDs: `APP-{cycle_year}-{8 hex}`.",
      "Reviewers score 1–5. Composite = weighted academic/need/lead. If score std. dev. ≥ `variance_threshold` (default 1.25), status becomes `disputed` until an officer reconciles.",
      "Stack-rank against `award_budget_pool`. Proposed → approved → offer (14 business days) → accept/decline → credited.",
    ],
  },
  { type: "h3", id: "pipe-grant", text: "Grant pipeline (staff)" },
  {
    type: "ol",
    items: [
      "Proposal & budgeting (including F&A at default 52% MTDC).",
      "Compliance & ethics gates (IRB / IACUC / IBC / COI).",
      "Internal OSP routing.",
      "Peer-review panel.",
      "Post-award effort tracking and procurement.",
      "Milestone sign-off and close-out.",
    ],
  },
  { type: "h3", id: "pipe-risk", text: "Early warning" },
  {
    type: "p",
    text: "Risk scores combine academic, attendance, and finance signals. Staff filter at-risk lists by those categories. Interventions can be linked to an alert, rated 1–5 for effectiveness, and scheduled for follow-up.",
  },
];
