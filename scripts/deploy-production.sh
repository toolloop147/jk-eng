#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PM2_API="jk-eng-api"
PM2_WEB="jk-eng-web"

echo "==> Deploy jk-eng ($(pwd))"

git fetch origin main
git checkout main
git pull --ff-only origin main

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

for proc in "$PM2_API" "$PM2_WEB"; do
  if pm2 describe "$proc" >/dev/null 2>&1; then
    pm2 restart "$proc"
    echo "    restarted $proc"
  else
    echo "    skip $proc (not registered in pm2)"
  fi
done

echo "==> jk-eng deploy complete"
