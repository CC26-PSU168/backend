#!/bin/sh
# start.sh — Production startup for Render
# NOTE: Run migrations separately via 'npx prisma migrate deploy' in Render's pre-deploy command
# or run once manually. Do NOT block server startup with migrations.
echo "==> Starting Budgetly Backend..."
node dist/server.js
