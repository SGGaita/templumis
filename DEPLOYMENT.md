# TemplumIS — Linux Server Deployment Guide

This guide covers deploying TemplumIS to a Linux server using Docker. It assumes the server itself is already provisioned (OS installed, you have SSH/root access, Docker Engine + the Compose plugin are installed). If Docker isn't installed yet, see [Appendix: Installing Docker](#appendix-installing-docker) at the bottom.

## Architecture

TemplumIS runs as four containers, defined in `docker-compose.yml`:

| Service | Image/Build | Purpose | Port (host) |
|---|---|---|---|
| `nginx` | nginx:alpine | Reverse proxy — routes `/api/`, `/docs`, `/openapi.json` to backend, everything else to frontend | 80 |
| `frontend` | build: `./frontend` | Next.js 14 app | 3000 |
| `backend` | build: `./backend` | FastAPI app | 8001 → container 8000 |
| `db` | postgres:16-alpine | PostgreSQL, schema auto-loaded from `db/init/*.sql` on first start | 5434 → container 5432 |

Only port 80 (and optionally 443) needs to be reachable from the internet — nginx is the single entry point. The 3000/8001/5434 host bindings exist for local debugging and should be firewalled off (or removed) on a public server.

## Prerequisites

- Docker Engine 24+ and the Docker Compose plugin (`docker compose version` works)
- Git
- Ports 80/443 open in the server firewall (cloud security group + `ufw`/`firewalld` if enabled)
- A non-root user in the `docker` group (recommended over deploying as root)

## 1. Get the code onto the server

```bash
git clone <your-repo-url> templumIS
cd templumIS
```

If you're updating an existing deployment instead, skip to [Updating a Deployment](#8-updating-a-deployment).

## 2. Configure environment variables

```bash
cp .env.example .env
nano .env   # or vi/your editor of choice
```

At minimum, change these for a production server (the defaults in `.env.example` are for local development only):

