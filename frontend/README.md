# AquaReserve web application

The production-facing Next.js application for AquaReserve Phase 1. It includes the public reserve registry, authoritative snapshot detail, private customer inclusion verification, and secure issuer/attester workspaces.

## Local development

The API normally listens on port 3000 and this application on port 3001.

```powershell
$env:AQUA_API_URL='http://127.0.0.1:3000'
npm run dev -- --port 3001
```

`AQUA_API_URL` is server-only. Browser calls use the same-origin `/api/backend` proxy. Bearer credentials are accepted by `/api/session`, stored in an `HttpOnly`, `SameSite=Strict` cookie, and never written to local storage.

### Local Phase 1 demo connection

When the frontend runs with `NODE_ENV` other than `production`, `/app` offers a local-demo connection for the synthetic issuer, attester, and customer roles. `/verify/[snapshotId]` also exposes the two acceptance scenarios: customer 001 is included and customer 050 is omitted. The bearer values are written directly into the HttpOnly session cookie by the server route and are never returned to browser JavaScript.

Set `AQUA_LOCAL_DEMO_SESSION=false` to disable these shortcuts during development. They are unconditionally disabled in a production Next.js runtime. Real integrations use the normal credential field or replace the Phase 1 token boundary with the platform identity provider.

## Required checks

```powershell
npm run lint
npm test
npm run build
```

Set `NEXT_PUBLIC_SITE_URL` to the canonical public URL when deploying. The API must set `AQUA_WEB_ORIGIN` to that same frontend origin.
