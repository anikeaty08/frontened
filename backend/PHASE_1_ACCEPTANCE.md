# Phase 1 acceptance evidence

This audit covers the locked synthetic Phase 1 scope. It proves a Preprod implementation, not a production custody audit or a claim that external reserve evidence is complete.

## Acceptance matrix

| Requirement | Evidence | Status |
| --- | --- | --- |
| One demo custodian, one native-unit stable asset, 25 synthetic customers | `issuer-demo`, DUSD, and the deterministic 25-customer scenarios | Passed |
| Scoped, time-bound immutable snapshot | Signed scope manifest, cutoff/expiry, one Compact deployment per snapshot | Passed |
| Private liabilities and reserve totals | Salted Merkle membership root, private sum/openings, encrypted AES-256-GCM receipts | Passed |
| Zero-knowledge same-asset coverage result | Compact circuit binds private totals to public commitments and reveals only `VERIFIED` or `SHORTFALL` | Passed on Preprod |
| Customer inclusion and omission | Customer 001 receipt verifies; customer 050 returns omitted without another customer's data | Passed against RDS-backed API |
| Issuer/attester separation | Separate bearer principals, Ed25519 evidence keys, and Compact authorization witnesses | Passed |
| Public status and freshness | Public endpoint derives `EXPIRED` from authoritative chain expiry and verifies all stored commitments | Passed |
| Shortfall | Snapshot `05c12769-824a-5b55-a0ed-2a5df01aa77e` is `SHORTFALL` on API and chain | Passed on Preprod |
| Revocation | Snapshot `3c8dba60-e97d-53ad-8fdb-ab524d9743cc` is `REVOKED`; reason hash matches the authorized reason | Passed on Preprod |
| Safe retry/reconciliation | Durable deployment/lifecycle claims, optimistic revisions, stable idempotency lookup, explicit addressless abandonment | Passed in regression tests and live recovery |
| PostgreSQL/RDS persistence | IAM-authenticated Aurora PostgreSQL; migrations `001_initial` and `002_idempotency_index` applied | Passed |
| Production configuration gate | Strong role-token validation, verified RDS TLS, restricted CORS, rate limit, security headers, readiness checks | Passed with ephemeral unprinted production tokens |

## Live Preprod evidence

All Indexer transactions below returned `SUCCESS`.

| Scenario | Snapshot | Contract | Transaction identifier | Block |
| --- | --- | --- | --- | ---: |
| Covered deploy | `5b43d222-ccf0-54b8-a8a5-ff7638561bba` | `7be2a7b0ae488e127948bf4206e3129bba62fd19c7594fd93f46605a84688666` | `00405e7236933f098a33d90841d819a190dfb9f74652776e75349764cfd95a91d7` | 2065127 |
| Covered attestation | same | same | `00df87ac4dcd900657a09a494271a9a4097bba4e1c2759d972fc3d1ec9aa440c53` | 2065350 |
| Shortfall deploy | `05c12769-824a-5b55-a0ed-2a5df01aa77e` | `4e08e73150e800365a47dda1d8771bd95c702936944b8bdd067adc1091667ecd` | `00da1decf483d492c2659767b638dfe39ef10e8e0deaf6873ab9fbbac063c38162` | 2066103 |
| Shortfall attestation | same | same | `0060d130dbed4e24e9785e9c947d29428fa267c84ec434ee8757fd783c54c94d5a` | 2066107 |
| Revocation deploy | `3c8dba60-e97d-53ad-8fdb-ab524d9743cc` | `604379c9f989b9ad61288315f18c3936263ffb08811f45440824f9e1a66c1748` | `00f7ea1f9876a3e9371c482b0a02e05da5725c23cd155041066f2368699025c5a9` | 2065230 |
| Revocation | same | same | `00390c19d7c8419e0b17cd6a4f306c3ce865a6342a94b2cd26607c3dd261229672` | 2066123 |
| Expiry deploy | `ad9b8963-694e-515f-8c7a-9ae8ba7e52a1` | `6f78f722b30964ea3c205c40c1e1c67dcb062de82211170b3ce06fe29bed5e4b` | `0004dc0b21f8ef354b1af5e2c780165ec21347369ada1ab70bbf42f2c54e97f0db` | 2066282 |

The expiry contract commits `2026-08-12T05:00:47.000Z`; the RDS-backed public API returned `EXPIRED` after that time.

## Reproducible gates

```powershell
npm run check
npm run build
npm test
npm audit --omit=dev
npm --prefix midnight run compile:contract
npm --prefix midnight run check
npm --prefix midnight test
npm --prefix midnight audit --omit=dev
npm run preflight:phase1 -- --production
```

The production preflight requires deployment-environment secrets. It prints only pass/fail labels and never secret values.
