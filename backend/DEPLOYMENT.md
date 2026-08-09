# Aqua Reserve Phase 1 deployment runbook

Deployment is a controlled release, not an `npm run` side effect: it requires a Midnight wallet/network configuration, a local Docker proof server, and AWS identity that are not present in this workspace.

## 0. Operator identity in Ubuntu WSL

The release operator must authenticate the AWS CLI before an RDS IAM token can be minted. Run this interactively in Ubuntu WSL; do not place AWS credentials or session tokens in this repository:

```bash
aws login
aws sts get-caller-identity
```

The identity must be authorised for `rds-db:connect` to the configured database principal. The current AWS CLI installation is independent of Docker.

## 1. Backend release configuration

Set production secrets in the deployment environment only:

```powershell
$env:NODE_ENV='production'
$env:AQUA_WEB_ORIGIN='https://your-web-domain.example'
$env:AQUA_RDS_IAM_AUTH='true'
$env:RDSHOST='database-1.cluster-cz6kc44mkffy.ap-south-1.rds.amazonaws.com'
$env:RDS_DATABASE='postgres'
$env:RDS_USERNAME='postgres'
$env:AWS_REGION='ap-south-1'
$env:RDS_CA_CERT_PATH='C:\secure\rds-ca-bundle.pem'
$env:AQUA_MASTER_KEY_BASE64='<32-byte-base64-key>'
$env:AQUA_CUSTOMER_REFERENCE_KEY_BASE64='<32-byte-base64-key>'
$env:AQUA_AUTH_TOKENS_JSON='<role-bound-principals-json>'
$env:AQUA_ISSUER_ED25519_PRIVATE_KEY_PEM='<issuer-private-key>'
$env:AQUA_ISSUER_ED25519_PUBLIC_KEY_PEM='<issuer-public-key>'
$env:AQUA_ATTESTER_ED25519_PRIVATE_KEY_PEM='<attester-private-key>'
$env:AQUA_ATTESTER_ED25519_PUBLIC_KEY_PEM='<attester-public-key>'
$env:MIDNIGHT_ANCHOR_MODE='midnight-preprod'
$env:AQUA_MIDNIGHT_WORKER_DIR='C:\secure\aqua-reserve\backend\midnight'
# When the approved Compact toolchain runs in Ubuntu WSL rather than Windows:
$env:AQUA_COMPACT_CHECK_COMMAND='wsl.exe -d Ubuntu -u aniket -- bash -lc "compact compile --help"'
npm run build
npm start
```

The AWS role needs `rds-db:connect`; the database principal needs the `rds_iam` role. Do not use the 15-minute IAM database token as an environment variable—the backend mints a fresh connection token using the AWS SDK.

## 2. Contract release gate

Copy `midnight/.env.example` to the ignored `midnight/.env` and set the wallet mnemonic or seed, the issuer and attester authorisation secrets, and an encrypted private-state password. Start the local proof server with `npm --prefix midnight run proof:up`, then compile with `npm --prefix midnight run compile:contract`. The API owns one persistent local Midnight lifecycle worker; it keeps the wallet warm and serializes deploy, attest, and revoke operations.

The authorization secrets remain runtime-only worker environment values. The encrypted Midnight private-state store retains the coverage witnesses and commitment openings required for later proof calls, but not issuer/attester authorization secrets. Keep deployment, attestation, and revocation operations in separately scoped runtime environments when moving beyond the Phase 1 demo roles.

The worker also writes encrypted, ignored wallet-sync checkpoints under `midnight/.aqua-midnight-state/`. They are encrypted with `AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD` and are required to resume a long first Preprod sync after an interruption. Do not commit, delete, or overwrite a checkpoint merely because it cannot be decrypted: first verify that the configured password is the original value.

Persist a release manifest in the deployment secret store containing:

- source hash and compiler version;
- Midnight network and each snapshot contract address;
- deploy, attest, and revoke transaction IDs and block heights;
- issuer/attester authorisation commitment fingerprints;
- deployment timestamp and operator approval.

Never place wallet seeds, private evidence, customer data, receipts, or proving keys in this repository or the web application.

## 3. Web release configuration

```powershell
Set-Location ..\frontend
$env:NEXT_PUBLIC_AQUA_API_URL='https://your-api-domain.example'
npm run build
npm start
```

Deploy the API and documentation/web app as separate services. Allow only the configured web origin in API CORS. The API/prover service and direct Midnight worker must stay private; the browser only calls public endpoints or a customer-authenticated verification endpoint.

## 4. Release proof

Before declaring Phase 1 deployed, capture these independent evidence items:

1. API `/health` response from the deployed URL.
2. PostgreSQL migration rows and encrypted-receipt storage check.
3. Published synthetic 25-customer snapshot ID.
4. Customer inclusion result and omitted-customer negative result.
5. Attester status change and public transparency URL.
6. Midnight contract address and transaction ID, fetched from the target network.
7. Expiry and revocation failure results.

Without all seven, call the service **pre-production**, not deployed.
