import { randomUUID } from "node:crypto";
import type { AquaConfig } from "../config.js";
import { canonicalJson, hmacSha256, sha256 } from "../crypto/hash.js";
import { buildMerkleTree, verifyReceipt } from "../crypto/merkle.js";
import { open, seal } from "../crypto/seal.js";
import { conflict, forbidden, invalidState, notFound, validation } from "../domain/errors.js";
import {
  SNAPSHOT_SCHEMA_VERSION,
  type PrivateReceipt,
  type Principal,
  type PublicSnapshot,
  type ReserveSnapshot,
  type SnapshotEvent,
} from "../domain/types.js";
import { SnapshotRevisionConflictError, type SnapshotRepository } from "../persistence/snapshot-repository.js";
import type { AnchorPayload, AnchorService } from "./anchor-service.js";

export interface CreateSnapshotCommand {
  idempotencyKey: string;
  issuerId: string;
  attesterId: string;
  asset: { code: string; decimals: number };
  scope: {
    liabilityDefinition: string;
    includedCategories: string[];
    excludedCategories: string[];
    limitations: string;
  };
  cutoffAt: string;
  expiresAt: string;
  reserveTotalBaseUnits: string;
  reserveEvidenceReference: string;
  liabilities: Array<{ customerId: string; balanceBaseUnits: string }>;
}

export interface CustomerVerification {
  included: boolean;
  cryptographicallyValid: boolean;
  currentStatus: PublicSnapshot["status"];
  receipt: PrivateReceipt | null;
}

const roleRequired = (principal: Principal, role: Principal["roles"][number]): void => {
  if (!principal.roles.includes(role)) throw forbidden();
};

const parseUnits = (value: string, fieldName: string): bigint => {
  if (!/^(0|[1-9]\d*)$/.test(value)) {
    throw validation(`${fieldName} must be a non-negative integer base-unit string`);
  }
  const units = BigInt(value);
  if (units > 18_446_744_073_709_551_615n) {
    throw validation(`${fieldName} must fit in the Phase 1 Uint<64> proof range`);
  }
  return units;
};

const isIsoTimestamp = (value: string): boolean => !Number.isNaN(Date.parse(value));

export class SnapshotService {
  public constructor(
    private readonly repository: SnapshotRepository,
    private readonly anchorService: AnchorService,
    private readonly config: AquaConfig,
  ) {}

