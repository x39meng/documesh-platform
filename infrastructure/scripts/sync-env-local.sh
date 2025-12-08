#!/bin/bash
# Usage: ./infrastructure/scripts/sync-env-local.sh

echo "🔄 Syncing Root .env to Apps..."

if [ ! -f .env ]; then
    echo "❌ Root .env not found! Please create one from .env.example"
    exit 1
fi

cp .env apps/web/.env
cp .env apps/api/.env
cp .env apps/worker/.env

echo "✅ Copied .env to:"
echo "   - apps/web/.env"
echo "   - apps/api/.env"
echo "   - apps/worker/.env"


