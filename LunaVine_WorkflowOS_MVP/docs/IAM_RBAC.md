# Luna Vine WorkflowOS — IAM / RBAC v0.4.0

## Security model
Cloudflare Access answers **who is this person?** WorkflowOS RBAC answers **what may this authenticated person do?**

`OWNER_EMAIL` is bootstrapped as `SUPER_USER` on successful Cloudflare Access authentication.

## Roles
- `SUPER_USER` — platform owner/admin. Full application administration, but no audit deletion and no silent gate bypass.
- `OWNER_EXECUTIVE` — executive control, business approvals and final release authority.
- `BRAND_CREATIVE` — brand canon, designs, artwork and creative review.
- `LEGAL_RISK` — Legal/IP/claims/compliance review.
- `PRODUCTION_OPS` — POD/supplier/production/preflight operations.
- `QUALITY_ASSURANCE` — sample and production QA.
- `FINANCE_PRICING` — pricing/margin approval.
- `GROWTH_CRM` — marketing psychology, CRM and experiments.
- `MARKETPLACE_OPS` — listings and platform readiness.
- `ENGINEERING_ADMIN` — app/integration/security administration without business release authority.
- `AUDITOR_READONLY` — read-only control/evidence/audit access.

## Mandatory controls
1. Least privilege: assign the narrowest suitable role.
2. Every assignment records an accountable assigner and reason.
3. Entitlements may be time-bound and later scoped.
4. The last active Super User cannot be revoked, suspended or disabled.
5. There is no permission to delete audit events.
6. A Super User is not a governance bypass.
7. Final release, legal clearance and security decisions remain explicitly permissioned.
8. Segregation-of-duties rules are stored in `sod_rules` for progressive enforcement.

## Initial owner test
After v0.4.0 deploy/migrations, sign out and sign in through Cloudflare Access. Open `/admin/access`. The owner email should appear as `ACTIVE` with `SUPER_USER`.
