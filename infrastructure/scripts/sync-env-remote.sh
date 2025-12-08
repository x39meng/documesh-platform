#!/bin/bash
# Usage: ./infrastructure/scripts/sync-env-remote.sh [dev|staging]

ENV=${1:-dev} # Default to 'dev'
APP_NAME="documesh"
PATH_PREFIX="/$APP_NAME/$ENV"

echo "---------------------------------------------------"
echo "🔄 Syncing .env.$ENV from AWS SSM (Placeholder)..."
echo "⚠️  SSM Sync is currently disabled."
echo "👉 In the future, this will fetch secrets from /$APP_NAME/$ENV"
echo "---------------------------------------------------"

# Example of what it would do:
# SECRETS=$(aws ssm get-parameters-by-path ...)
# echo "$SECRETS" > apps/web/.env.$ENV
# echo "$SECRETS" > apps/api/.env.$ENV
# echo "$SECRETS" > apps/worker/.env.$ENV

echo "✅ Done (Placeholder)."
