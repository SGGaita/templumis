# TemplumIS: Deployment Log

> Living document — updated as the project progresses.

---

## Current Status

| Service | Status | Notes |
|---------|--------|-------|
| **PostgreSQL 16** | Running | Star-schema initialized via `db/init/01-schema.sql` |
| **FastAPI Backend** | Running | v0.2.0 — Auth, Global Admin, Institution Admin APIs |
| **Next.js Frontend** | Running | MUI theme, landing page, Global Admin & Institution Admin dashboards |
| **Nginx** | Running | Reverse proxy on port 80 (`/api/` → backend, `/` → frontend) |

---

## Infrastructure Overview

```
┌────────────────────────────────────────────────┐
│                   Nginx (:80)                  │
│          Reverse Proxy + Security Headers       │
├────────────────┬───────────────────────────────┤
│   /api/*       │   /*                          │
│   ↓            │   ↓                           │
│ FastAPI (:8000)│ Next.js (:3000)               │
│ Python 3.12    │ Node 20 + MUI                 │
├────────────────┴───────────────────────────────┤
│              PostgreSQL (:5432)                 │
│         templumis_db — Star Schema             │
└────────────────────────────────────────────────┘
```

---

## Services & Ports

| Service | Container Name | Internal Port | External Port |
|---------|---------------|---------------|---------------|
| PostgreSQL | `templumis-db` | 5432 | 5432 |
| FastAPI | `templumis-backend` | 8000 | 8000 |
| Next.js | `templumis-frontend` | 3000 | 3000 |
| Nginx | `templumis-nginx` | 80 | 80 |

---

## Docker Compose Configuration

- **File:** `docker-compose.yml`
- **Volume:** `pgdata` — persistent PostgreSQL storage
- **DB Init:** `db/init/01-schema.sql` auto-runs on first container start
- **Backend** depends on DB healthcheck (`pg_isready -U templumis -d templumis_db`)
- **Nginx** depends on both frontend and backend

---

## Environment Variables

Defined in `.env` (copied from `.env.example`):

| Variable | Default | Used By |
|----------|---------|---------|
| `POSTGRES_USER` | `templumis` | db, backend |
| `POSTGRES_PASSWORD` | `changeme_secure_password` | db, backend |
| `POSTGRES_DB` | `templumis_db` | db, backend |
| `POSTGRES_HOST` | `db` | backend |
| `POSTGRES_PORT` | `5432` | backend |
| `BACKEND_SECRET_KEY` | `changeme_jwt_secret_key` | backend |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000,http://localhost` | backend |
| `BACKEND_DEBUG` | `true` | backend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | frontend |

---

## Database Schema (v2 — Multi-Tenant)

Tables deployed via `db/init/01-schema.sql`. All tenant-scoped tables include `institution_id` FK.

| Table | Module | Purpose |
|-------|--------|----------|
| `institutions` | Platform | Tenant registry (name, slug, active status) |
| `institution_domains` | Platform | Allowed email domains per institution |
| `users` | Core | Auth & RBAC (8 roles incl. `global_admin`, `institution_admin`) |
| `programs` | Enrollment | Degree programs & departments |
| `cohorts` | Enrollment | Student intake groups |
| `students` | Enrollment | Enrollment, GPA, compliance tracking |
| `funding_sources` | Finance | Internal/external fund sources |
| `scholarships` | Finance | Award definitions & eligibility |
| `scholarship_applications` | Finance | Student applications & status |
| `grants` | Research | Grant budgets, burn rate, IRB dates |
| `grant_publications` | Research | Linked publications (DOI/ORCID) |
| `support_tickets` | Support | Student help-desk tickets |
| `audit_log` | Platform | Tracks all admin actions (JSONB details) |

---

## Deployment Commands

### Start all services
```bash
docker compose up --build
```

### Start fresh (wipe DB)
```bash
docker compose down -v
docker compose up --build
```

### Create Global Admin (CLI — must run after DB is up)
```bash
docker compose exec backend python manage.py create-global-admin --email admin@templumis.com --name "Global Admin" --password YourSecurePassword
```

### View logs for a single service
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Access the running database
```bash
docker compose exec db psql -U templumis -d templumis_db
```

---

## Verification Endpoints

| Endpoint | Expected Response |
|----------|-------------------|
| `http://localhost` | Next.js landing page (via Nginx) |
| `http://localhost:3000` | Next.js direct |
| `http://localhost:8000/api/health` | `{"status": "healthy", "version": "0.2.0"}` |
| `http://localhost:8000/docs` | FastAPI Swagger UI |
| `http://localhost:3000/global-admin/login` | Global Admin login page |
| `http://localhost:3000/global-admin` | Global Admin dashboard (requires auth) |
| `http://localhost:3000/institution/login` | Institution Admin login page |
| `http://localhost:3000/institution/admin` | Institution Admin dashboard (requires auth) |

---

## API Routes (v0.2.0)

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login with email + password, returns JWT |
| GET | `/api/auth/me` | Get current user profile |

### Global Admin (requires `global_admin` role)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/global-admin/institutions` | List all institutions |
| POST | `/api/global-admin/institutions` | Create institution |
| GET | `/api/global-admin/institutions/:id` | Get institution details |
| PATCH | `/api/global-admin/institutions/:id` | Update institution |
| POST | `/api/global-admin/institutions/:id/domains` | Add email domain |
| DELETE | `/api/global-admin/institutions/:id/domains/:did` | Remove domain |
| POST | `/api/global-admin/institutions/:id/admins` | Create Institution Admin |
| GET | `/api/global-admin/stats` | Platform-wide statistics |

### Institution Admin (requires `institution_admin` role)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/institution/profile` | Get institution profile |
| PATCH | `/api/institution/profile` | Update institution profile |
| GET | `/api/institution/domains` | List email domains |
| POST | `/api/institution/domains` | Add email domain |
| DELETE | `/api/institution/domains/:id` | Remove domain |
| GET | `/api/institution/users` | List institution users |
| POST | `/api/institution/users` | Create user (domain-validated) |
| PATCH | `/api/institution/users/:id/activate` | Activate user |
| PATCH | `/api/institution/users/:id/deactivate` | Deactivate user |
| GET | `/api/institution/stats` | Institution statistics |

---

## Change Log

| Date | Change | Details |
|------|--------|---------|
| 2026-03-24 | Initial setup | Docker Compose with 4 services, star-schema DB, MUI frontend, FastAPI backend |
| 2026-03-24 | Fix: `version` removed | Removed obsolete `version: "3.9"` from docker-compose.yml |
| 2026-03-24 | Fix: pgdata volume | Added missing `volumes:` declaration |
| 2026-03-24 | Fix: healthcheck DB | Added `-d` flag to `pg_isready` to target correct database |
| 2026-03-25 | Multi-tenant schema v2 | Added `institutions`, `institution_domains`, `audit_log` tables; `institution_id` FKs on all tenant tables; `global_admin` and `institution_admin` roles |
| 2026-03-25 | Backend auth system | JWT login, role-based guards, domain validation, password hashing (bcrypt) |
| 2026-03-25 | Global Admin API + dashboard | Full CRUD for institutions, domain management, Institution Admin provisioning |
| 2026-03-25 | Institution Admin API + dashboard | Domain config, user management (create/activate/deactivate), institution profile |
| 2026-03-25 | CLI: `manage.py` | `create-global-admin` command for bootstrapping the platform |
