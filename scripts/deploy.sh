#!/usr/bin/env bash
# Rebuild TemplumIS on the server using the docker-compose.yml that already
# lives here. Never replace that file (or .env) from git.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/templumis}"
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

echo "Building and restarting containers with the server docker-compose.yml..."
if docker compose up --help 2>/dev/null | grep -q -- '--wait'; then
  docker compose up --build -d --wait --wait-timeout 180
else
  docker compose up --build -d
fi

if docker compose exec -T nginx nginx -s reload >/dev/null 2>&1; then
  echo "Reloaded nginx"
fi

echo
docker compose ps
echo
if curl -fsS http://127.0.0.1/api/health >/dev/null 2>&1; then
  echo "Health check OK: http://127.0.0.1/api/health"
else
  echo "WARNING: http://127.0.0.1/api/health did not respond yet. Check: docker compose logs --tail 80"
fi

docker image prune -f >/dev/null 2>&1 || true
echo "Deploy finished."
