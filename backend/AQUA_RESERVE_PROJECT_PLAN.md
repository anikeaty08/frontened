# Aqua Reserve — Locked Project Plan

## Product statement

**Aqua Reserve is the privacy-preserving assurance layer for custodial digital-asset platforms.**

It lets a platform publish a cryptographically verifiable, time-bound reserve snapshot; lets each customer privately verify that their covered balance was included; and gives auditors only the evidence they are authorised to inspect.

> **Prove coverage. Preserve privacy.**

### Precise promise

> Aqua Reserve verifies that defined covered liabilities were backed by defined reserves at a stated time, under a disclosed scope.

It is not an exchange, custodian, auditor, insurer, or guarantee of a platform's overall safety. A verified snapshot is evidence within its declared scope and timestamp only.

---

## Final product after Phase 3

A testnet-ready reserve-assurance platform for custodial digital-asset products.

A platform can publish recurring privacy-preserving reserve snapshots. Customers privately verify their own inclusion, auditors receive scoped evidence, and the public sees the issuer, timestamp, scope, freshness, limitations, and coverage result without seeing individual balances, identities, or reserve-wallet structure.

---

## Architecture

```text
Custodian / issuer
raw customer balances + reserve evidence
        |
        | private data boundary
        v
Aqua snapshot and proof engine
validates input, creates commitments, inclusion receipts, and coverage proof
        |
        | no raw balances on-chain
        v
Midnight Testnet contract
snapshot metadata, issuer/attester authorisation, proof status, expiry, revocation
        |
        +--------------------------+--------------------------+
        v                          v                          v
Customer portal              Public transparency page    Auditor evidence portal
private inclusion result     scope + status only         approved disclosures
```

### Data boundaries

**Never public**

- Customer identity or individual balance.
- Raw liability exports.
- Customer inclusion receipts or proof witnesses.
- Reserve-wallet structure and private reserve evidence.

**Public**

- Issuer and approved attester identity.
- Snapshot ID, timestamp, expiry, and revocation state.
- Scope-manifest hash and proof-system version.
- Proof status and declared limitations.

**Auditor-only**

- Approved evidence package.
- Reconciliation evidence.
- Reserve-control evidence.
- Disclosed aggregate details permitted by the issuer.

---

## Phase 1 — Aqua Reserve Snapshot

### Goal

Deliver one complete, understandable, customer-verifiable reserve snapshot.

### Must implement

- One demo custodian.
- One demo stable asset, measured in its own native units only.
- 25–50 synthetic customer balances.
- A snapshot with a fixed timestamp and declared scope.
- A private liability commitment / Merkle-sum root.
- A proof that `covered reserves >= covered liabilities`.
- A private inclusion receipt for each customer and a customer verification flow.
- A Midnight Testnet record for snapshot metadata, issuer, proof status, expiry, and revocation.
- A public transparency page that displays issuer, status, scope, timestamp, freshness, and limitations.
- Issuer and demo-attester roles.
- Deliberate, visible failure scenarios:
  - reserves below liabilities;
  - omitted customer cannot verify inclusion;
  - expired snapshot;
  - revoked snapshot.

### Explicit non-goals

- No real exchange connection.
- No real customer data.
- No payments or custody.
- No multi-asset reporting.
- No USD valuation or cross-asset collateral claim.
- No legal or financial audit claim.

### Phase 1 acceptance test

A reviewer can publish a valid synthetic snapshot, privately verify an included customer, see the public status without sensitive data, and observe each invalid scenario fail clearly.

---

## Phase 2 — Aqua Reserve Assurance

### Goal

Turn a working proof into credible, auditor-ready assurance.

### Must implement

- Multiple covered assets, verified asset-by-asset first.
- Snapshot history and freshness states.
- Issuer and attester registry with signatures.
- Reconciliation evidence linking the liability export to the custodian's source system.
- Reserve-wallet control evidence, such as a signed message or equivalent method.
- Auditor portal with permissioned evidence packages.
- Scope declarations for inclusions, exclusions, restrictions, and methodology.
- Alerts for stale, failed, missing, expired, and revoked snapshots.

### Phase 2 acceptance test

An authorised auditor can answer: who issued the snapshot, what exactly it covers, when it was valid, how the liability set was reconciled, what reserve control was shown, and what evidence may be inspected.

---

## Phase 3 — Aqua Reserve Platform

### Goal

Make Aqua Reserve reusable infrastructure for custodial digital-asset platforms.

### Must implement

- Issuer dashboard for scheduled snapshot publishing.
- Customer self-verification portal.
- Public transparency pages.
- Partner API and embeddable verification widget.
- Role-based auditor and regulator evidence links.
- Monitoring, incident timeline, and notifications for stale, failed, revoked, or missing snapshots.
- A stablecoin reserve-reporting template as the first vertical extension.

### Phase 3 acceptance test

A custodial platform can integrate Aqua Reserve, publish recurring scoped snapshots, and give customers, auditors, and the public the appropriate evidence without exposing sensitive financial data.

---

## Non-negotiable project rules

