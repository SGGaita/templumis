# TemplumIS API documentation

REST API for TemplumIS **0.2.0**. All application JSON is served under `/api`. In the product UI this lives at `/documentation/api`. Interactive OpenAPI (Swagger) is at `/docs` and `/openapi.json` on the API host.

## Conventions

- **Base path:** `/api` (via Nginx or the Next.js rewrite to the FastAPI service).
- **Format:** JSON request and response bodies. `204 No Content` on some deletes.
- **Auth:** `Authorization: Bearer <access_token>` except login, signup, email validation, reviewer invite accept, and health.
- **Errors:** FastAPI `{ "detail": "…" }`. 401 unauthenticated, 403 forbidden, 404 missing, 422 validation.
- **Tenancy:** Institution-scoped queries use the token's `institution_id`. Global admin routes are platform-wide.

| Service | Response |
|---------|----------|
| `GET /api/health` | `{ "status": "healthy", "service": "templumis-api", "version": "0.2.0" }` |
| `GET /api` | Welcome payload listing modules: enrollment, scholarships, student-support, grants. |

## Authentication

Login returns a JWT (`sub` = user id, `role`, `exp`). Store it as `templumis_token` (the web client) and send it on subsequent calls. Tokens last **24 hours**.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "••••••••"
}
```

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Issue JWT. |
| GET | `/api/auth/me` | Bearer | Current user, including `institution_name` and resolved `account_category`. |
| POST | `/api/auth/signup` | Public | Create user on a registered email domain. |
| POST | `/api/auth/verify-email` | Public | Confirm signup code. Body: `{ email, verification_code }`. |
| POST | `/api/auth/resend-verification` | Public | Resend verification email. |
| POST | `/api/auth/accept-reviewer-invite` | Public | Set password from invite token; returns JWT. |
| GET | `/api/auth/validate-email/{email}` | Public | Check whether the email domain belongs to an institution. |
| GET | `/api/auth/validate-student-id/{student_id}` | Public | Lookup SIS student for signup auto-fill. |

### UserOut

```json
{
  "id": 1,
  "email": "ada@university.edu",
  "full_name": "Ada Okonkwo",
  "role": "student",
  "institution_id": 3,
  "institution_name": "Example University",
  "account_category": "student",
  "student_registration_number": "STU-10482",
  "email_verified": true,
  "is_active": true,
  "created_at": "2026-01-15T08:00:00"
}
```

## Endpoints by module

Paths below are relative to the prefix shown in each heading.

### Global admin — `/api/global-admin`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/institutions` | List tenants. |
| POST | `/institutions` | Create tenant (name, slug, contact_email, address). |
| GET | `/institutions/{id}` | Get tenant. |
| PATCH | `/institutions/{id}` | Update tenant. |
| POST | `/institutions/{id}/deactivate` | Soft-disable tenant. |
| POST | `/institutions/{id}/activate` | Re-enable tenant. |
| DELETE | `/institutions/{id}` | Delete tenant (204). |
| POST | `/institutions/{id}/domains` | Add email domain. |
| DELETE | `/institutions/{id}/domains/{domain_id}` | Remove domain (204). |
| POST | `/institutions/{id}/admins` | Create institution admin. |
| GET | `/institutions/{id}/users` | List users in tenant. |
| GET | `/institutions/{id}/activities` | Tenant activity. |
| GET | `/activity-log` | Platform activity log. |
| GET | `/stats` | Cross-tenant counts. |
| GET | `/settings` | Platform settings. |
| PUT | `/settings` | Update platform settings. |

### Institution admin — `/api/institution`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile` | Own institution. |
| PATCH | `/profile` | Update profile. |
| GET | `/domains` | List domains. |
| POST | `/domains` | Add domain. |
| PATCH | `/domains/{id}` | Update domain / primary flag. |
| DELETE | `/domains/{id}` | Remove domain (204). |
| GET | `/users` | List institution users. |
| POST | `/users` | Create user. |
| PATCH | `/users/{id}` | Update name/role. |
| PATCH | `/users/{id}/deactivate` | Deactivate. |
| PATCH | `/users/{id}/activate` | Activate. |
| DELETE | `/users/{id}` | Delete (204). |
| GET | `/stats` | Institution stats. |
| GET | `/activity-log` | Institution audit log. |

### Students CRUD — `/api/students`

Staff category required. Results are scoped to the caller's institution. Query params on list: `skip`, `limit`, `search`, `status`, `compliance_status`, `program_id`, `cohort_id`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Paginated list. |
| POST | `/` | Create student. |
| GET | `/{student_id}` | Get one. |
| PUT | `/{student_id}` | Update. |
| DELETE | `/{student_id}` | Delete (204). |
| GET | `/stats/overview` | Enrollment overview counts. |

