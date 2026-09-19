#!/bin/sh
set -e

PORT_VALUE="${PORT:-3002}"
echo "Starting LaviESamuel API"
echo "PORT=${PORT_VALUE}"
echo "DATABASE_URL host check: $(echo "$DATABASE_URL" | sed -E 's#://([^:/@]+):[^@]+@#://\1:***@#')"

echo "Running prisma migrate deploy..."
if ! npx prisma migrate deploy; then
  echo "ERROR: prisma migrate deploy failed."
  echo "Use the INTERNAL Postgres URL on the same Dokploy network."
  exit 1
fi

echo "Starting HTTP server on 0.0.0.0:${PORT_VALUE}..."
exec node dist/index.js
