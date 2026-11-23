# Deployment Guide

## Prerequisites

- Cloudflare account.
- Node.js supported by current Wrangler.
- A domain in Cloudflare when you are ready for `os.lunavineapparel.com`.

## 1. Install dependencies

```bash
npm install
```

## 2. Authenticate

```bash
npx wrangler login
```

## 3. Create D1

```bash
npx wrangler d1 create lunavine-workflowos-dev
```

Paste the returned `database_id` into `wrangler.jsonc`.

## 4. Create R2 bucket

```bash
npx wrangler r2 bucket create lunavine-workflowos-evidence-dev
```

## 5. Set owner identity

Replace `replace-with-owner-email@example.com` in both `vars.OWNER_EMAIL` and the local `access.dev.identity.email` value.

Do not commit real secrets. OWNER_EMAIL is not a secret, but API keys added later must use Cloudflare Secrets/Secrets Store.

## 6. Apply database migrations

```bash
npx wrangler d1 migrations apply lunavine-workflowos-dev --remote
```

## 7. Local run

```bash
npm run dev
```

Cloudflare Access is simulated locally using the `access.dev` configuration.

## 8. Deploy

```bash
npm run deploy
```

## 9. Protect with Cloudflare Access

In Cloudflare dashboard, enable Access on the Worker/custom hostname and allow only the approved owner email initially.

Current Workers documentation states that once Access authenticates a direct Worker request, the Worker can read the signed-in identity through `ctx.access` without manually parsing JWTs.

## 10. Custom hostname

Recommended eventual production hostname:

`os.lunavineapparel.com`

Create DEV/STAGING/PROD as separate Cloudflare environments/resources before business-critical use.
