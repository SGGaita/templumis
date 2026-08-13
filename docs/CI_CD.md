# TemplumIS CI/CD

GitHub Actions builds the app on every pull request and deploys to the production server on push to `main` (or a manual **Run workflow**).

Production lives at `/opt/templumis`. The **server’s** `docker-compose.yml` and `.env` are never overwritten.

## Pipeline

Workflow file: [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)

| Job | When | What it does |
|---|---|---|
| **Check** | Pull requests and pushes to `main`/`master` | Compiles the FastAPI backend; `npm install` + `npm run build` for Next.js |
| **Deploy to server** | Push to `main`/`master`, or **Actions → CI/CD → Run workflow** | Snapshots the live release, rsyncs code, runs Alembic, rebuilds backend/frontend |

Deploy uses the GitHub **production** environment. Repository secrets work; you can also store the same names as environment secrets.

## One-time GitHub setup

### 1. Deploy SSH key (on the server)

```bash
ssh-keygen -t ed25519 -C "github-actions-templumis" -f /root/.ssh/templumis-deploy -N ""
chmod 700 /root/.ssh
cat /root/.ssh/templumis-deploy.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys /root/.ssh/templumis-deploy

ssh -i /root/.ssh/templumis-deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=no root@127.0.0.1 echo OK
```

That last command must print `OK` with **no password prompt**.

Do not keep the private key under `/opt/templumis`. Do not commit it. Do not paste it into chat.

### 2. GitHub secrets

**Settings → Secrets and variables → Actions → Secrets** (and/or **Environments → production**):

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Public IPv4 or DNS name (`curl -4 -s ifconfig.me` on the server). Not a LAN hostname like `mycraft`. |
| `DEPLOY_USER` | SSH user, usually `root` |
| `DEPLOY_SSH_KEY` | Full private key from `cat /root/.ssh/templumis-deploy`, including the `BEGIN`/`END` lines |

Optional:

| Secret | Default |
|---|---|
| `DEPLOY_PORT` | `22` |
| `DEPLOY_PATH` | `/opt/templumis` |

Allow inbound SSH from GitHub-hosted runners (or use a self-hosted runner) or the deploy job cannot connect.

## What a deploy does

1. **Snapshot** (`scripts/snapshot.sh`) to `/var/backups/templumis/last`:
   - tags (or commits) running backend/frontend as `:previous`
   - `pg_dump` of the database
   - tarball of `backend`, `frontend`, `nginx`, `scripts` (not `docker-compose.yml` or `.env`)
2. **Rsync** from the GitHub runner. Excluded paths are in `scripts/rsync-excludes.txt` — including `docker-compose.yml`, `.env`, and upload data.
3. **`scripts/deploy.sh`**:
   - builds backend and frontend images
   - waits for Postgres
   - `python manage.py migrate` (Alembic `upgrade head`; stamps an existing DB on first run)
   - starts backend/frontend without recreating nginx (so port 80 stays bound)
   - health-checks `http://127.0.0.1:8000/api/health` inside the backend container

If migrate or the health check fails, deploy restores the snapshot (database only if migrations had started), previous images, and previous code.

To change Compose settings, edit `/opt/templumis/docker-compose.yml` **on the server**. GitHub will not replace it.

## Alembic (schema changes)

First boot still uses `db/init/*.sql`. After that, schema changes go through Alembic.

```bash
# Create a revision from model changes
docker compose exec backend alembic revision --autogenerate -m "describe the change"

# Apply (also runs automatically on deploy)
docker compose exec backend python manage.py migrate
```

New files land in `backend/alembic/versions/`. Commit them. The next push to `main` applies `upgrade head` on the server.

Historical one-off scripts in `backend/migrations/` are not run by CI/CD.

## Manual deploy on the server

```bash
cd /opt/templumis
APP_DIR=/opt/templumis bash /opt/templumis/scripts/deploy.sh
```

That rebuilds from whatever is already on disk. It does not rsync from GitHub. To also `git pull` while keeping the server Compose file:

```bash
bash /opt/templumis/scripts/deploy.sh --pull
```

Prefer the GitHub workflow so Check runs first and a snapshot is taken.

## Troubleshooting

**Secrets missing** — Check failed to see `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY`. Add them as **Actions secrets**, not Variables. The deploy job uses the `production` environment.

**SSH asks for a password** — Public key in `authorized_keys` does not match the private key in `DEPLOY_SSH_KEY`. Recreate the key pair and update both the server and the secret.

**Port 80 already in use** — Nginx was recreated and something else bound `:80`. Current deploys reload nginx in place. Recover with:

```bash
ss -tlnp | grep ':80'
cd /opt/templumis && docker compose up -d nginx
```

**`unknown flag: --no-build`** — Older Compose on `docker compose run`. The script no longer passes that flag to `run`.

**Watch runs** — https://github.com/SGGaita/templumis/actions
