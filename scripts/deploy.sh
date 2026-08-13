#!/usr/bin/env bash
# Rebuild TemplumIS on the server using the docker-compose.yml that already
# lives here. Never replace that file (or .env) from git.
# On failure, restore the snapshot from scripts/snapshot.sh (images, DB, code).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/templumis}"
SNAPSHOT_DIR="${SNAPSHOT_DIR:-/var/backups/templumis/last}"
PROJECT="$(basename "$APP_DIR")"
cd "$APP_DIR"

if [[ ! -f docker-compose.yml ]]; then
  echo "ERROR: ${APP_DIR}/docker-compose.yml is missing. Refusing to deploy."
  exit 1
fi

preserve_compose() {
  local backup
  backup="$(mktemp)"
  cp -a docker-compose.yml "$backup"
  echo "$backup"
}

restore_compose() {
  local backup="$1"
  cp -a "$backup" docker-compose.yml
  rm -f "$backup"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git update-index --skip-worktree docker-compose.yml 2>/dev/null || true
  fi
  echo "Restored server docker-compose.yml"
}

if [[ "${1:-}" == "--pull" ]]; then
  if [[ ! -d .git ]]; then
    echo "ERROR: ${APP_DIR} is not a git checkout. Use GitHub Actions rsync deploy, or clone the repo here."
    exit 1
  fi
  backup="$(preserve_compose)"
  trap 'restore_compose "$backup"' EXIT
  git fetch origin
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" == "HEAD" ]]; then
    branch="main"
  fi
  git reset --hard "origin/${branch}"
  restore_compose "$backup"
  trap - EXIT
fi

show_port_80() {
  echo "What is bound to port 80:"
  ss -tlnp 2>/dev/null | grep -E ':80\s' || true
  docker ps --filter publish=80 --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' || true
}

nginx_running() {
  local id
  id="$(docker compose ps -q nginx 2>/dev/null || true)"
  [[ -n "$id" ]] && [[ "$(docker inspect -f '{{.State.Running}}' "$id" 2>/dev/null || true)" == "true" ]]
}

wait_for_health() {
  local i
  for i in $(seq 1 30); do
    if docker compose exec -T backend python -c \
      "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=2)" \
      >/dev/null 2>&1; then
      echo "Health check OK"
      return 0
    fi
    sleep 2
  done
  echo "ERROR: backend /api/health did not become ready"
  return 1
}

rolled_back=0
rollback() {
  trap - ERR
  if [[ "$rolled_back" -eq 1 ]]; then
    return
  fi
  rolled_back=1
  echo "DEPLOY FAILED — rolling back to the pre-deploy snapshot..."

  docker compose stop backend frontend >/dev/null 2>&1 || true

  if [[ -f "$SNAPSHOT_DIR/db.sql" ]]; then
    echo "Restoring database dump..."
    docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
      < "$SNAPSHOT_DIR/db.sql" || echo "WARNING: database restore failed"
  fi

  if [[ -f "$SNAPSHOT_DIR/code.tar.gz" ]]; then
    tar -C "$APP_DIR" -xzf "$SNAPSHOT_DIR/code.tar.gz"
    echo "Restored previous code"
  fi

  if docker image inspect "${PROJECT}-backend:previous" >/dev/null 2>&1; then
    docker tag "${PROJECT}-backend:previous" "${PROJECT}-backend:latest"
  fi
  if docker image inspect "${PROJECT}-frontend:previous" >/dev/null 2>&1; then
    docker tag "${PROJECT}-frontend:previous" "${PROJECT}-frontend:latest"
  fi
  docker compose up -d --no-deps --no-build backend frontend || true

  echo "Rollback finished. Previous release should be running."
}

trap 'rollback; exit 1' ERR

echo "Building backend and frontend images..."
docker compose build backend frontend
docker compose up -d db
echo "Waiting for database..."
for i in $(seq 1 30); do
  if docker compose exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "ERROR: database did not become ready"
    exit 1
  fi
  sleep 2
done

echo "Running Alembic migrations..."
docker compose run --no-deps --rm --no-build backend python manage.py migrate

echo "Starting backend and frontend (nginx is left running so port 80 stays bound)..."
if docker compose up --help 2>/dev/null | grep -q -- '--wait'; then
  docker compose up -d --no-deps --no-build --wait --wait-timeout 180 backend frontend
else
  docker compose up -d --no-deps --no-build backend frontend
fi

wait_for_health
trap - ERR

if nginx_running; then
  if docker compose exec -T nginx nginx -s reload >/dev/null 2>&1; then
    echo "Reloaded nginx"
  else
    echo "WARNING: nginx reload failed; container is still running"
  fi
else
  echo "nginx is not running; starting it..."
  if ! docker compose up -d nginx; then
    echo "ERROR: nginx could not start. Port 80 is probably already in use."
    show_port_80
    echo "If a host nginx/apache/caddy should own port 80, leave it and map templumis-nginx to another port in the SERVER docker-compose.yml."
    echo "If templumis-nginx should own port 80, stop the other process, then: docker compose up -d nginx"
    exit 1
  fi
fi

echo
docker compose ps
echo
docker image prune -f >/dev/null 2>&1 || true
echo "Deploy finished."
