# Luna Vine WorkflowOS v0.3.0 — Production Deployment Checklist

## Cloudflare resources already created
- Worker: `lunavine-workflowos-prod`
- D1 binding: `DB` -> `lunavine-workflowos-prod`
- R2 binding: `EVIDENCE` -> `lunavine-workflowos-prod-assets`
- Runtime vars are maintained in the Cloudflare dashboard. `keep_vars: true` prevents Wrangler deploys from deleting them.
- Cloudflare Access protects all Worker traffic.

## GitHub/Cloudflare Build settings
- Repository: `luna-vine-workflowos`
- Production branch: `main`
- Root directory: repository root
- Build command: leave blank
- Deploy command: `npx wrangler deploy`

## First production deployment
1. Commit this repository to `main`.
2. Connect the existing Cloudflare Worker to the repository.
3. Confirm the Worker name in `wrangler.jsonc` is `lunavine-workflowos-prod`.
4. Let the first build deploy.
5. Apply migrations separately with:
   `npx wrangler d1 migrations apply lunavine-workflowos-prod --remote`
6. Test `/api/health` only after authenticating through Cloudflare Access.

## Release safety
Do not attach the final custom hostname or treat the app as production-ready until migrations and smoke tests pass.