  public async create(principal: Principal, command: CreateSnapshotCommand): Promise<PublicSnapshot> {
    roleRequired(principal, "ISSUER");
    if (principal.id !== command.issuerId) throw forbidden("An issuer may only publish under its own identity");
    this.validateCreateCommand(command);

    // Neither the client-provided key nor the raw request is persisted. HMAC digests
    // make equivalent retries safe without making customer data dictionary-attackable.
    const idempotencyKeyDigest = hmacSha256(
      this.config.masterKey,
      `aqua:publish-idempotency-key:v1|${principal.id}|${command.idempotencyKey}`,
    );
    const requestFingerprint = hmacSha256(this.config.masterKey, `aqua:publish-request:v1|${canonicalJson(this.fingerprintableCommand(command))}`);
    const prior = await this.repository.findByIdempotencyKey(idempotencyKeyDigest);
    if (prior) return this.toPublic(await this.ensureDeployment(this.returnIdempotentSnapshot(prior, requestFingerprint)));

    const uniqueCustomers = new Set<string>();
    const leaves = command.liabilities.map((liability) => {
      if (uniqueCustomers.has(liability.customerId)) {
        throw conflict("A customer may only have one covered balance per Phase 1 snapshot");
      }
      uniqueCustomers.add(liability.customerId);
      const balance = parseUnits(liability.balanceBaseUnits, "liability balance");
      if (balance <= 0n) throw validation("A covered liability balance must be greater than zero");
      return {
        customerId: liability.customerId,
        customerReference: this.customerReference(liability.customerId),
        balanceBaseUnits: balance,
        salt: hmacSha256(this.config.masterKey, `aqua:receipt-salt:v1|${idempotencyKeyDigest}|${this.customerReference(liability.customerId)}`),
      };
    });

    const tree = buildMerkleTree(leaves);
    const reserveTotal = parseUnits(command.reserveTotalBaseUnits, "reserve total");
    const id = this.deterministicSnapshotId(idempotencyKeyDigest, requestFingerprint);
    // A customer receipt proves membership against membershipRoot. The separately
    // named liability commitment also binds the aggregate sum, without disclosing
    // sibling aggregate amounts to customers through their receipt paths.
    const liabilityCommitment = sha256(`aqua:liability-sum-commitment:v1|${tree.root}|${tree.total.toString()}`);
    const scopeManifestHash = sha256(canonicalJson({ asset: command.asset, scope: command.scope, cutoffAt: command.cutoffAt, expiresAt: command.expiresAt }));
    const reserveEvidenceCommitment = sha256(`aqua:reserve-evidence:v1|${command.reserveEvidenceReference}`);
    const coverageEvidenceCommitment = sha256(
      `aqua:coverage:v1|${id}|${liabilityCommitment}|${reserveTotal.toString()}|${scopeManifestHash}`,
    );
    const anchorPayload: AnchorPayload = {
      snapshotId: id,
      scopeManifestHash,
      liabilityCommitment,
      membershipRoot: tree.root,
      liabilityTotalBaseUnits: tree.total.toString(),
      reserveEvidenceCommitment,
      reserveTotalBaseUnits: reserveTotal.toString(),
      coverageEvidenceCommitment,
      expiresAt: command.expiresAt,
    };
    const anchor = this.anchorService.prepare(anchorPayload);
    const createdAt = new Date().toISOString();
    const issuerPublicKey = this.config.issuerSigner.publicKeyPem();
    const attesterPublicKey = this.config.attesterSigner.publicKeyPem();
    const issuerPayload = {
      snapshotId: id,
      proofSystemVersion: "aqua-merkle-receipt-v1+midnight-coverage-proof-v1+ed25519-evidence-v1",
      issuerId: command.issuerId,
      attesterId: command.attesterId,
      scopeManifestHash,
      liabilityCommitment,
      reserveEvidenceCommitment,
      coverageEvidenceCommitment,
      expiresAt: command.expiresAt,
      anchorCommitment: anchor.commitment,
      issuerPublicKey,
      attesterPublicKey,
    };
    const snapshot: ReserveSnapshot = {
      id,
      revision: 0,
      idempotencyKeyDigest,
      requestFingerprint,
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      proofSystemVersion: "aqua-merkle-receipt-v1+midnight-coverage-proof-v1+ed25519-evidence-v1",
      issuerId: command.issuerId,
      attesterId: command.attesterId,
      asset: command.asset,
      scope: command.scope,
      scopeManifestHash,
      cutoffAt: command.cutoffAt,
      expiresAt: command.expiresAt,
      createdAt,
      liabilityCommitment,
      membershipRoot: tree.root,
      reserveEvidenceCommitment,
      coverageEvidenceCommitment,
      issuerPublicKey,
      attesterPublicKey,
      liabilityTotalBaseUnits: tree.total.toString(),
      reserveTotalBaseUnits: reserveTotal.toString(),
      anchored: anchor,
      signatures: { issuer: this.config.issuerSigner.sign(issuerPayload), attester: null },
      lifecycleOperation: null,
      attestedAt: null,
      revokedAt: null,
      revokedBy: null,
      revocationReason: null,
      status: "PENDING_ATTESTATION",
    };

    const encryptedReceipts = new Map(
      leaves.map((leaf) => {
        const proof = tree.proofs.get(leaf.customerReference);
        if (!proof) throw new Error("Customer proof was not generated");
        const receipt: PrivateReceipt = {
          snapshotId: id,
          customerReference: leaf.customerReference,
          balanceBaseUnits: leaf.balanceBaseUnits.toString(),
          salt: leaf.salt,
          membershipRoot: tree.root,
          proof,
        };
        return [leaf.customerReference, seal(receipt, this.config.masterKey)] as const;
      }),
    );
    const created = await this.repository.create(snapshot, encryptedReceipts, this.event(snapshot.id, "CREATED", principal.id, { anchorMode: anchor.mode }));
    if (!created.created) return this.toPublic(await this.ensureDeployment(this.returnIdempotentSnapshot(created.snapshot, requestFingerprint)));
    return this.toPublic(await this.ensureDeployment(snapshot));
  }

