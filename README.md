# TemplumIS

**Open Infrastructure Institutional Intelligence Dashboard** for Tier 2–3 universities and research hospitals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Material UI (MUI) |
| Backend | Python 3.12 + FastAPI |
| Database | PostgreSQL 16 |
| Infrastructure | Docker Compose + Nginx reverse proxy |

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
│   ├── Dockerfile
│   └── requirements.txt
├── db/
│   └── init/          # PostgreSQL init scripts (auto-run on first start)
├── nginx/
│   └── nginx.conf     # Reverse proxy config
├── docs/
│   └── planning/      # Implementation plan & documentation
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
- **PostgreSQL** on port `5432` (with schema auto-initialized)
- **FastAPI backend** on port `8000` (API docs at `http://localhost:8000/docs`)
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
- API Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Via Nginx: [http://localhost](http://localhost)

### 5. Deploying to a Server

For deploying TemplumIS to a Linux server with Docker, see [DEPLOYMENT.md](./DEPLOYMENT.md). For day-to-day Docker commands (logs, restarts, backups, resets), see [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md).

## Modules

1. **Enrollment & Student Success** — TTD analytics, cohort tracking, early-warning dashboards
2. **Scholarship & Financial Aid** — Application pipeline, compliance loops, Finance Bridge
3. **Student Support** — Milestone tracking, nudge notifications, support ticketing
4. **Grants & Research** — Burn-rate monitoring, publication mapping, IRB alerts

## License

Proprietary — All rights reserved.
