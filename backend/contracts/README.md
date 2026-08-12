# Aqua Reserve Compact contract

`aqua-reserve-snapshot.compact` represents **one immutable Phase 1 snapshot**. A new snapshot (including a correction) is a new contract deployment, which preserves audit history without ever overwriting an old claim.

## On-chain data

Only these public-safe values are written to the contract: snapshot ID, issuer/attester authorisation commitments, scope and evidence hashes, liability Merkle root, expiry, status, attestation time, and a revocation-reason hash.

It never receives raw liabilities, customer identifiers, balances, receipts, reserve-wallet structure, or reserve evidence.

## Contract boundary

The Compact circuits govern lifecycle authority and state transitions. The backend produces the liability commitment, evidence commitments, issuer/attester Ed25519 signatures, encrypted customer receipts, and the coverage decision. The deployment adapter must bind exactly those backend commitments to this constructor; it must reject a response with a different contract address, transaction ID, or commitment.

## Required pre-deployment verification

1. Install the **official pinned** Midnight Compact toolchain for the chosen network. The Phase 1 source declares Compact language `0.23` and is pinned to compiler `0.31.1`.
2. Compile with `compact compile +0.31.1 aqua-reserve-snapshot.compact <output-directory>` and commit neither proving keys nor wallet secrets.
3. Run the generated circuit tests for successful attestation, shortfall, unapproved attestation, expiry, and revocation.
4. Deploy with a funded testnet wallet and record the contract address plus transaction ID in the deployment manifest.
5. Set the API's `MIDNIGHT_ANCHOR_MODE=midnight-preprod`; it invokes the direct `midnight/` worker and records the unique deployed address for each snapshot.

The current network toolchain evolves quickly; compile this source before treating it as deployable. The official release notes note Compact language and compiler changes, including the `compactc` command. [Midnight Testnet release notes](https://docs.midnight.network/assets/files/midnight-testnet-relnotes-04cd2e8c59377cb5554ed776195c2203.pdf)
