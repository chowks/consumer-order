#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose up -d --wait
pnpm run prisma:migrate
pnpm run db:seed