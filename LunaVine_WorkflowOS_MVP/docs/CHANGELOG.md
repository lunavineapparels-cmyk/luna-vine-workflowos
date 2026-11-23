# Changelog

## 0.2.0 — Marketing Psychology & Consumer Insight

Added governed `SKILL-MKT-001`:
- 24 behavioral/decision models with explicit ethical boundaries.
- Psychographic segment registry.
- Marketing hypothesis workflow.
- Six-role Marketing Psychology Council registry.
- Nine blocking marketing ethics/compliance controls.
- Mandatory Brand + Ethics review; conditional Legal + Claims + Cultural reviews.
- Experiment creation lock until all applicable reviews pass.
- Experiment start/completion lifecycle.
- Marketing Learning Registry with explicit approval before learning becomes reusable.
- Audit events across segment, hypothesis, review, experiment and learning lifecycle.
- Internal UI pages for segments, hypotheses, council reviews, experiments and reusable learnings.

## 0.1.0 — WorkflowOS MVP

Initial Product Release workflow kernel, Release Gate, Evidence Vault, D1 schema, R2 integration, audit ledger and Cloudflare Worker structure.

## 0.3.0 — Production Cloudflare alignment
- Aligned Worker name with `lunavine-workflowos-prod`.
- Bound production D1 database and R2 Evidence Vault in Wrangler configuration.
- Added `keep_vars: true` so dashboard-managed runtime variables remain intact on deploy.
- Removed dev-only Access configuration from source; Cloudflare Access is enforced at the edge.
- Added production deployment checklist.

## 0.4.0 — Identity, RBAC & Help Center
- Added DB-backed application users, roles, permissions and user-role assignments.
- Added owner bootstrap to SUPER_USER using OWNER_EMAIL after Cloudflare Access authentication.
- Added 11 seeded roles and fine-grained entitlements.
- Added segregation-of-duties control registry and protection against removing the last active Super User.
- Added permission enforcement on WorkflowOS read/write routes.
- Added Access Administration UI.
- Added Help & Training Center with initial step-by-step guides and examples.
- No role can delete audit history; Super User is not a release-gate bypass.
