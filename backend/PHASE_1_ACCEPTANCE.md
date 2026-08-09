# Phase 1 acceptance evidence

This is the release audit for the locked Phase 1 scope. “Local” evidence is not a claim of live network deployment.

| Requirement | Evidence | Status |
| --- | --- | --- |
| Demo custodian and one native-unit stable asset | `issuer-demo`, DUSD demo payload | Proven locally |
| 25–50 synthetic balances | `src/demo/phase1.ts`; in-process demo publishes 25 balances | Proven locally |
| Scoped, time-bound snapshot | Snapshot API schema, signatures, public page | Proven locally |
| Private liability membership root and committed total | Salted Merkle membership root; separate sum commitment; AES-GCM receipts | Proven locally |
| Same-asset reserve coverage result | Compact `attest` proves commitments to private reserve/liability totals and discloses only their comparison result | Contract compilation and commitment unit coverage proven locally; Preprod proof transaction pending |
| Customer inclusion verification | Authenticated receipt endpoint and `/verify` web page | Proven locally |
| Issuer and attester separation | Role-gated publication/attestation tests | Proven locally |
| Public issuer, status, scope, timestamp, freshness, limitations page | Documentation/web application under `../frontend/` | Pending integration with the final public API |
| Shortfall, omitted customer, expiry, revocation outcomes | API regression tests and public/customer UI status rendering | Proven locally |
| Midnight lifecycle record | Direct worker deploy/attest/revoke/inspect interface; address-bound Compact contract | Contract compilation and adapter regression coverage proven locally; Preprod transaction pending |
| Concurrent deployment safety | Optimistic snapshot revisions and a durable `DEPLOYING` claim before the external chain call | Proven locally with a direct-lifecycle race regression test |
| Zero-knowledge coverage inequality | `persistentCommit` binds each private total to its public membership root or reserve-evidence commitment; the circuit selects `VERIFIED`/`SHORTFALL` | Circuit implementation compiled locally. A live Preprod proof transaction is still required for acceptance. |
| PostgreSQL/RDS persistence | Versioned migrations and IAM adapter | Pending authenticated RDS migration run |
| Production web/API deployment | `DEPLOYMENT.md`, CORS, environment preflight | Pending approved hosting and secrets |

## Evidence commands

```powershell
npm run check
npm test
npm run build
npm run demo:phase1 # with the API running
Set-Location ..\frontend
npm run lint
npm run build
```

`npm run preflight:phase1 -- --production` is deliberately a deployment gate. It must pass only in the approved release environment with the official compiler, live network settings, and non-repository secrets.