### SIS / LMS — `/api/sis-lms`

Operational student, course, scholarship-application, and analytics APIs used by the portals.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/students` | SIS student list. |
| GET | `/students/{student_id}` | SIS student detail. |
| GET | `/my-profile` | Authenticated student's profile + statistics. |
| GET | `/courses` | Course catalogue / enrollments context. |
| GET | `/enrollments` | Enrollment rows. |
| GET | `/stats` | SIS summary stats. |
| GET | `/analytics/executive` | Executive analytics. |
| GET | `/at-risk` | At-risk student list. |
| GET | `/at-risk/summary` | At-risk counts by category. |
| GET | `/scholarships` | Published scholarship catalogue for students. |
| GET | `/scholarships/my-applications` | Caller's applications. |
| GET | `/scholarships/applications/{schol_id}/detail` | Application detail. |
| GET | `/scholarships/applications/{schol_id}/offer` | Offer letter payload. |
| POST | `/scholarships/applications/{schol_id}/offer/accept` | Accept offer. |
| POST | `/scholarships/applications/{schol_id}/offer/decline` | Decline offer. |
| GET | `/scholarships/applications/workspace` | Draft/submit workspace bundle. |
| GET | `/scholarships/applications/draft/{schol_id}` | Load draft. |
| PATCH | `/scholarships/applications/draft/{schol_id}` | Save draft `form_data`. |
| POST | `/scholarships/applications/draft/{schol_id}/documents` | Upload document (multipart). |
| DELETE | `/scholarships/applications/draft/{schol_id}/documents/{storage_key}` | Remove upload. |
| GET | `/scholarships/applications/draft/{schol_id}/documents/{storage_key}` | Download upload. |
| POST | `/scholarships/applications/{schol_id}/references` | Invite / update references. |
| GET | `/scholarships/recommendation` | Public recommender payload (token). |
| POST | `/scholarships/recommendation` | Recommender submits letter. |
| POST | `/scholarships/applications/{schol_id}/submit` | Submit application. |
| POST | `/scholarships/apply` | Create application row. |

### Scholarship programmes — `/api/sis-lms/scholarships`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/programs` | List catalogue (filter by kind). |
| GET | `/programs/{program_id}` | Get one programme. |
| POST | `/programs` | Create (officer). Validates `logic_expression`. |
| PUT | `/programs/{program_id}` | Update. |
| POST | `/programs/{program_id}/submit-review` | Send to publisher. |
| POST | `/programs/{program_id}/publish` | Publisher go-live. |
| POST | `/programs/{program_id}/simulate` | Count eligible students against rules. |
| GET | `/applications/staff` | Staff application queue. |
| DELETE | `/applications/{application_id}` | Delete application. |

### Triage — `/api/sis-lms/financial-aid/triage`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Triage / blind-review config. |
| PATCH | `/settings` | Update config. |
| GET | `/queues` | Applications grouped by `triage_queue`. |
| POST | `/run-high-pass` | Run eligibility high-pass on the queue. |
| POST | `/applications/{id}/run-high-pass` | High-pass one application. |
| GET | `/assignment-preview` | Suggested reviewer assignment. |
| POST | `/assign-reviewers` | Assign reviewers in bulk. |
| POST | `/applications/{id}/assign-reviewers` | Assign reviewers to one application. |
| PATCH | `/applications/{id}/verify-documents` | Mark documents verified. |
| GET | `/applications/{id}/documents/{storage_key}` | Staff document download. |
| GET | `/applications/{id}` | Full application (staff). |
| GET | `/applications/{id}/blind` | Anonymized payload for reviewers. |
| GET | `/committee/queue` | Committee work queue. |

### Evaluation — `/api/sis-lms/financial-aid/evaluation`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Rubric weights and variance threshold. |
| PATCH | `/settings` | Update weights / threshold / budget pool. |
| GET | `/reviewer-dashboard` | Reviewer home metrics. |
| GET | `/my-assignments` | Assignments for the current reviewer. |
| GET | `/applications/{id}` | Application for scoring. |
| POST | `/assignments/{id}/scores` | Submit academic, need, lead (1–5). |
| GET | `/disputes` | High-variance applications. |
| POST | `/applications/{id}/resolve` | Officer marks reconciled. |
| PATCH | `/applications/{id}/proposed-award` | Set proposed award amount. |
| POST | `/apply-recommended-awards` | Accept stack-rank recommendations. |
| GET | `/stack-ranking` | Ranked list vs budget. |

### Awards — `/api/sis-lms/financial-aid/awards`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/approve-and-send-offers` | Approve ranked awards and issue offer letters. |
| GET | `/applications/{id}/offer-letter` | Render / fetch offer letter. |