  public async findByIdempotencyKey(principal: Principal, idempotencyKey: string): Promise<PublicSnapshot> {
    roleRequired(principal, "ISSUER");
    const digest = hmacSha256(this.config.masterKey, `aqua:publish-idempotency-key:v1|${principal.id}|${idempotencyKey}`);
    const snapshot = await this.repository.findByIdempotencyKey(digest);
    if (!snapshot || snapshot.issuerId !== principal.id) throw notFound("No snapshot exists for this issuer and Idempotency-Key");
    return this.toPublic(snapshot);
  }

  public async listPublic(limit: number, cursor: string | null): Promise<{ snapshots: PublicSnapshot[]; nextCursor: string | null }> {
    const page = await this.repository.listSnapshots({ limit, cursor, publicOnly: true });
    const snapshots: PublicSnapshot[] = [];
    for (const snapshot of page.snapshots) {
      snapshots.push(await this.authoritativePublicSnapshot(snapshot));
    }
    return { snapshots, nextCursor: page.nextCursor };
  }

  public async listForIssuer(principal: Principal, limit: number, cursor: string | null): Promise<{ snapshots: PublicSnapshot[]; nextCursor: string | null }> {
    roleRequired(principal, "ISSUER");
    const page = await this.repository.listSnapshots({ limit, cursor, issuerId: principal.id });
    return { snapshots: page.snapshots.map((snapshot) => this.toPublic(snapshot)), nextCursor: page.nextCursor };
  }

  public async listForAttester(principal: Principal, limit: number, cursor: string | null): Promise<{ snapshots: PublicSnapshot[]; nextCursor: string | null }> {
    roleRequired(principal, "ATTESTER");
    const page = await this.repository.listSnapshots({ limit, cursor, attesterId: principal.id });
    return { snapshots: page.snapshots.map((snapshot) => this.toPublic(snapshot)), nextCursor: page.nextCursor };
  }

  public async events(principal: Principal, snapshotId: string): Promise<SnapshotEvent[]> {
    const snapshot = await this.requireSnapshot(snapshotId);
    const authorisedIssuer = principal.roles.includes("ISSUER") && principal.id === snapshot.issuerId;
    const authorisedAttester = principal.roles.includes("ATTESTER") && principal.id === snapshot.attesterId;
    if (!authorisedIssuer && !authorisedAttester) throw forbidden("Only the assigned issuer or attester may view lifecycle events");
    return this.repository.listEvents(snapshotId);
  }

  public async attest(principal: Principal, snapshotId: string): Promise<PublicSnapshot> {
    roleRequired(principal, "ATTESTER");
    let snapshot = await this.requireSnapshot(snapshotId);
    if (principal.id !== snapshot.attesterId) throw forbidden("Only the assigned attester may attest this snapshot");
    if (snapshot.status !== "PENDING_ATTESTATION") throw invalidState("Only pending snapshots may be attested");
    if (this.currentStatus(snapshot) === "EXPIRED") throw invalidState("An expired snapshot cannot be attested");
    if (!this.hasValidIssuerSignature(snapshot)) throw invalidState("The issuer evidence signature is invalid");
    this.requireConfirmedDeployment(snapshot);
    if (snapshot.lifecycleOperation) throw invalidState("A Midnight lifecycle operation is already in progress or needs reconciliation");

    const startedAt = new Date().toISOString();
    snapshot = await this.claimLifecycle(
      snapshot,
      { kind: "ATTESTING", actorId: principal.id, startedAt, reason: null },
      this.event(snapshot.id, "ATTESTATION_STARTED", principal.id, {}),
    );
    const result = BigInt(snapshot.reserveTotalBaseUnits) >= BigInt(snapshot.liabilityTotalBaseUnits) ? "VERIFIED" : "SHORTFALL";
    try {
      const transaction = await this.anchorService.attest({
        snapshotId: snapshot.id,
        contractAddress: snapshot.anchored.contractAddress ?? "",
        attestedAt: startedAt,
      });
      const chainAttestedAt = new Date(Math.floor(Date.parse(startedAt) / 1_000) * 1_000).toISOString();
      return this.toPublic(await this.finalizeAttestation(snapshot, result, chainAttestedAt, principal.id, transaction.transactionId ?? "development"));
    } catch (error) {
      await this.markLifecycleUncertain(snapshot, "ATTEST_UNCERTAIN", "ATTESTATION_UNCERTAIN", principal.id);
      throw error;
    }
  }

