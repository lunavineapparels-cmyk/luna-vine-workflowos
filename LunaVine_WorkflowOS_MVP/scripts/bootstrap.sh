#!/usr/bin/env bash
set -euo pipefail

echo "1) Authenticate Wrangler"
npx wrangler login

echo "2) Create D1 database"
npx wrangler d1 create lunavine-workflowos-dev

echo "Copy the returned database_id into wrangler.jsonc before continuing."

echo "3) Create R2 evidence bucket"
npx wrangler r2 bucket create lunavine-workflowos-evidence-dev

echo "4) Apply migrations after updating wrangler.jsonc"
echo "npx wrangler d1 migrations apply lunavine-workflowos-dev --remote"

echo "5) Update OWNER_EMAIL in wrangler.jsonc and enable Cloudflare Access for the Worker."
echo "6) Deploy with: npm run deploy"
