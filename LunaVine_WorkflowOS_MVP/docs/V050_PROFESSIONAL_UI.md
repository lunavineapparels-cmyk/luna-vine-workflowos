# WorkflowOS v0.5 Professional Command Center

## Objective

Upgrade the internal Luna Vine WorkflowOS from MVP styling to a professional enterprise operating console without weakening governance, RBAC, Evidence Vault, audit or Release Gate behavior.

## UI changes

- Executive-grade Control Tower hero and KPI hierarchy.
- Grouped navigation: Operate, Govern, Learn & Admin.
- Production workspace status bar.
- Release-control health and gate-completion visualization.
- Owner-focus panel separating creative endorsement from release clearance.
- Professional tables, empty states, forms, badges, responsive behavior and mobile navigation.
- Masked authenticated identity in page footer.
- V5.1 program/version indicator.
- Finance Control Center shell with explicit non-connected states and human-controlled money movement.

## Finance architecture baseline

- Shopify Payments: payment processing baseline.
- Mercury: business banking baseline; account not connected in v0.5.
- QuickBooks Online: accounting system-of-record baseline; integration not connected in v0.5.
- Shopify Tax: tax automation baseline; configuration remains owner/professional review.
- WorkflowOS: management controls, forecasts, approvals, reconciliation status and exception queue.

No balance, bank, tax or accounting data is fabricated. The Finance Center remains a control-design view until integrations are verified.

## Security / governance preserved

- Cloudflare Access remains authentication perimeter.
- DB-backed RBAC remains authorization control.
- No Super User Release Gate bypass.
- No audit deletion capability added.
- External money movement is not automated.
- Production publication remains human-controlled.

## Validation

Targeted TypeScript validation of changed UI/types passes with:

`tsc --noEmit --target es2022 --module esnext --skipLibCheck src/ui/styles.ts src/ui/layout.ts src/ui/pages.ts src/types.ts`

Full package CI requires dependency installation / Cloudflare worker types in the deployment environment.