  public async revoke(principal: Principal, snapshotId: string, reason: string): Promise<PublicSnapshot> {
    let snapshot = await this.requireSnapshot(snapshotId);
    const isIssuer = principal.roles.includes("ISSUER") && principal.id === snapshot.issuerId;
    if (!isIssuer) throw forbidden("Only the issuer may revoke a snapshot");
    if (snapshot.revokedAt) throw invalidState("A snapshot is already revoked");
    if (!reason.trim()) throw validation("A revocation reason is required");
    this.requireConfirmedDeployment(snapshot);
    if (snapshot.lifecycleOperation) throw invalidState("A Midnight lifecycle operation is already in progress or needs reconciliation");

    const startedAt = new Date().toISOString();
    snapshot = await this.claimLifecycle(
      snapshot,
      { kind: "REVOKING", actorId: principal.id, startedAt, reason },
      this.event(snapshot.id, "REVOCATION_STARTED", principal.id, {}),
    );
    try {
      const transaction = await this.anchorService.revoke({
        snapshotId: snapshot.id,
        contractAddress: snapshot.anchored.contractAddress ?? "",
        reason,
      });
      return this.toPublic(await this.finalizeRevocation(snapshot, reason, principal.id, transaction.recordedAt, transaction.transactionId ?? "development"));
    } catch (error) {
      await this.markLifecycleUncertain(snapshot, "REVOKE_UNCERTAIN", "REVOCATION_UNCERTAIN", principal.id);
      throw error;
    }
  }

  public async reconcile(principal: Principal, snapshotId: string, abandonDeployment: boolean): Promise<PublicSnapshot> {
    const snapshot = await this.requireSnapshot(snapshotId);
    if (!principal.roles.includes("ISSUER") || principal.id !== snapshot.issuerId) {
      throw forbidden("Only the snapshot issuer may reconcile its Midnight lifecycle");
    }
    if (!snapshot.anchored.contractAddress) {
      if (snapshot.anchored.status !== "DEPLOYING") return this.toPublic(snapshot);
      if (!abandonDeployment) {
        throw invalidState("The deployment has no recorded contract address; explicit abandonment is required after operator chain reconciliation");
      }
      return this.toPublic(
        await this.repository.update(
          {
            ...snapshot,
            anchored: { ...snapshot.anchored, status: "FAILED", failure: "MIDNIGHT_DEPLOYMENT_ABANDONED", recordedAt: new Date().toISOString() },
          },
          this.event(snapshot.id, "DEPLOYMENT_ABANDONED", principal.id, {}),
        ),
      );
    }

    const chain = await this.anchorService.read(snapshot.anchored.contractAddress);
    this.assertChainMatchesSnapshot(snapshot, chain);
    if (chain.status === "REVOKED") {
      const reason = snapshot.lifecycleOperation?.reason ?? snapshot.revocationReason;
      if (!reason) throw invalidState("The chain is revoked but the backend has no authorised revocation reason to reconcile");
      return this.toPublic(await this.finalizeRevocation(snapshot, reason, snapshot.lifecycleOperation?.actorId ?? principal.id, new Date().toISOString(), "reconciled-from-chain"));
    }
    if (chain.status === "VERIFIED" || chain.status === "SHORTFALL") {
      const recordedAt = chain.attestedAt || new Date().toISOString();
      return this.toPublic(await this.finalizeAttestation(snapshot, chain.status, recordedAt, snapshot.lifecycleOperation?.actorId ?? snapshot.attesterId, "reconciled-from-chain"));
    }
    if (snapshot.lifecycleOperation?.kind === "ATTESTING" || snapshot.lifecycleOperation?.kind === "REVOKING") {
      const staleAfterMs = 15 * 60 * 1_000;
      if (Date.now() - Date.parse(snapshot.lifecycleOperation.startedAt) < staleAfterMs) {
        throw invalidState("The lifecycle operation is still in progress; reconcile after its 15-minute safety window or when it is marked uncertain");
      }
    }
    if (snapshot.lifecycleOperation || snapshot.anchored.failure) {
      return this.toPublic(
        await this.repository.update(
          { ...snapshot, lifecycleOperation: null, anchored: { ...snapshot.anchored, failure: null, recordedAt: new Date().toISOString() } },
          this.event(snapshot.id, "CHAIN_RECONCILED", principal.id, { chainStatus: chain.status }),
        ),
      );
    }
    return this.toPublic(snapshot, chain.status);
  }

