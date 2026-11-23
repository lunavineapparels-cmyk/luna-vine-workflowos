# Next 30 Days — Implementation Sequence

## Week 1 — Foundation proof
- Create Cloudflare account resources.
- Deploy DEV.
- Enable Access owner-only.
- Create first Product Release case.
- Upload evidence to R2.
- Validate release decision behavior.
- Verify audit records.

## Week 2 — Core operations
- Add users/roles/permissions tables.
- Add tasks, due dates and SLA escalation.
- Add Design and Product create/edit screens.
- Add Artwork Version promotion from working file to approved R2 master.
- Add conditional gate applicability rules.

## Week 3 — Production
- Add supplier/product production profiles.
- Add fixed/graded/provider-controlled print-sizing calculator.
- Add effective-DPI validator.
- Add Sample QA scorecards.
- Add pricing/margin calculator.

## Week 4 — Integrations pilot
- Connect Google Drive read metadata + controlled promotion to R2.
- Build Printful adapter interface and sandbox/mock implementation.
- Add first Release Certificate.
- Create staging environment.
- Run an end-to-end pilot on one Luna Vine product only.

## Exit criteria
- No manual Release Ready flag exists.
- Every material status change generates audit evidence.
- Approved artwork has a checksum and immutable R2 object.
- Product release case can survive browser/device changes because state is cloud-side.
- One real product passes through the workflow without spreadsheet-only state.
