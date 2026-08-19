# Aqua Reserve Phase 1 redacted release manifest

Generated: 2026-08-12. Network: Midnight Preprod. Persistence: Amazon Aurora PostgreSQL with IAM authentication and verified TLS.

## Source and toolchain

| Item | Value |
| --- | --- |
| Base Git commit | `52cc3c64e66a76b32ff65a815b47290018bd70ab` |
| Compact source SHA-256 | `615eef9933d018d9c39cfb3646f6afe703e0b0e98869d1eb82f26fc4b06db431` |
| Backend lock SHA-256 | `0913eeb00d7849b130e7e20fb5187349b12853acd207651aac0b50f24fcf7716` |
| Midnight lock SHA-256 | `79220d67468ac4a77ac9d6d28b27411ec23b36c9a7014f3dde5b4abb97ea50c0` |
| Compact CLI / compiler / language | `0.5.1` / `0.31.1` / `0.23` |
| Compact runtime / on-chain runtime | `0.16.0` / `3.0.0` |
| Proof server | `midnightntwrk/proof-server:8.1.0` |

The Git worktree contained the reviewed Phase 1 changes when this manifest was generated. The file digests bind the critical contract and dependency inputs independently of the base commit.

## Persistence and service probes

- RDS migrations `001_initial` and `002_idempotency_index` are recorded as applied.
- `/health` returned `ok`.
- `/ready` returned persistence `available` and anchor mode `midnight-preprod`.
- Customer 001: included `true`, cryptographically valid `true`.
- Customer 050: included `false`, cryptographically valid `false`, with no receipt returned.

## Chain outcomes

The full transaction identifiers, block heights, snapshots, and contract addresses are recorded in `PHASE_1_ACCEPTANCE.md`.

- Covered snapshot: `VERIFIED` in API and authoritative Compact state.
- Shortfall snapshot: `SHORTFALL` in API and authoritative Compact state.
- Revocation snapshot: `REVOKED` in API and authoritative Compact state; the reason hash was verified.
- Expiry snapshot: contract expiry `2026-08-12T05:00:47.000Z`; the public API returned `EXPIRED` at `2026-08-12T05:01:35Z`.

## Verification gates

- Backend TypeScript check and build: passed.
- Backend/API/contract regression suite: 23 tests passed.
- Midnight worker suite: 3 tests passed.
- Backend and Midnight production dependency audits: 0 known vulnerabilities.
- Production preflight: passed with ephemeral, unprinted strong issuer, attester, and customer tokens.
- RDS health and migrations: passed.
- Midnight wallet/proof readiness: `READY`, synchronized on Preprod.

## Promotion conditions

This manifest proves the locked Phase 1 Preprod backend. A public production launch additionally requires an approved production domain and hosting environment, managed authentication/secrets, monitoring/alerting, operator approval, and rotation of any wallet mnemonic ever shared in chat or logs.
