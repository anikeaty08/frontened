# Aqua Reserve Phase 1 deployment runbook

Phase 1 has been exercised end-to-end on Midnight Preprod with RDS persistence. A production release remains a separate operator-controlled deployment with production identities, domains, secrets, and monitoring.

## 1. Release environment

Use an execution identity authorized for `rds-db:connect`. The PostgreSQL principal must have `rds_iam`; the API mints short-lived IAM tokens through the AWS SDK. Never save an IAM token in `.env`.

Required production settings:

```text
NODE_ENV=production
AQUA_WEB_ORIGIN=https://approved-web-origin.example
AQUA_DEMO_AUTH=false
AQUA_RDS_IAM_AUTH=true
RDSHOST=<Aurora-or-RDS-host>
RDS_PORT=5432
RDS_DATABASE=<database>
RDS_USERNAME=<IAM-enabled-user>
AWS_REGION=<region>
RDS_CA_CERT_PATH=<absolute-path-to-trusted-RDS-CA-bundle>
AQUA_MASTER_KEY_BASE64=<base64-encoded-32-byte-key>
AQUA_CUSTOMER_REFERENCE_KEY_BASE64=<base64-encoded-32-byte-key>
AQUA_AUTH_TOKENS_JSON=<strong-role-bound-token-map>
AQUA_ISSUER_ED25519_PRIVATE_KEY_PEM_BASE64=<secret>
AQUA_ISSUER_ED25519_PUBLIC_KEY_PEM_BASE64=<public-key>
AQUA_ATTESTER_ED25519_PRIVATE_KEY_PEM_BASE64=<secret>
AQUA_ATTESTER_ED25519_PUBLIC_KEY_PEM_BASE64=<public-key>
MIDNIGHT_ANCHOR_MODE=midnight-preprod
AQUA_MIDNIGHT_WORKER_DIR=<absolute-path-to-backend/midnight>
MIDNIGHT_WALLET_MNEMONIC=<secret>  # or MIDNIGHT_WALLET_SEED, never both
AQUA_MIDNIGHT_ISSUER_AUTH_SECRET_HEX=<secret>
AQUA_MIDNIGHT_ATTESTER_AUTH_SECRET_HEX=<secret>
AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD=<secret>
```

`AQUA_AUTH_TOKENS_JSON` is an object keyed by unguessable tokens of at least 32 characters. It must contain distinct issuer, attester, and customer principals. Use a real identity provider or secret manager before a public production launch; the token map is the locked Phase 1 authentication boundary.

The previously shared wallet mnemonic must not be used for a production release. Rotate it and all dependent authorization material in a controlled wallet with funded Preprod/mainnet credentials.

## 2. Toolchain and proof server

The locked toolchain is Compact CLI wrapper 0.5.1, compiler 0.31.1, Compact language 0.23, `compact-runtime` 0.16.0, `onchain-runtime-v3` 3.0.0, and proof server 8.1.0. The proof server binds only to `127.0.0.1:6300`.

```powershell
npm --prefix midnight run proof:up
npm --prefix midnight run compile:contract
npm --prefix midnight run check
npm --prefix midnight test
npm run check
npm run build
npm test
npm run preflight:phase1 -- --production
```

The API owns a persistent lifecycle daemon and encrypted wallet checkpoints. Keep `midnight/.aqua-midnight-state/`, the private-state database, and its password together. Do not delete them to fix sync problems.

## 3. Safe lifecycle operation

- Publication requires an `Idempotency-Key`; retrying the same request returns the same snapshot.
- `GET /v1/issuer/snapshots/by-idempotency-key` recovers a response lost after submission.
- Deploy, attest, and revoke create durable claims before calling Midnight.
- Never blindly retry an uncertain chain operation.
- `POST /v1/snapshots/:snapshotId/reconcile` reads authoritative chain state and repairs the database.
- For an addressless rejected deployment only, the issuer may send `{ "abandonDeployment": true }` after operator reconciliation. A replacement must use a new idempotency key.

## 4. Service deployment

Run the API and frontend as separate services. The proof server, wallet worker, database, secret material, and private receipts must remain unreachable from the browser.

```powershell
npm run build
npm start
```

Release probes:

- `GET /health` proves the process is alive.
- `GET /ready` proves database availability and reports the configured anchor mode.

## 5. Release evidence

Before promoting a build, capture source digests, dependency locks, compiler/runtime versions, migration versions, transaction identifiers, block heights, contract addresses, public statuses, inclusion/omission results, and operator approval. Never include wallet credentials, private totals/openings, customer data, receipts, AWS tokens, or signing keys.

The current redacted Preprod evidence is in `PHASE_1_ACCEPTANCE.md` and `PHASE_1_RELEASE_MANIFEST.md`.
