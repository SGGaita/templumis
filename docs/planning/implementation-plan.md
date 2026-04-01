# TemplumIS: Comprehensive System Development Plan

## 1. Executive Summary & Project Mission

TemplumIS is an **Open Infrastructure** enrollment, grants, and scholarship dashboard designed for **Tier 2–3 universities and research hospitals**. It transforms siloed institutional data into a unified intelligence layer to drive rankings, student retention, and research ROI. By incorporating a student-facing layer and a modern containerized stack, TemplumIS ensures transparency, scalability, and ease of deployment.

### Deployment Model: Multitenant SaaS / On-Premise / Hybrid

TemplumIS supports three deployment modes:

- **Multitenant SaaS** — A single TemplumIS instance serves multiple institutions, each isolated by tenant (institution) ID. A Global Admin provisions and manages all tenants.
- **On-Premise** — A dedicated instance deployed within a university's own infrastructure. The Global Admin seeds the single institution and hands off to the Institution Admin.
- **Hybrid** — A mix where some institutions run on shared infrastructure and others on dedicated nodes, managed centrally by the Global Admin.

All modes share the same codebase. Tenant isolation is enforced at the database level (shared schema, `institution_id` foreign keys) and at the API/auth layer.

---

## 2. Functional Module Workflows & User Interactions

### 0. Platform Administration Layer

#### Global Admin (Platform-Level)

**Status:** Done

**Objective:** Bootstrap and manage the TemplumIS platform across all institutions.

**Account Creation:** Via CLI command only (`python manage.py create-global-admin`). No self-registration.

**Workflow:**

1. **Login** — Global Admin logs in at `/global-admin/login`.
2. **Institution Provisioning** — Creates new institutions with name, slug, and allowed email domain(s).
3. **Institution Admin Assignment** — Creates the first Institution Admin account for each institution.
4. **Platform Monitoring** — Views cross-institution metrics: total users, active tenants, system health.
5. **Configuration** — Manages platform-wide settings (default roles, feature flags, deployment mode).

**Dashboard (`/global-admin`):**

| Section | Function |
|---------|----------|
| **Institutions** | List, create, edit, activate/deactivate institutions |
| **Institution Admins** | Create and manage admin accounts per institution |
| **Platform Health** | System-wide metrics and service status |
| **Settings** | Global feature flags and deployment config |

---

#### Institution Admin (Tenant-Level)

**Status:** Done

**Objective:** Configure and manage a single institution's TemplumIS environment.

**Account Creation:** Created by the Global Admin. Can then create additional institution-level accounts.

**Workflow:**

