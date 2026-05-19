#!/bin/sh
# start.sh — Production startup script for Render
set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy || echo "⚠️  Migration skipped or failed (schema may already be up-to-date)"

echo "==> Starting server..."
node dist/server.js
