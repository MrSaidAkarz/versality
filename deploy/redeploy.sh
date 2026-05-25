#!/usr/bin/env bash
# ── Versality — redeploy after a git push ────────────────────────────────────
# Run this on the server whenever you push new code.
# Usage: cd /opt/versality && bash deploy/redeploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/versality"
cd "${APP_DIR}"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Rebuilding TS libs"
for lib in lib/db lib/api-zod lib/api-client-react lib/object-storage-web; do
  (cd "${lib}" && npx tsc -b --clean && npx tsc -b)
done

echo "==> Rebuilding API"
(cd artifacts/api-server && node build.mjs)

echo "==> Rebuilding frontend"
(cd artifacts/openvizy && \
  BASE_PATH="/" PORT=3000 NODE_ENV=production npx vite build)

echo "==> Restarting API"
pm2 reload versality-api --update-env

echo "==> Done. No downtime on static files."
