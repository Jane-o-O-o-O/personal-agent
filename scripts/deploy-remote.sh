#!/usr/bin/env bash
set -euo pipefail

cd /opt/personal-agent
tar -xzf deployment.tar.gz
if [[ ! -f .env ]]; then
  install -m 600 deployment.env .env
fi
install -d -m 700 -o 1000 -g 1000 state/app state/browser state/workspaces

cd deploy
docker compose --env-file ../.env -f compose.yaml up -d --build
curl --fail --silent --show-error --retry 12 --retry-delay 2 --retry-connrefused --retry-all-errors http://127.0.0.1:3420/api/health
install -m 644 nginx.conf /etc/nginx/conf.d/personal-agent.conf
nginx -t
systemctl reload nginx
