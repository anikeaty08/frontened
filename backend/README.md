# Aqua Reserve Phase 1 backend

The backend implements the Phase 1 reserve-snapshot contract from [AQUA_RESERVE_PROJECT_PLAN.md](AQUA_RESERVE_PROJECT_PLAN.md).

It accepts synthetic, single-asset customer liabilities only at the private snapshot-generation boundary; generates salted membership roots plus a separate commitment to the summed liability total and encrypted private receipts; records immutable snapshot events; exposes a public, scope-defined status; and separates issuer, attester, and customer roles.

## Run locally

```powershell
npm install
npm run dev
```

The development instance uses in-memory persistence and a clearly labelled `DEVELOPMENT` anchor. It never claims a Midnight Testnet transaction exists. To persist data normally, provide `DATABASE_URL` for PostgreSQL; Docker is not required.

```powershell
$env:DATABASE_URL='postgres://user:password@host:5432/aqua_reserve'
npm run dev
```

### Amazon RDS with IAM authentication

For the supplied RDS endpoint, enable the backend's IAM mode instead of constructing a one-off `DATABASE_URL` containing a token. IAM tokens expire after 15 minutes, so the backend uses `@aws-sdk/rds-signer` to generate a fresh token whenever `pg` opens a new connection. The runtime needs valid AWS credentials through the standard SDK provider chain and the database user must be configured for IAM database authentication.

```powershell
$env:AQUA_RDS_IAM_AUTH='true'
$env:RDSHOST='database-1.cluster-cz6kc44mkffy.ap-south-1.rds.amazonaws.com'
$env:RDS_DATABASE='postgres'
$env:RDS_USERNAME='postgres'
$env:AWS_REGION='ap-south-1'
$env:RDS_CA_CERT_PATH='C:\path\to\rds-ca-bundle.pem'
npm run dev
```

Production requires `RDS_CA_CERT_PATH` so TLS is verified. The backend never prints an IAM token or stores it in configuration.
The AWS execution identity needs `rds-db:connect` permission for the database user, and that PostgreSQL user must have the `rds_iam` role granted. [AWS RDS IAM authentication guidance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)

For a real Midnight record, production uses `MIDNIGHT_ANCHOR_MODE=midnight-preprod` and the direct worker in `midnight/`. Each snapshot deploys its own Compact contract; the API never relies on a static contract address or generic anchor relay.

## Development roles

| Role | Bearer token |
| --- | --- |
| Issuer | `issuer-demo-token` |
| Attester | `attester-demo-token` |
| Customer 001 | `customer-demo-token-001` |

Customer tokens continue through `customer-demo-token-050`.

With the service running, create and attest the full 25-customer synthetic Phase 1 demo:

```powershell
npm run demo:phase1
```

Check release prerequisites without exposing any configuration values:

```powershell
npm run preflight:phase1
npm run preflight:phase1 -- --production
```

## API

Snapshot publication requires an `Idempotency-Key` header (16–128 URL-safe characters). Retrying with the same body returns the original snapshot; reusing the key with changed input is rejected.

- `POST /v1/snapshots` — issuer creates a private snapshot and encrypted customer receipts.
- `POST /v1/snapshots/:snapshotId/attest` — assigned attester determines `VERIFIED` or `SHORTFALL`.
- `POST /v1/snapshots/:snapshotId/revoke` — issuer revokes without deleting history.
- `GET /v1/public/snapshots/:snapshotId` — public, non-sensitive snapshot status.
- `GET /v1/customer/snapshots/:snapshotId/verification` — authenticated customer’s private inclusion receipt only.

## Security boundaries

- Raw liabilities are not persisted.
- Customer references are HMAC-derived, not stored as customer IDs.
- Receipts are AES-256-GCM encrypted at rest.
- Public responses exclude balances, identities, raw reserve evidence, and customer receipts.
- Amounts are integer base-unit strings; floating point is never used.
- Publication stores only keyed idempotency/request digests; it never stores the raw retry key or request body.
- PostgreSQL schema changes are versioned, transactionally applied, and startup-serialized with an advisory lock.
- The Compact attestation circuit proves a comparison of committed Phase 1 totals; it does not establish that the external reserve evidence or customer source system is complete. A verified result is a scoped, point-in-time statement—not an audit or general safety claim.
