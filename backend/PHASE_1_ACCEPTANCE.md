# Phase 1 acceptance evidence

This is the release audit for the locked Phase 1 scope. “Local” evidence is not a claim of live network deployment.

| Requirement | Evidence | Status |
| --- | --- | --- |
| Demo custodian and one native-unit stable asset | `issuer-demo`, DUSD demo payload | Proven locally |
| 25–50 synthetic balances | `src/demo/phase1.ts`; in-process demo publishes 25 balances | Proven locally |
| Scoped, time-bound snapshot | Snapshot API schema, signatures, public page | Proven locally |
| Private liability membership root and committed total | Salted Merkle membership root; separate sum commitment; AES-GCM receipts | Proven locally |
| Same-asset reserve coverage result | Integer base-unit comparison, signed attestation, and Compact compiler output | Proven locally; Compact `0.30.0` compiled all 4 contract circuits in Ubuntu WSL |
| Customer inclusion verification | Authenticated receipt endpoint and `/verify` web page | Proven locally |
| Issuer and attester separation | Role-gated publication/attestation tests | Proven locally |
| Public issuer, status, scope, timestamp, freshness, limitations page | `web/app/snapshots/[snapshotId]/page.tsx` | Proven by web build |
| Shortfall, omitted customer, expiry, revocation outcomes | API regression tests and public/customer UI status rendering | Proven locally |
| Midnight lifecycle record | Compact source + address-bound anchor interface | Contract compilation proven locally; Testnet transaction pending |
| PostgreSQL/RDS persistence | Versioned migrations and IAM adapter | Pending authenticated RDS migration run |
| Production web/API deployment | `DEPLOYMENT.md`, CORS, environment preflight | Pending approved hosting and secrets |

## Evidence commands

```powershell
npm run check
npm test
npm run build
npm run demo:phase1 # with the API running
Set-Location web
npm run lint
npm run build
```

`npm run preflight:phase1 -- --production` is deliberately a deployment gate. It must pass only in the approved release environment with the official compiler, live network settings, and non-repository secrets.
