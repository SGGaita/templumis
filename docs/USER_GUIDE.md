# TemplumIS user guide

How to sign in, work in each portal, and complete scholarship and grant workflows. In the product UI this lives at `/documentation/user-guide`.

## Getting started

### Create an account

1. Open **Sign up** from the home page.
2. Choose **Student** or **Admin staff**.
3. Students enter their official **student registration number**. TemplumIS looks up the SIS record and fills name and institutional email when a match exists.
4. Use an email on a domain registered to your institution (for example `@university.edu`). Unregistered domains are rejected.
5. Complete account details and submit. If email verification is required, enter the code sent to your inbox.

**Who can self-register.** Students and staff sign up through the public form, gated by institution email domains. Institution admins are created by a global admin. Global admins are created from the server CLI (`python manage.py create-global-admin`), not from the website. Reviewers join via an invite link.

### Sign in

| Portal | Path |
|--------|------|
| Students, staff, reviewers, sponsors | `/login` |
| Institution admin | `/institution/login` |
| Global admin | `/global-admin/login` |

After a successful login you are sent to the portal that matches your account. Inactive accounts cannot sign in.

## Student portal

The student sidebar changes with cohort level. Undergraduates see scholarships; postgraduates see grants and research support.

### Undergraduate navigation

| Area | Pages | What you can do |
|------|-------|-----------------|
| Overview | Dashboard | See journey progress, alerts, and eligible awards. |
| Academics | Courses, grades, attendance | Review enrolled courses, results, and attendance. |
| Finance & awards | Financials, my scholarships, available scholarships | Check balances, track applications, and apply. |
| Support | Student services | Open library, advising, writing centre, and other support links. |

### Postgraduate navigation

| Area | Pages | What you can do |
|------|-------|-----------------|
| Overview | Dashboard | Research-oriented snapshot of progress and funding. |
| Academics | Courses, grades, attendance | Same academic records as undergraduates. |
| Grant information | Financials, my grants, funding opportunities | Apply to university, PI, or external grants and track lifecycle. |
| Research & support | Student services | Advisor, supervisor, writing centre, and library resources. |

Profile (`/student/profile`) shows registration number, programme, and contact details used to auto-fill applications.

## Scholarships

Undergraduate students browse published opportunities, save drafts, upload documents, request references, and respond to offers.

### Apply

1. Open **Available Scholarships**. Only **open** programmes you have not already applied to are highlighted as eligible.
2. Confirm auto-filled profile fields (name, student ID, email, programme, GPA, credits).
3. Complete type-specific fields: merit essay, need-based supporting documents, or talent portfolio and statement.
4. If references are required, invite recommenders and choose a FERPA waiver option before submit.
5. Upload PDF, PNG, or JPEG files (typically ≤ 10 MB; media up to 50 MB).
6. Submit. Status moves from **draft** into administrative review.

### After you submit

| Stage | What you see | What staff do |
|-------|--------------|---------------|
| Submit | Application received | High-pass eligibility check against programme rules. |
| Admin review (triage) | Under triage | Document verification; automated rejection if ineligible. |
| Committee | Committee phase | Blind scoring on academic, need, and leadership (1–5). |
| Decision | Awaiting decision | Stack-ranking against budget; proposed award amounts. |
| Offer | Offer received — action required | Offer letter issued; 14 business-day response window. |
| Tuition credit | Applied to tuition | Finance credits the award after you accept. |

When an offer is sent, open **My Scholarships** and accept or decline. Declining may release the slot to a runner-up. Expired offers cannot be accepted.

## Grants

Grant opportunities are catalogue programmes with `program_kind = grant`. The student workflow depends on category.

| Category | Student steps | Notes |
|----------|---------------|-------|
| University grant | Apply → compliance → award decision → active grant | Ethics and awards committee handled by the grants office. |
| PI grant | Project brief → apply (or accept PI invite) → compliance → offer → active work | Supervisor endorsement is required before compliance review. |
| External database (db) | Follow the external portal | TemplumIS stores a pointer; application happens outside the system. |

On PI grants you review the scope of work, acknowledge the brief, upload proposal documents, and either self-apply or accept an invitation. After award you track milestones, reporting, and close-out from the grant lifecycle page.

## Staff portal

Staff with roles such as registrar, student services, research office, or vice chancellor land on `/staff`. Scholarship officers land on the financial-aid dashboard instead.

### Student success

- **At-risk students** — filter by finances, attendance, or academic flags and open a student record.
- **Student support** — review tickets, resources, and postgraduate support context.
- **Enrollment** — browse all students, or filter undergraduates / postgraduates. Import SIS extracts where enabled.

### Financial aid officers

1. **Configure** a scholarship or grant (eligibility, valuation, slots, deadline).
2. Submit for review; a **director-level** role (registrar, institution admin, vice chancellor) **publishes** it (maker-checker).
3. **Triage** submitted applications: run the high-pass, verify documents, assign reviewers.
4. Committee reviewers score in the reviewer portal. Officers resolve **disputed** scores when reviewer variance is high.
5. **Review outcome and awards** — apply recommended awards, send offers, and credit tuition after acceptance.

### Grants, rankings, and analytics

- Grant applications can be reviewed, routed (PI → chair → dean → OSP), peer-reviewed, and moved through post-award and procurement steps.
- **University rankings** tracks indicators per ranking system and can stream live updates.
- **Analytics** provides executive enrollment, retention, and aid summaries for the institution.

## Reviewers, advisors, and sponsors

**Scholarship reviewers** are invited by the scholarship office. They set a password from the invite link, then work in `/reviewer`. Applications may be anonymized (`APP-YYYY-XXXXXXXX`) when blind review is enabled. Score **academic**, **need**, and **leadership** as whole numbers from 1 to 5. Composite score uses institution (or programme) weights that default to 0.34 / 0.33 / 0.33.

**Sponsors and advisors** (account category `sponsor` or `advisor`) open **Sponsorship requests**. Open a request, review the project brief, and respond. Past requests remain under **Past requests**.

## Administrators

### Institution admin

- Login at `/institution/login`.
- Maintain institution **profile** (name, contact, address).
- Register **email domains** that gate signup and login.
- Create users and assign roles: registrar, scholarship office, student services, research office, vice chancellor, and related staff.
- Activate or deactivate users; review the institution **activity log**.

### Global admin

- Provision institutions (name, slug, contact).
- Attach domains and create the first institution admin for each tenant.
- Activate, deactivate, or delete institutions.
- Inspect cross-tenant stats, activity, and platform settings (name, support email, registration, email verification, maintenance mode).
