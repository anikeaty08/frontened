# AquaReserve web application

The production-facing Next.js application for AquaReserve Phase 1. It includes the public reserve registry, authoritative snapshot detail, private customer inclusion verification, and secure issuer/attester workspaces.

## Local development

The API normally listens on port 3000 and this application on port 3001.

```powershell
$env:AQUA_API_URL='http://127.0.0.1:3000'
npm run dev -- --port 3001
```

`AQUA_API_URL` is server-only. Browser calls use the same-origin `/api/backend` proxy. Bearer credentials are accepted by `/api/session`, stored in an `HttpOnly`, `SameSite=Strict` cookie, and never written to local storage.

## Required checks

```powershell
npm run lint
npm run build
```

Set `NEXT_PUBLIC_SITE_URL` to the canonical public URL when deploying. The API must set `AQUA_WEB_ORIGIN` to that same frontend origin.