| Variable | Change to |
|---|---|
| `POSTGRES_PASSWORD` | A strong, unique password |
| `BACKEND_SECRET_KEY` | A long random string (e.g. `openssl rand -hex 32`) — used to sign JWTs |
| `BACKEND_DEBUG` | `false` |
| `APP_BASE_URL` | `https://your-domain.com` (used in emails/links) |
| `BACKEND_CORS_ORIGINS` | `https://your-domain.com` (add `http://` variant only if you're not using HTTPS) |
| `NEXT_PUBLIC_API_URL` | `/api` (keep as-is if nginx is the entry point — it proxies `/api/` to the backend) |
| `SMTP_USER` / `SMTP_PASSWORD` / `FROM_EMAIL` | Your real outbound mail credentials |

Do not commit `.env` — it's already covered by `.gitignore`.

## 3. Build and start the containers

```bash
docker compose up --build -d
```

This builds the frontend and backend images, pulls `postgres:16-alpine` and `nginx:alpine`, and starts all four containers in the background. First build takes a few minutes (npm install + Next.js build).

Check everything is healthy:

```bash
docker compose ps
```

You want `db` and `frontend` showing `healthy`, and `backend`/`nginx` showing `running`/`Up`.

## 4. Initialize data and create the first admin user

The database schema (`db/init/01-schema.sql` through `05-grants-financial-aid.sql`) is applied automatically the first time the `db` container starts with an empty volume. You only need to manually create the first Global Admin account:

```bash
docker compose exec backend python manage.py create-global-admin \
  --email admin@your-domain.com \
  --name "Global Admin" \
  --password "<choose-a-strong-password>"
```

Change this password after first login. See `docs/DATA_SEEDING.md` if you also need to seed reference/demo data.

## 5. Verify the deployment

From the server (or your machine, once DNS/firewall is set):

```bash
curl http://localhost/api/health          # -> {"status":"healthy",...}
curl -I http://localhost/                 # -> 200 from Next.js via nginx
```

Then in a browser: `http://your-server-ip-or-domain/` should load the app, and `/docs` should load the FastAPI Swagger UI.

## 6. Enable HTTPS (recommended)

The shipped `nginx.conf` only listens on port 80. For a public-facing deployment, put TLS in front of it — the simplest path is Certbot on the host:

```bash
sudo apt install certbot python3-certbot-nginx   # if you also run a host-level nginx, use that
```

Since nginx runs *inside* a container here, the more common pattern is:

1. Run a lightweight host-level nginx (or Caddy, which auto-provisions Let's Encrypt certs) that terminates TLS on 443 and reverse-proxies to `127.0.0.1:80` (the containerized nginx), **or**
2. Mount certs into the `nginx` container and extend `nginx/nginx.conf` with a `listen 443 ssl;` server block, obtaining certs on the host via `certbot certonly --standalone` (stop the container temporarily to free port 80 during issuance) and mounting `/etc/letsencrypt` as a volume.

Option 1 is simpler to maintain long-term (Caddy in particular handles renewal automatically with almost no config). Whichever you choose, update `BACKEND_CORS_ORIGINS` and `APP_BASE_URL` in `.env` to the `https://` URL and restart the backend.

## 7. Keep it running across reboots

All services use `restart: unless-stopped`, so containers come back up automatically after a crash or server reboot — as long as the Docker daemon itself starts on boot:

```bash
sudo systemctl enable docker
```

## 8. Updating a Deployment

```bash
cd templumIS
git pull
docker compose up --build -d
```

This rebuilds only the images whose source changed and recreates those containers; `db` keeps its volume (`pgdata`) untouched. There's a brief moment of downtime while `frontend`/`backend` restart — for a low-traffic internal tool this is usually acceptable. If a change touches `db/init/*.sql`, note that those scripts only run against a **fresh, empty** database volume; existing databases need a manual migration (see `backend/migrations/` and `alembic` in `requirements.txt`) or, for non-production data, `docker compose down -v` to wipe and reinitialize.

## 9. Backups

```bash
# Backup
docker compose exec db pg_dump -U templumis -d templumis > backup-$(date +%F).sql

# Restore
docker compose exec -T db psql -U templumis -d templumis < backup-2026-07-30.sql
```

Automate with a daily cron job that writes to a directory outside the repo (and ideally off-server, e.g. synced to object storage):

```cron
0 2 * * * cd /path/to/templumIS && docker compose exec -T db pg_dump -U templumis -d templumis > /var/backups/templumis/$(date +\%F).sql
```

## 10. Troubleshooting

For day-to-day commands (logs, shell access, restarts, resets), see `DOCKER_COMMANDS.md` in the repo root. Common first checks:

```bash
docker compose logs -f            # tail all services
docker compose logs backend       # check backend startup errors (bad DB creds, etc.)
docker compose ps                 # confirm health status
```

If the app loads but API calls fail with CORS errors on your real domain, double-check `BACKEND_CORS_ORIGINS` in `.env` matches the exact origin the browser sends (scheme + host, no trailing slash), and restart the backend (`docker compose restart backend`) after changing it.

## Security checklist before going live

- [ ] `.env` values changed from the `.env.example` defaults (DB password, JWT secret, SMTP creds)
- [ ] `BACKEND_DEBUG=false`
- [ ] HTTPS enabled, `APP_BASE_URL`/`BACKEND_CORS_ORIGINS` set to the `https://` domain
- [ ] Ports 3000/8001/5434 not exposed to the public internet (firewall or remove host port bindings)
- [ ] First Global Admin password changed after initial login
- [ ] Backups scheduled and tested (restore, not just export)

---

## Appendix: Installing Docker

If the server doesn't have Docker yet (Ubuntu/Debian example):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker compose version   # confirm the Compose plugin is present
```

Log out/in (or run `newgrp docker`) for the group change to take effect without needing `sudo` for every Docker command.