1. No raw balances, customer identities, wallet structure, or private proofs are written to a public chain.
2. Every snapshot is immutable and versioned. A correction creates a new snapshot; it never overwrites history.
3. Every public claim must map to a cryptographic proof or signed evidence record.
4. All quantities use integer base units. Floating-point arithmetic is prohibited.
5. Phase 1 compares one asset to the same asset only. It makes no USD-converted or cross-asset coverage claim.
6. Every snapshot must carry its scope, timestamp, expiry, proof version, limitations, issuer signature, and revocation status.
7. `Verified` means valid within the declared scope at its stated time. It never means safe, audited, or permanently solvent.
8. Customer inclusion and completeness of the full liability set are separate claims.
9. Private source data remains inside the custodian/prover boundary and is not logged in plaintext.
10. Roles stay separated: issuer publishes, attester validates, customer verifies only their own record, and auditor accesses approved evidence.
11. Failure is a first-class outcome. Shortfall, invalid proof, expired, revoked, missing evidence, and unavailable states must never appear as covered.
12. A feature cannot enter a phase until its threat model, success criteria, data ownership, and failure behaviour are defined.

---

## Snapshot contract

Each snapshot must include:

- Snapshot ID and protocol/schema version.
- Issuer identity and attester identity.
- Covered asset identifier and integer precision.
- Liability definition and included/excluded categories.
- Cutoff timestamp and validity/expiry time.
- Liability commitment root.
- Reserve-evidence commitment or reference.
- Coverage proof result.
- Scope-manifest hash.
- Issuer and attester signatures.
- Revocation status and revocation reason, if applicable.
- Human-readable limitations statement.

### Required public states

- `VERIFIED` — valid proof within scope and before expiry.
- `SHORTFALL` — reserves do not cover declared liabilities.
- `EXPIRED` — snapshot is no longer current.
- `REVOKED` — issuer or authorised attester revoked the snapshot.
- `INVALID` — signature, proof, or required scope data is invalid.
- `UNAVAILABLE` — evidence or verification service cannot be reached; this is not a positive result.

---

## Recommended technology stack

| Layer | Choice | Purpose |
| --- | --- | --- |
| Privacy blockchain | Midnight Testnet + Compact | Private-state and ZK contract layer |
| Contract integration | TypeScript + Midnight.js | DApp and contract interaction |
| Proof core | TypeScript Merkle-sum / commitment library | Deterministic liability commitments and inclusion receipts |
| Web application | Next.js + React + TypeScript | Customer, public, and issuer interfaces |
| UI | Tailwind CSS + shadcn/ui | Clean, consistent product UI |
| Sensitive backend | Node.js + Fastify | Isolated snapshot/prover and evidence boundary |
| Database | PostgreSQL | Metadata, roles, audit events, and status history |
| Private evidence storage | Encrypted S3-compatible object storage | Encrypted manifests and evidence packages |
| Authentication | Auth.js with role-based access control | Separate customer, issuer, attester, and auditor access |
| Input validation | Zod | Strict API and snapshot schemas |
| Testing | Vitest + Playwright | Proof/core validation and end-to-end flows |
| Deployment | Vercel for web; container host for API/prover | Separate public UI from private services |

### Stack decision rules

- Use the current, version-pinned Midnight Testnet toolchain.
- Keep Aqua's snapshot schema independent of a particular Midnight SDK release.
- Keep proof/core logic in a deterministic, separately testable module.
- Do not put sensitive snapshot generation inside a browser or public web server.
- Do not introduce a second ZK framework in Phase 1 unless Midnight cannot express a required proof; avoid unnecessary proof-system complexity.

---

## Verification strategy

### Phase 1 proof tests

- Valid snapshot succeeds.
- Reserve amount below liabilities fails.
- Negative or malformed balance input fails.
- Incorrect customer receipt fails.
- Omitted customer has no valid inclusion result.
- Expired snapshot is not shown as verified.
- Revoked snapshot is not shown as verified.
- No public endpoint returns customer balances or raw liability data.

### Before every phase release

- Validate contract/proof logic with deterministic unit tests.
- Validate role permissions and privacy boundaries end-to-end.
- Validate every public status against its evidence record.
- Re-run all prior failure cases to prevent regressions.

---

## Product language rules

### Approved wording

- Verified snapshot.
- Declared scope.
- Coverage evidence.
- Customer inclusion verification.
- Proof status and limitations.

### Do not claim

- Fully audited.
- Guaranteed safe.
- Proof of all reserves.
- Permanently solvent.
- Regulatory approval.

---

## Sources informing this plan

- Midnight identifies ZK Proof-of-Reserves auditor applications as a suitable use case: https://midnight.network/request-for-start-ups
- Midnight Testnet release notes and evolving Compact/Midnight.js toolchain: https://docs.midnight.network/assets/files/midnight-testnet-relnotes-04cd2e8c59377cb5554ed776195c2203.pdf
- PCAOB warning on the limits of point-in-time Proof-of-Reserves reports: https://pcaobus.org/resources/information-for-investors/investor-advisories/investor-advisory-exercise-caution-with-third-party-verification-proof-of-reserve-reports
- Industry methodology for liability extraction, reconciliation, and asset-control evidence: https://docs.hacken.io/methodologies/proof-of-reserves/
- Example ZK-backed customer inclusion and liability constraints: https://www.okx.com/proof-of-reserves
