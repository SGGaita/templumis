#!/usr/bin/env bash
# Snapshot the running release so deploy.sh can roll back on failure.
# Safe to pipe over SSH: APP_DIR=/opt/templumis bash -s < scripts/snapshot.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/templumis}"
SNAPSHOT_DIR="${SNAPSHOT_DIR:-/var/backups/templumis/last}"
PROJECT="$(basename "$APP_DIR")"

cd "$APP_DIR"
mkdir -p "$SNAPSHOT_DIR"

echo "Snapshotting running images..."
: > "$SNAPSHOT_DIR/images.txt"
for service in backend frontend; do
  dest="${PROJECT}-${service}:previous"
  cid="$(docker compose ps -q "$service" 2>/dev/null || true)"
  if [[ -z "$cid" ]]; then
    echo "No running ${service} container; skip image snapshot"
    continue
  fi

  if docker image inspect "${PROJECT}-${service}:latest" >/dev/null 2>&1; then
    docker tag "${PROJECT}-${service}:latest" "$dest"
  elif docker commit "$cid" "$dest" >/dev/null; then
    echo "Committed running ${service} container (original image was missing)"
  else
    echo "WARNING: could not snapshot ${service}; rollback may skip it"
    continue
  fi
  echo "${service} ${dest}" >> "$SNAPSHOT_DIR/images.txt"
  echo "Tagged ${dest}"
done

echo "Dumping database..."
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' \
  > "$SNAPSHOT_DIR/db.sql"

echo "Archiving code (compose file and .env are left alone)..."
tar -C "$APP_DIR" -czf "$SNAPSHOT_DIR/code.tar.gz" \
  --exclude='backend/data/uploads' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/.next' \
  --exclude='__pycache__' \
  backend frontend nginx scripts

echo "Snapshot written to ${SNAPSHOT_DIR}"
