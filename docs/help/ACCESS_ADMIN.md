# Users, Roles & Entitlements

## Purpose
Give each person only the permissions required for Luna Vine work while preserving segregation of duties and auditability.

## Accountable party
Super User / Engineering Administrator for provisioning; Owner Executive for business accountability.

## Operating sequence
1. Authenticate the person through Cloudflare Access.
2. Create or activate the WorkflowOS application user.
3. Assign the narrowest suitable role.
4. Record assignment reason and assigner.
5. Use scoped/time-bound entitlements when needed.
6. Periodically review and revoke unused access.

## Super User constraints
Super User is an administrative role, not a bypass mechanism. No application role can delete audit events. Release exceptions must remain explicit, justified, time-bound and auditable.

## Example
A contractor preparing Shopify listings receives `MARKETPLACE_OPS`, not `SUPER_USER`. They can manage listings but cannot approve legal gates, pricing, or final release.
