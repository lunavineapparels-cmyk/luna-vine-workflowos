# v0.5.0 Professional UI Deployment Checklist

This is an in-place upgrade from the validated v0.4.0 production deployment.

## Changed files

- `package.json` — version 0.5.0
- `src/ui/styles.ts` — professional enterprise visual system
- `src/ui/layout.ts` — grouped navigation, app bar, masked session identity
- `src/ui/pages.ts` — executive Control Tower + Finance Control Center
- `src/index.ts` — `/finance` route
- `migrations/0007_v051_finance_help.sql` — Finance Control Center help article
- `docs/V050_PROFESSIONAL_UI.md`
- `docs/CHANGELOG.md`

## Controlled deployment

1. Confirm the current production deployment is healthy.
2. Replace the contents of the repository's existing `LunaVine_WorkflowOS_MVP` root with this package, preserving the current production resource identifiers in `wrangler.jsonc` if they differ.
3. Commit to `main` with message: `Upgrade WorkflowOS v0.5 professional V5.1 command center`.
4. Existing Cloudflare build runs tests.
5. Existing deploy command applies managed D1 migrations remotely and runs `wrangler deploy`.
6. Confirm the deployment is Ready.
7. Validate through Cloudflare Access:
   - `/` shows the new executive Control Tower.
   - `/finance` shows Finance Control Center with SETUP PHASE and no fabricated balances.
   - `/help` includes the Finance Control Center article.
   - `/admin/access` still shows owner ACTIVE + SUPER_USER.
   - `/api/health` remains healthy.
8. Create one controlled workflow case and confirm the Release Gate behavior is unchanged.

## Rollback

If the production UI or route behavior is incorrect, roll back to the previous known-good Cloudflare deployment / GitHub commit. Do not alter D1 evidence or audit history to perform a UI rollback.

## Security invariants

- No autonomous money movement.
- No Release Gate bypass.
- No audit-history deletion.
- No new external credentials stored in source or D1 business tables.
- Finance integrations remain explicitly unconnected until owner-approved setup.
