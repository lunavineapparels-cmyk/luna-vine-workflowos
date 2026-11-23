# Luna Vine WorkflowOS MVP

Private cloud-first execution platform for Luna Vine BrandOS V5.0.

## Why this exists

BrandOS defines the business rules. WorkflowOS turns them into enforceable software workflows.

## First release capabilities

- Owner-only Cloudflare Access pattern
- D1 operational data
- R2 Evidence Vault
- Product release cases
- Mandatory gate registry
- Derived Release Gate
- Append-only audit events
- Durable Product Release workflow hook
- Quiet-luxury internal Control Tower

## Quick start

1. `npm install`
2. `npx wrangler login`
3. `npx wrangler d1 create lunavine-workflowos-dev`
4. Put the database ID into `wrangler.jsonc`.
5. `npx wrangler r2 bucket create lunavine-workflowos-evidence-dev`
6. Update `OWNER_EMAIL`.
7. `npx wrangler d1 migrations apply lunavine-workflowos-dev --remote`
8. `npm run dev`
9. `npm run deploy`
10. Enable Cloudflare Access for the Worker/custom hostname.

See `docs/DEPLOYMENT.md` and `docs/NEXT_30_DAYS.md`.

## Governance

The implementation preserves these V5 rules:

- Printful primary / Printify secondary-testing remains a business configuration, not hard-coded workflow authority.
- Release readiness is evidence-driven.
- Legal/IP, product safety, sample quality, production, pricing and final human review can block release.
- AI cannot be the final legal/cultural/release authority.
- One canonical artwork master is the target architecture.
- Approved files will be stored in R2; Google Drive integration will remain the creative working layer.

## Status

This is an **MVP foundation**, not a claim that the full BrandOS application is complete.


## Marketing Psychology & Consumer Insight

WorkflowOS includes `SKILL-MKT-001`, a governed marketing psychology and psychographic intelligence module. It stores consumer segments, behavioral-model boundaries, testable hypotheses, council reviews, experiment drafts, and validated learnings. See `docs/MARKETING_PSYCHOLOGY_SKILL.md`.

## v0.4.0 Access & Help Center
WorkflowOS now separates authentication from authorization: Cloudflare Access authenticates identity; DB-backed RBAC authorizes application operations. `OWNER_EMAIL` bootstraps as `SUPER_USER`. Help & Training Center content is available under `/help`, and access administration under `/admin/access`.
