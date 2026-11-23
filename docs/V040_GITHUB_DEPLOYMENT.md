# v0.4.0 GitHub Deployment Checklist

1. Back up / confirm the current `main` branch is healthy in Cloudflare.
2. Upload/replace the v0.4.0 files at the repository root. Preserve the existing Cloudflare production `wrangler.jsonc` identifiers/bindings included in this package.
3. Confirm these new files exist:
   - `migrations/0005_identity_rbac.sql`
   - `migrations/0006_help_center.sql`
   - `src/services/accessAdmin.ts`
   - `src/ui/adminPages.ts`
   - `src/ui/helpPages.ts`
   - `docs/IAM_RBAC.md`
   - `docs/HELP_TRAINING_CENTER.md`
4. Commit to `main` with message: `Add WorkflowOS v0.4 IAM RBAC and Help Center`.
5. Cloudflare build should run the configured tests, then the existing deploy command should apply D1 migrations remotely before `wrangler deploy`.
6. Confirm the deployment is `Ready`.
7. Sign out and back in through Cloudflare Access so `OWNER_EMAIL` bootstraps to `SUPER_USER`.
8. Verify `/admin/access` shows the owner as ACTIVE + SUPER_USER.
9. Verify `/help` shows seven initial help articles.
10. Verify `/api/health` shows the owner roles including `SUPER_USER`.
11. Do not add additional users until the owner Super User validation passes.

Expected migration counts after v0.4.0:
- roles: 11
- permissions: 39
- segregation-of-duties rules: 5
- help articles: 7

Security invariants:
- No permission exists to delete audit history.
- Last active Super User cannot be revoked/suspended/disabled by application controls.
- Super User does not silently bypass Release Gates.