Financial-aid dashboard: **GET** `/api/sis-lms/financial-aid/dashboard`.

### Grants — `/api/sis-lms/grants`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/programs` | Grant catalogue. |
| GET | `/applications/staff` | Staff grant queue. |
| GET | `/applications/my` | Caller's grant applications. |
| GET | `/applications/student/{grant_id}` | Student view of one grant application. |
| PATCH | `/applications/{grant_id}/draft` | Save draft / lifecycle fields. |
| DELETE | `/applications/{application_id}/draft` | Discard draft. |
| POST | `/applications/{grant_id}/documents` | Upload grant document (multipart). |
| DELETE | `/applications/{grant_id}/documents/{storage_key}` | Delete document. |
| GET | `/applications/{grant_id}/documents/{storage_key}` | Download document. |
| POST | `/applications/{grant_id}/acknowledge-brief` | PI grant: acknowledge scope of work. |
| POST | `/applications/{grant_id}/accept-invite` | Accept PI invitation. |
| POST | `/applications/{grant_id}/apply` | Start application. |
| POST | `/applications/{grant_id}/submit` | Submit for compliance. |
| GET | `/sponsorship-requests/dashboard` | Sponsor dashboard. |
| GET | `/sponsorship-requests` | List sponsorship requests. |
| GET | `/sponsorship-requests/{id}` | Request detail. |
| POST | `/sponsorship-requests/{id}/respond` | Sponsor decision. |
| POST | `/applications/{id}/pi-confirm` | PI confirms student. |
| PATCH | `/applications/{id}/compliance-review` | Compliance review fields. |
| POST | `/applications/{id}/offer/issue` | Issue grant offer. |
| POST | `/applications/{id}/offer/accept` | Student accepts grant offer. |
| PATCH | `/applications/{id}/onboarding` | Onboarding fields. |
| PATCH | `/applications/{id}/compliance` | Compliance flags. |
| POST | `/applications/{id}/compliance/submit` | Submit compliance package. |
| POST | `/applications/{id}/routing/{role}` | Advance OSP routing (`pi`, `department_chair`, `dean`, `osp`). |
| POST | `/applications/{id}/peer-review` | Record peer-review scores. |
| POST | `/applications/{id}/post-award` | Post-award updates. |
| POST | `/applications/{id}/procurement` | Procurement / vendor quote. |
| POST | `/applications/{id}/effort-report` | Effort certification. |
| POST | `/applications/{id}/milestones/{milestone_id}/sign` | Sign close-out milestone. |
| PATCH | `/applications/{id}/review` | Staff review notes / status. |

### Student journey — `/api/student-journey`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/my-journey` | Authenticated student's journey bundle. |
| GET | `/my-journey-excel` | Journey derived from SIS Excel (year/sem). |
| GET | `/milestones` | Milestone list. |
| GET | `/progress/{student_id}` | Staff view of a student's progress. |
| POST | `/milestones/{id}/complete` | Mark milestone complete. |
| GET | `/library-resources` | Library resources for the tenant. |
| GET | `/all-journeys` | Staff: all journeys. |

### Student support — `/api/student-support`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/resources` | Support resource links (filtered by programme level). |
| GET | `/library-resources` | Library catalogue. |
| GET | `/my-advisor` | Assigned advisor. |
| POST | `/request-advisor-meeting` | Request a meeting. |
| GET | `/scholarships/opportunities` | Support-module scholarship opportunities. |
| GET | `/grants/opportunities` | Support-module grant opportunities (PG). |

### Rankings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rankings/systems` | Ranking systems. |
| GET | `/api/rankings/indicators/{system_id}` | Indicators for a system. |
| GET | `/api/rankings/institution/{institution_id}` | All systems for an institution. |
| GET | `/api/rankings/institution/{id}/system/{system_id}` | One system breakdown. |
| PATCH | `/api/rankings/institution/{id}/indicator/{indicator_id}` | Update current/target/satisfies. |
| GET | `/api/rankings-excel/dashboard-data` | Excel-backed rankings dashboard. |
| GET | `/api/ranking-metrics/institutional-overview/{institution_id}` | Aggregated metrics. |
| WS | `/ws/rankings` | WebSocket for live ranking dashboard updates. |

## Calling the API

The Next.js app calls relative `/api/…` via `apiFetch` in `frontend/src/lib/api.js`. In local dev, Next rewrites `/api/*` to the FastAPI process. In Docker, Nginx proxies `/api/` to the backend container. Multipart uploads set `Authorization` but omit JSON `Content-Type` so the browser can attach the boundary.

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@university.edu","password":"your-password"}'

curl http://localhost/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```
