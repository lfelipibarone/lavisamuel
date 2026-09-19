#!/bin/sh
set -e

PORT_VALUE="${PORT:-3002}"
echo "========================================"
echo "LaviESamuel API boot"
echo "PORT=${PORT_VALUE}"
echo "NODE_ENV=${NODE_ENV:-}"
if [ -n "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL=$(echo "$DATABASE_URL" | sed -E 's#://([^:/@]+):[^@]+@#://\1:***@#')"
else
  echo "WARNING: DATABASE_URL is empty"
fi
echo "========================================"

echo "Running prisma migrate deploy (20s timeout)..."
set +e
if command -v timeout >/dev/null 2>&1; then
  timeout 20 npx prisma migrate deploy
else
  npx prisma migrate deploy
fi
MIGRATE_STATUS=$?
set -e

if [ "$MIGRATE_STATUS" -ne 0 ]; then
  echo "WARNING: prisma migrate deploy exited with ${MIGRATE_STATUS}"
  echo "API will still start so /health can answer (fix DATABASE_URL / network)."
fi

echo "Starting HTTP server on 0.0.0.0:${PORT_VALUE}..."
exec node dist/index.js