  public async publicSnapshot(snapshotId: string): Promise<PublicSnapshot> {
    const snapshot = await this.requireSnapshot(snapshotId);
    return this.authoritativePublicSnapshot(snapshot);
  }

  private async authoritativePublicSnapshot(snapshot: ReserveSnapshot): Promise<PublicSnapshot> {
    if (snapshot.anchored.mode === "DEVELOPMENT") return this.toPublic(snapshot);
    if (!snapshot.anchored.contractAddress || snapshot.anchored.status !== "CONFIRMED") return this.toPublic(snapshot, "UNAVAILABLE");
    try {
      const chain = await this.anchorService.read(snapshot.anchored.contractAddress);
      this.assertChainMatchesSnapshot(snapshot, chain);
      const chainStatus = Date.now() >= Date.parse(chain.expiresAt) ? "EXPIRED" : chain.status;
      return this.toPublic(snapshot, chainStatus);
    } catch {
      return this.toPublic(snapshot, "UNAVAILABLE");
    }
  }

  public async verifyCustomer(principal: Principal, snapshotId: string): Promise<CustomerVerification> {
    roleRequired(principal, "CUSTOMER");
    const snapshot = await this.requireSnapshot(snapshotId);
    const currentStatus = (await this.authoritativePublicSnapshot(snapshot)).status;
    const encryptedReceipt = await this.repository.getReceipt(snapshotId, this.customerReference(principal.id));
    if (!encryptedReceipt) {
      return { included: false, cryptographicallyValid: false, currentStatus, receipt: null };
    }
    let receipt: PrivateReceipt;
    try {
      receipt = open<PrivateReceipt>(encryptedReceipt, this.config.masterKey);
    } catch {
      return { included: false, cryptographicallyValid: false, currentStatus, receipt: null };
    }
    const cryptographicallyValid = verifyReceipt({
      customerReference: receipt.customerReference,
      balanceBaseUnits: BigInt(receipt.balanceBaseUnits),
      salt: receipt.salt,
      membershipRoot: receipt.membershipRoot,
      proof: receipt.proof,
    });
    return { included: cryptographicallyValid, cryptographicallyValid, currentStatus, receipt };
  }

  private validateCreateCommand(command: CreateSnapshotCommand): void {
    if (command.asset.decimals < 0 || command.asset.decimals > 18) throw validation("Asset decimals must be between 0 and 18");
    if (!/^[A-Z0-9][A-Z0-9._-]{1,19}$/.test(command.asset.code)) throw validation("Asset code is invalid");
    if (!isIsoTimestamp(command.cutoffAt) || !isIsoTimestamp(command.expiresAt)) throw validation("Snapshot timestamps must be valid ISO timestamps");
    if (Date.parse(command.expiresAt) <= Date.parse(command.cutoffAt)) throw validation("Snapshot expiry must be after its cutoff");
    if (command.liabilities.length === 0 || command.liabilities.length > 100_000) throw validation("Snapshot liability count must be between 1 and 100000");
    if (!command.scope.liabilityDefinition || !command.scope.limitations) throw validation("Scope definition and limitations are required");
  }

