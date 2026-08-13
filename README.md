# TemplumIS

**Open Infrastructure Institutional Intelligence Dashboard** for Tier 2–3 universities and research hospitals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Material UI (MUI) |
| Backend | Python 3.12 + FastAPI |
| Database | PostgreSQL 16 |
| Migrations | Alembic |
| Infrastructure | Docker Compose + Nginx reverse proxy |
| CI/CD | GitHub Actions → SSH deploy to `/opt/templumis` |

## Project Structure

```
templumIS/
├── frontend/          # Next.js + MUI frontend
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   └── theme/     # MUI theme configuration
│   ├── Dockerfile
│   └── package.json
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py    # API entry point
│   │   └── config.py  # Settings & env config
│   ├── alembic/       # Alembic env and versions
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── db/
│   └── init/          # PostgreSQL init scripts (auto-run on first start)
├── nginx/
│   └── nginx.conf     # Reverse proxy config
├── scripts/           # Server snapshot + deploy (used by GitHub Actions)
├── docs/
│   ├── CI_CD.md
│   ├── USER_GUIDE.md
│   ├── TECHNICAL.md
│   ├── API.md
│   └── planning/      # Implementation plan & documentation
├── .github/workflows/
│   └── ci-cd.yml
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- (Optional) Node.js 20+ and Python 3.12+ for local development without Docker

### 1. Clone & Configure

```bash
cp .env.example .env
# Edit .env with your preferred database credentials and secrets
```

### 2. Start All Services (Docker)

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on host port `5434` (container `5432`; schema auto-initialized on first start)
- **FastAPI backend** on host port `8001` (container `8000`; API docs at `http://localhost:8001/docs`)
- **Next.js frontend** on port `3000`
- **Nginx** on port `80` (reverse proxy routing `/api/` → backend, `/` → frontend)

### 3. Local Development (Without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Verify

- Frontend: [http://localhost:3000](http://localhost:3000)
- Product documentation: [http://localhost:3000/documentation](http://localhost:3000/documentation)
- API Health: [http://localhost:8001/api/health](http://localhost:8001/api/health) (or [http://localhost/api/health](http://localhost/api/health) via Nginx)
- API Docs (Swagger): [http://localhost:8001/docs](http://localhost:8001/docs) (or [http://localhost/docs](http://localhost/docs) via Nginx)
- Via Nginx: [http://localhost](http://localhost)

### 5. Deploying to a Server

Production is a Docker Compose stack on the Linux host (default `/opt/templumis`). Day-to-day releases go through GitHub Actions.

- **CI/CD (GitHub Actions, secrets, rollback, Alembic):** [docs/CI_CD.md](./docs/CI_CD.md)
- **First-time server setup (Docker, `.env`, HTTPS, backups):** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Day-to-day Docker commands:** [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)

The server’s `docker-compose.yml` and `.env` stay on the host. A push to `main` snapshots the live release, syncs code, runs migrations, and rebuilds backend/frontend. If migrate or health-check fails, the snapshot is restored.

## Modules

1. **Enrollment & Student Success** — TTD analytics, cohort tracking, early-warning dashboards
2. **Scholarship & Financial Aid** — Application pipeline, compliance loops, Finance Bridge
3. **Student Support** — Milestone tracking, nudge notifications, support ticketing
4. **Grants & Research** — Burn-rate monitoring, publication mapping, IRB alerts

## Documentation

Product documentation is in the web app at **[/documentation](http://localhost:3000/documentation)** (also linked from the site footer):

- [User guide](./docs/USER_GUIDE.md) — portals, scholarships, grants, staff, reviewers, admins
- [Technical documentation](./docs/TECHNICAL.md) — architecture, metadata schema, JSON contracts
- [API documentation](./docs/API.md) — REST endpoints and authentication

Interactive OpenAPI (Swagger): [http://localhost:8001/docs](http://localhost:8001/docs) (or [http://localhost/docs](http://localhost/docs) via Nginx).

Index: [docs/README.md](./docs/README.md)

## License

Proprietary — All rights reserved.
