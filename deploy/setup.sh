#!/usr/bin/env bash
# ── Versality — one-shot server setup ────────────────────────────────────────
# Run once on a fresh Ubuntu 22.04 / 24.04 VPS as root (or with sudo).
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/versality/main/deploy/setup.sh | bash
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/versality"
DB_NAME="versality"
DB_USER="versality"

echo "==> [1/8] System packages"
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib

echo "==> [2/8] Node.js 20 + pnpm"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs
npm install -g pnpm pm2

echo "==> [3/8] Postgres — create DB + user"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo "==> [4/8] Clone / update repo"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull --ff-only
else
  git clone https://github.com/YOUR_ORG/versality.git "${APP_DIR}"
fi

echo "==> [5/8] Copy .env (skip if already present)"
[ -f "${APP_DIR}/.env" ] || cp "${APP_DIR}/deploy/.env.example" "${APP_DIR}/.env"
echo "     --> Edit ${APP_DIR}/.env before continuing if this is a first run."

echo "==> [6/8] Build"
cd "${APP_DIR}"
pnpm install --frozen-lockfile

# Build TS composite libs
for lib in lib/db lib/api-zod lib/api-client-react lib/object-storage-web; do
  (cd "${lib}" && npx tsc -b --clean && npx tsc -b)
done

# Build API bundle
(cd artifacts/api-server && node build.mjs)

# Build React frontend
(cd artifacts/openvizy && \
  BASE_PATH="/" PORT=3000 NODE_ENV=production npx vite build)

echo "==> [7/8] Nginx"
cp "${APP_DIR}/deploy/nginx.conf" /etc/nginx/sites-available/versality
ln -sf /etc/nginx/sites-available/versality /etc/nginx/sites-enabled/versality
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> [8/8] PM2"
cd "${APP_DIR}"
# Load .env into environment
set -a; source .env; set +a
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo "======================================================"
echo " Versality is live on http://$(curl -s ifconfig.me)"
echo " API: http://$(curl -s ifconfig.me)/api/health"
echo ""
echo " To add a domain later, see: deploy/nginx.conf"
echo "======================================================"
