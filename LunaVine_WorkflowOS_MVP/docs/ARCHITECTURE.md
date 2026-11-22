# Luna Vine WorkflowOS — MVP Architecture

## Current scope

This repository is the first deployable execution layer beneath Luna Vine BrandOS V5.0.

It intentionally implements a **workflow kernel**, not every BrandOS feature at once.

### Implemented in this MVP

- Cloudflare Access identity hook (`ctx.access`).
- D1 operational database.
- R2 Evidence Vault storage.
- Product Release workflow cases.
- Reusable mandatory gate registry.
- Case-level gate results.
- Derived Release Gate decision.
- Append-only audit-event writes.
- Design/artwork/product/variant schema foundation.
- Production profile, sample and pricing schema foundation.
- Cloudflare Workflows durable execution hook.
- Internal Control Tower UI.

### Deliberately not claimed as complete

- Google Drive synchronization.
- Printful/Printify APIs.
- Etsy/Shopify publishing.
- Gang-sheet nesting algorithm.
- Model Campaign generation.
- CRM/lifecycle email.
- AI agent orchestration.
- RBAC beyond owner/user scaffold.
- Full conditional-gate rules engine.

Those are next layers and must not be represented as live until implemented and tested.

## Storage responsibilities

- **D1** — structured operational truth.
- **R2** — approved/evidence file objects and immutable snapshots.
- **Google Drive (next integration)** — human-friendly working creative files.
- **Git** — source code and migrations.

## Security model

Production must be protected by Cloudflare Access. The Worker reads authenticated identity from `ctx.access`; unauthenticated calls are rejected. Cloudflare documents this as the current preferred Worker Access integration.

The initial deployment can allow only the owner's email. Later, role/permission records will be added in D1 while Access continues to handle identity authentication.

## Release invariant

`RELEASE_READY` is never accepted from client input. It is produced only by `evaluateRelease()` from blocking gate results.

## Architecture evolution

Phase 1: D1/R2/Access/Workflow kernel.
Phase 2: dynamic gate rules, tasks/SLAs, RBAC, Design/Product workspaces.
Phase 3: production optimization, DTF gang sheets, samples and supplier adapters.
Phase 4: campaign system, listing platform adapters, publication reconciliation.
Phase 5: CRM/growth, order/CX, agents and MIS.


## Growth Intelligence: Marketing Psychology & Consumer Insight

`SKILL-MKT-001` is a governed domain module under Growth & CRM, with read/use hooks for Brand & Product Intelligence. It uses psychographic segments and behavioral-science models to create testable hypotheses, not automatic marketing truth. Brand and Ethics reviews are mandatory; Legal, Claims and Cultural reviews become mandatory when applicable. Experiments are blocked until required reviews pass. Validated learnings remain non-reusable until explicitly approved into the Marketing Learning Registry.
