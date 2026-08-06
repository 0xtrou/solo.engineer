#!/usr/bin/env bash

set -euo pipefail

app_path="/opt/solo-engineer/app"
shared_path="/opt/solo-engineer/shared"

cd "$app_path"
git fetch origin main
git reset --hard origin/main
ln -sfn "$shared_path/.env.local" .env.local
npm ci
npm run build
pm2 startOrReload ecosystem.config.cjs --only solo-engineer --update-env
pm2 save --force
curl --fail --silent --show-error http://127.0.0.1:3002/api/health