  private fingerprintableCommand(command: CreateSnapshotCommand): Omit<CreateSnapshotCommand, "idempotencyKey"> {
    const { idempotencyKey: _idempotencyKey, ...fingerprintable } = command;
    return fingerprintable;
  }

  private deterministicSnapshotId(idempotencyKeyDigest: string, requestFingerprint: string): string {
    const digest = sha256(`aqua:snapshot-id:v1|${idempotencyKeyDigest}|${requestFingerprint}`);
    const version = "5";
    const variant = ((Number.parseInt(digest.charAt(16), 16) & 0b0011) | 0b1000).toString(16);
    return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${version}${digest.slice(13, 16)}-${variant}${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  }

  private returnIdempotentSnapshot(snapshot: ReserveSnapshot, requestFingerprint: string): ReserveSnapshot {
    if (snapshot.requestFingerprint !== requestFingerprint) {
      throw conflict("This Idempotency-Key was already used with a different snapshot request");
    }
    return snapshot;
  }

  private customerReference(customerId: string): string {
    return hmacSha256(this.config.customerReferenceKey, `aqua:customer-reference:v1|${customerId}`);
  }

  private issuerPayload(snapshot: ReserveSnapshot): Record<string, string> {
    return {
      snapshotId: snapshot.id,
      proofSystemVersion: snapshot.proofSystemVersion,
      issuerId: snapshot.issuerId,
      attesterId: snapshot.attesterId,
      scopeManifestHash: snapshot.scopeManifestHash,
      liabilityCommitment: snapshot.liabilityCommitment,
      reserveEvidenceCommitment: snapshot.reserveEvidenceCommitment,
      coverageEvidenceCommitment: snapshot.coverageEvidenceCommitment,
      expiresAt: snapshot.expiresAt,
      anchorCommitment: snapshot.anchored.commitment,
      issuerPublicKey: snapshot.issuerPublicKey,
      attesterPublicKey: snapshot.attesterPublicKey,
    };
  }

  private attesterPayload(snapshot: ReserveSnapshot): Record<string, string> {
    return { ...this.issuerPayload(snapshot), result: snapshot.status, attestedAt: snapshot.attestedAt ?? "" };
  }

  private hasValidIssuerSignature(snapshot: ReserveSnapshot): boolean {
    return this.config.issuerSigner.verify(this.issuerPayload(snapshot), snapshot.signatures.issuer);
  }

  private currentStatus(snapshot: ReserveSnapshot): PublicSnapshot["status"] {
    if (snapshot.anchored.mode === "MIDNIGHT_PREPROD" && snapshot.anchored.status !== "CONFIRMED") return "UNAVAILABLE";
    if (snapshot.revokedAt) return "REVOKED";
    if (Date.now() >= Date.parse(snapshot.expiresAt)) return "EXPIRED";
    if (!this.hasValidIssuerSignature(snapshot)) return "INVALID";
    if (snapshot.signatures.attester && !this.config.attesterSigner.verify(this.attesterPayload(snapshot), snapshot.signatures.attester)) return "INVALID";
    return snapshot.status;
  }

  private toPublic(snapshot: ReserveSnapshot, authoritativeStatus?: PublicSnapshot["status"]): PublicSnapshot {
    return {
      id: snapshot.id,
      schemaVersion: snapshot.schemaVersion,
      proofSystemVersion: snapshot.proofSystemVersion,
      issuerId: snapshot.issuerId,
      attesterId: snapshot.attesterId,
      asset: snapshot.asset,
      scope: snapshot.scope,
      scopeManifestHash: snapshot.scopeManifestHash,
      cutoffAt: snapshot.cutoffAt,
      expiresAt: snapshot.expiresAt,
      createdAt: snapshot.createdAt,
      liabilityCommitment: snapshot.liabilityCommitment,
      membershipRoot: snapshot.membershipRoot,
      reserveEvidenceCommitment: snapshot.reserveEvidenceCommitment,
      coverageEvidenceCommitment: snapshot.coverageEvidenceCommitment,
      issuerPublicKey: snapshot.issuerPublicKey,
      attesterPublicKey: snapshot.attesterPublicKey,
      anchor: snapshot.anchored,
      issuerSignature: snapshot.signatures.issuer,
      attesterSignature: snapshot.signatures.attester,
      attestedAt: snapshot.attestedAt,
      revokedAt: snapshot.revokedAt,
      revocationReason: snapshot.revocationReason,
      status: authoritativeStatus ?? this.currentStatus(snapshot),
    };
  }

  private async claimLifecycle(
    snapshot: ReserveSnapshot,
    operation: NonNullable<ReserveSnapshot["lifecycleOperation"]>,
    event: SnapshotEvent,
  ): Promise<ReserveSnapshot> {
    try {
      return await this.repository.update({ ...snapshot, lifecycleOperation: operation }, event);
    } catch (error) {
      if (error instanceof SnapshotRevisionConflictError) {
        throw invalidState("A Midnight lifecycle operation is already in progress or needs reconciliation");
      }
      throw error;
    }
  }

  private async markLifecycleUncertain(
    snapshot: ReserveSnapshot,
    kind: "ATTEST_UNCERTAIN" | "REVOKE_UNCERTAIN",
    eventType: Extract<SnapshotEvent["type"], "ATTESTATION_UNCERTAIN" | "REVOCATION_UNCERTAIN">,
    actorId: string,
  ): Promise<void> {
    const current = await this.requireSnapshot(snapshot.id);
    if (!current.lifecycleOperation) return;
    await this.repository.update(
      { ...current, lifecycleOperation: { ...current.lifecycleOperation, kind } },
      this.event(current.id, eventType, actorId, {}),
    );
  }

  private async finalizeAttestation(
    snapshot: ReserveSnapshot,
    result: Extract<ReserveSnapshot["status"], "VERIFIED" | "SHORTFALL">,
    attestedAt: string,
    actorId: string,
    transactionId: string,
  ): Promise<ReserveSnapshot> {
    const next = { ...snapshot, status: result, attestedAt, lifecycleOperation: null };
    next.signatures = { ...next.signatures, attester: this.config.attesterSigner.sign(this.attesterPayload(next)) };
    return this.repository.update(next, this.event(next.id, "ATTESTED", actorId, { result, transactionId }));
  }

  private async finalizeRevocation(
    snapshot: ReserveSnapshot,
    reason: string,
    actorId: string,
    revokedAt: string,
    transactionId: string,
  ): Promise<ReserveSnapshot> {
    return this.repository.update(
      { ...snapshot, revokedAt, revokedBy: actorId, revocationReason: reason, lifecycleOperation: null },
      this.event(snapshot.id, "REVOKED", actorId, { transactionId }),
    );
  }

  private anchorPayload(snapshot: ReserveSnapshot): AnchorPayload {
    return {
      snapshotId: snapshot.id,
      scopeManifestHash: snapshot.scopeManifestHash,
      liabilityCommitment: snapshot.liabilityCommitment,
      membershipRoot: snapshot.membershipRoot,
      liabilityTotalBaseUnits: snapshot.liabilityTotalBaseUnits,
      reserveEvidenceCommitment: snapshot.reserveEvidenceCommitment,
      reserveTotalBaseUnits: snapshot.reserveTotalBaseUnits,
      coverageEvidenceCommitment: snapshot.coverageEvidenceCommitment,
      expiresAt: snapshot.expiresAt,
    };
  }

  private async ensureDeployment(snapshot: ReserveSnapshot): Promise<ReserveSnapshot> {
    if (snapshot.anchored.status === "CONFIRMED") return snapshot;
    if (snapshot.anchored.status === "FAILED") {
      throw invalidState("This snapshot deployment was abandoned; publish a new snapshot with a new Idempotency-Key");
    }
    if (snapshot.anchored.status === "DEPLOYING") {
      throw invalidState("Midnight deployment is already in progress or needs operator reconciliation");
    }

    let deploying: ReserveSnapshot;
    try {
      deploying = await this.repository.update(
        {
          ...snapshot,
          anchored: {
            ...snapshot.anchored,
            status: "DEPLOYING",
            failure: null,
            recordedAt: new Date().toISOString(),
          },
        },
        this.event(snapshot.id, "DEPLOYMENT_STARTED", snapshot.issuerId, {}),
      );
    } catch (error) {
      if (error instanceof SnapshotRevisionConflictError) {
        const current = await this.requireSnapshot(snapshot.id);
        if (current.anchored.status === "CONFIRMED") return current;
        if (current.anchored.status === "DEPLOYING") {
          throw invalidState("Midnight deployment is already in progress or needs operator reconciliation");
        }
      }
      throw error;
    }

    let anchored;
    try {
      anchored = await this.anchorService.deploy(this.anchorPayload(deploying));
    } catch (error) {
      // Network errors can occur after submission. Retain the deployment claim and
      // require reconciliation instead of risking a duplicate contract deployment.
      await this.repository.update(
        {
          ...deploying,
          anchored: {
            ...deploying.anchored,
            failure: "MIDNIGHT_DEPLOYMENT_UNCERTAIN",
            recordedAt: new Date().toISOString(),
          },
        },
        this.event(deploying.id, "DEPLOYMENT_UNCERTAIN", deploying.issuerId, {}),
      );
      throw error;
    }

    // If this write fails after successful submission, DEPLOYING remains durable
    // and prevents an automatic duplicate deployment.
    return this.repository.update(
      { ...deploying, anchored },
      this.event(deploying.id, "DEPLOYED", deploying.issuerId, { transactionId: anchored.transactionId ?? "development" }),
    );
  }

  private requireConfirmedDeployment(snapshot: ReserveSnapshot): void {
    if (snapshot.anchored.status !== "CONFIRMED") throw invalidState("The Midnight deployment is not confirmed");
    if (snapshot.anchored.mode === "MIDNIGHT_PREPROD" && !snapshot.anchored.contractAddress) {
      throw invalidState("The Midnight deployment has no contract address");
    }
  }

  private assertChainMatchesSnapshot(snapshot: ReserveSnapshot, chain: import("../domain/types.js").ChainState): void {
    const expectedSnapshotIdentifier = sha256(`aqua:snapshot-id:v1|${snapshot.id}`);
    // Compact stores the expiry as whole Unix seconds, while the API accepts
    // ISO timestamps with milliseconds. Compare the exact value committed to
    // the contract rather than the higher-precision source representation.
    const expectedExpiresAt = new Date(Math.floor(Date.parse(snapshot.expiresAt) / 1_000) * 1_000).toISOString();
    const revocationReason = snapshot.lifecycleOperation?.reason ?? snapshot.revocationReason;
    const expectedRevocationReasonHash = revocationReason
      ? sha256(`aqua:revocation-reason:v1|${revocationReason}`)
      : null;
    if (
      chain.snapshotIdentifier !== expectedSnapshotIdentifier ||
      chain.scopeManifestHash !== snapshot.scopeManifestHash ||
      chain.liabilityCommitment !== snapshot.liabilityCommitment ||
      chain.membershipRoot !== snapshot.membershipRoot ||
      chain.reserveEvidenceCommitment !== snapshot.reserveEvidenceCommitment ||
      chain.coverageEvidenceCommitment !== snapshot.coverageEvidenceCommitment ||
      chain.liabilityEvidenceCommitment !== snapshot.anchored.proofCommitments?.liabilityEvidenceCommitment ||
      chain.reserveTotalCommitment !== snapshot.anchored.proofCommitments?.reserveTotalCommitment ||
      chain.expiresAt !== expectedExpiresAt ||
      (chain.status === "REVOKED" && expectedRevocationReasonHash !== null && chain.revocationReasonHash !== expectedRevocationReasonHash)
    ) {
      throw new Error("Midnight public state does not match the stored snapshot commitments");
    }
  }

  private async requireSnapshot(snapshotId: string): Promise<ReserveSnapshot> {
    const snapshot = await this.repository.findById(snapshotId);
    if (!snapshot) throw notFound("Snapshot not found");
    return snapshot;
  }

  private event(snapshotId: string, type: SnapshotEvent["type"], actorId: string, metadata: Record<string, string>): SnapshotEvent {
    return { id: randomUUID(), snapshotId, type, actorId, occurredAt: new Date().toISOString(), metadata };
  }
}