1. **Login** — Institution Admin logs in at `/institution/login` (or the institution's custom subdomain).
2. **Domain Configuration** — Sets the allowed email domain(s) (e.g., `@university.edu`) that gate user sign-ups and logins for this institution.
3. **Account Management** — Creates and manages role-based accounts (Registrar, Scholarship Office, Student Services, Research Office, Vice Chancellor).
4. **Module Configuration** — Enables/disables modules and sets institution-specific parameters.
5. **Data Oversight** — Reviews audit logs and manages institution-level data exports.

**Dashboard (`/institution/admin`):**

| Section | Function |
|---------|----------|
| **Domain Settings** | Configure allowed email domains for auth |
| **Users & Roles** | Create, edit, deactivate accounts; assign roles |
| **Modules** | Enable/disable Enrollment, Scholarships, Grants, Support |
| **Audit Log** | Track user actions and data changes |
| **Institution Profile** | Name, logo, contact info, academic calendar |

---

### A. Enrollment & Student Success Module

**Status:** In progress - Initial testing with mock APIs

**Objective:** Monitor and optimize the student journey from admission to graduation.

**Workflow:**

1. **Data Harvest** — Raw data is pulled from the SIS (Student Information System).
2. **Program Mapping** — Students are mapped to specific programs, cohorts, and demographic tags.
3. **TTD Calculation** — The system calculates Time-to-Degree and identifies "bottleneck" courses or milestones (e.g., proposal submission).
4. **Institutional Heatmaps** — Trends are aggregated into institutional heatmaps for reporting.

**User Interactions:**

| Role | Interaction |
|------|-------------|
| **Registrar Office** | Monitors enrollment spikes/dips and updates student statuses (e.g., "Active" → "On Leave"). |
| **Vice Chancellor** | Reviews high-level graduation trends to report to the university board or ranking agencies. |
| **Academic Advisers** | Use the "Early Warning" dashboard to identify specific students falling behind the cohort average. |

---

### B. Scholarship & Financial Aid Module ("The Finance Bridge")

**Status:** Not started

**Objective:** Ensure financial sustainability for students and audit-ready records for donors.

**Workflow:**

1. **Fund Creation** — Finance dept inputs external/internal fund sources and eligibility rules.
2. **Application** — Students apply via the portal; documents are routed to the Scholarship Office.
3. **Awarding & Ledger Sync** — After approval, the system triggers a "Finance Bridge" to sync with the student's tuition ledger.
4. **Compliance Loop** — The system checks GPA/Credit loads at the end of each semester to auto-renew or flag aid for review.

**User Interactions:**

| Role | Interaction |
|------|-------------|
| **Scholarship Office** | Manages the pipeline of applicants and sets compliance thresholds. |
| **Finance Dept** | Tracks the disbursement of external funds (NGO/Government) against university operational costs. |
| **Donors/Partners** | (Via generated reports) View the impact of their funds on student success metrics. |

---

### C. Student Support & Interaction Module

**Status:** Not started

**Objective:** Empower students with self-service tools and proactive support.

**Workflow:**

1. **Authentication** — Students log in and see a personalized view of their academic and financial data.
2. **Milestone Progress Tracking** — Students see a progress bar for their degree milestones (e.g., "75% of Coursework Complete").
3. **Support Trigger** — If a student's compliance status turns "Red," the system provides a one-click button to "Request Academic Advising."
4. **Resolution** — Support staff resolve tickets within the dashboard, closing the feedback loop. Automated "Nudges" are sent for compliance risks.

**User Interactions:**

| Role | Interaction |
|------|-------------|
| **Student** | Uploads scholarship documents, tracks their own "Time-to-Graduation," and receives "Nudge" notifications. |
| **Student Services** | Manages incoming "Service Requests" and tracks response times to student queries. |

---

### D. Grants & Research Management Module

**Status:** Not started

**Objective:** Track research investment vs. academic and commercial output.

**Workflow:**

1. **Grant Intake** — PIs (Principal Investigators) or Research Offices log new grant opportunities and submissions.
2. **Financial Tracking** — Real-time monitoring of grant "burn rate" (expenditure on personnel vs. equipment).
3. **Output Mapping** — The system automatically scrapes publication databases (ORCID/Crossref) to link new papers to specific grant IDs.
4. **Ethics/IRB Alerts** — Automated 60-day warnings for IRB or ethical clearance renewals.

**User Interactions:**

| Role | Interaction |
|------|-------------|
| **Research Office / PIs** | Track specific grant portfolios, manage expenditure, and ensure compliance with funding agency rules. |
| **University Admin** | Evaluates the "Success Rate" of different departments to allocate internal seed funding. |

---

## 3. Technical Architecture & Stack

### Frontend: Next.js + Material UI (MUI)

- **Framework:** Next.js (App Router) for high-performance rendering and SEO.
- **Styling:** Material UI (MUI) for an enterprise-grade academic aesthetic, utilizing components like `DataGrid` for complex tables and `Steppers` for milestone tracking.

### Backend: Python

- **Engine:** Python-based API (FastAPI or Django) to handle heavy data processing, ETL logic, and research metric scraping.
- **Auth:** JWT-based Role-Based Access Control (RBAC).

### Database: PostgreSQL

- **Storage:** Relational database optimized for complex academic hierarchies and financial audit trails.
- **Schema:** Star-Schema Model with "Student," "Grant," and "Scholarship" as central fact tables.

### Infrastructure: Docker & Nginx

- **Containerization:** Full Dockerization of services for seamless deployment in university IT environments.
- **Web Server:** Nginx serving as a Reverse Proxy for SSL termination, load balancing, and static asset serving.

### Data Ingestion Pipeline (Open Infrastructure)

| Source | Method |
|--------|--------|
| **SIS / LMS** | SQL-based extraction (PostgreSQL, MySQL) |
| **Finance / ERP** | Integration with SAP, Oracle, or manual CSV uploads |
| **Research APIs** | Live hooks into Crossref, PubMed, and ORCID |

### ETL/ELT Layer

- **Standardization:** Mapping diverse "Scholarship Type" codes into a unified schema.
- **Deduplication:** Ensuring students with multiple funding sources are tracked correctly.
- **Intervention Logic:** Scripting the "Early Warning" triggers that move data from the Warehouse to the Student Support Module.

### Data Warehousing & Security

- **Star-Schema Model:** "Student," "Grant," and "Scholarship" as central fact tables.
- **Student Privacy:** Implementation of FERPA/GDPR compliant data masking for student-facing views.

---

## 4. User Role & Security Matrix

### Platform-Level Roles

| Role | Scope | Access Level | Primary Utility |
|------|-------|-------------|------------------|
| **Global Admin** | All Institutions | Full Platform Write/Read | Provision institutions, create Institution Admins, platform config. Created via CLI only. |
| **Institution Admin** | Single Institution | Full Institution Write/Read | Domain config, user management, module settings, audit logs. Created by Global Admin. |

### Institution-Level Roles

| Role | Access Level | Primary Utility |
|------|-------------|------------------|
| **Vice Chancellor** | Global Read-Only | Institutional rankings & strategic planning. |
| **Registrar** | Enrollment Write/Read | Managing student cycles & graduation rates. |
| **Scholarship Office** | Award Write/Read | Managing eligibility, renewals, and donor reporting. |
| **Student** | Personal Read/Write | Tracking milestones, applying for aid, and requesting support. |
| **Student Services** | Support Write/Read | Managing help-desk tickets and intervention workflows. |
| **Research Office** | Grant-Specific Access | Tracking PI balances, milestones, and output. |

### Authentication Flow

1. **Global Admin** — Logs in at `/global-admin/login` with email + password. No domain restriction.
2. **Institution Admin** — Logs in at `/institution/login`. Email must match the institution's configured domain.
3. **All other roles** — Sign up / log in at their institution's portal. Email domain is validated against the institution's allowed domains.
4. **Domain Enforcement** — When an Institution Admin sets domain `@university.edu`, only users with that email domain can register or log in under that institution.

---

## 5. Development Roadmap (Phased Approach)

### Phase 1: Foundation, Multi-Tenancy & Admin Layer (Months 1–3)

- Setup of Docker Compose environment (Postgres, Python, Next.js, Nginx).
- Multi-tenant database schema: `institutions` table, tenant-scoped foreign keys.
- CLI tool to create Global Admin account.
- Global Admin dashboard: institution CRUD, Institution Admin provisioning.
- Institution Admin dashboard: domain configuration, user/role management.
- JWT auth with role-based routing and domain validation.
- **Milestone:** Global Admin can provision an institution, set its domain, and the Institution Admin can log in and manage users.

### Phase 2: Finance & Student Interaction (Months 4–6)

- Build MUI-based dashboards for Scholarship and Enrollment modules.
- Scholarship Application Tracker: Digitalization of the award pipeline.
- Student Portal MVP: Launch of the personal milestone tracker and scholarship compliance view.
- Implementation of the "Finance Bridge" for ledger synchronization.

### Phase 3: Research & Support Scale (Months 7–9)

- Integration with Research APIs (Crossref/ORCID).
- Implementation of "Early Warning" Python logic for at-risk student notifications.
- Grant Success ROI: Analytics on department-level funding performance.
- Advanced MUI visualizations (Interactive Heatmaps and Grant Burn-rate charts).

### Phase 4: Optimization & Security (Months 10–12)

- Nginx production hardening (Rate limiting, SSL, Security headers).
- Ranking Readiness: One-click reports for THE/QS ranking submissions.
- Mobile Optimization: Ensuring the Student Portal is mobile-responsive.
- Final audit, mobile responsiveness check, and staff training.

---

## 6. Strategic Outcomes & KPIs

| KPI | Target |
|-----|--------|
| **Ranking Improvement** | Standardized, real-time data exports for global ranking bodies (THE/QS). |
| **Student Retention** | 15% increase via proactive automated intervention ("Early Warning" system). |
| **Operational Efficiency** | 40% reduction in manual administrative reporting and "Status Inquiry" emails. |
| **Financial Sustainability** | Higher grant and scholarship utilization through transparent tracking. |
| **Student Equity** | Verification that support services reach high-need demographics. |
