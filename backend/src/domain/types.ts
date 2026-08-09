export const SNAPSHOT_SCHEMA_VERSION = "1.0";

export type Role = "ISSUER" | "ATTESTER" | "CUSTOMER";
export type SnapshotStatus =
  | "PENDING_ATTESTATION"
  | "VERIFIED"
  | "SHORTFALL"
  | "EXPIRED"
  | "REVOKED"
  | "INVALID"
  | "UNAVAILABLE";

export interface Principal {
  id: string;
  roles: Role[];
}

export interface ScopeDeclaration {
  liabilityDefinition: string;
  includedCategories: string[];
  excludedCategories: string[];
  limitations: string;
}

export interface Asset {
  code: string;
  decimals: number;
}

export interface MerkleProofStep {
  siblingHash: string;
  siblingPosition: "LEFT" | "RIGHT";
}

export interface PrivateReceipt {
  snapshotId: string;
  customerReference: string;
  balanceBaseUnits: string;
  salt: string;
  membershipRoot: string;
  proof: MerkleProofStep[];
}

export interface EncryptedReceipt {
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface AnchorRecord {
  mode: "DEVELOPMENT" | "MIDNIGHT_TESTNET";
  contractAddress: string | null;
  commitment: string;
  transactionId: string | null;
  recordedAt: string;
}

export interface SnapshotSignatures {
  issuer: string;
  attester: string | null;
}

export interface ReserveSnapshot {
  id: string;
  /** Internal-only HMAC digests. They are intentionally omitted from PublicSnapshot. */
  idempotencyKeyDigest: string;
  requestFingerprint: string;
  schemaVersion: string;
  proofSystemVersion: string;
  issuerId: string;
  attesterId: string;
  asset: Asset;
  scope: ScopeDeclaration;
  scopeManifestHash: string;
  cutoffAt: string;
  expiresAt: string;
  createdAt: string;
  liabilityCommitment: string;
  membershipRoot: string;
  reserveEvidenceCommitment: string;
  coverageEvidenceCommitment: string;
  issuerPublicKey: string;
  attesterPublicKey: string;
  liabilityTotalBaseUnits: string;
  reserveTotalBaseUnits: string;
  anchored: AnchorRecord;
  signatures: SnapshotSignatures;
  attestedAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  revocationReason: string | null;
  status: Exclude<SnapshotStatus, "EXPIRED" | "REVOKED" | "INVALID" | "UNAVAILABLE">;
}

export interface PublicSnapshot {
  id: string;
  schemaVersion: string;
  proofSystemVersion: string;
  issuerId: string;
  attesterId: string;
  asset: Asset;
  scope: ScopeDeclaration;
  scopeManifestHash: string;
  cutoffAt: string;
  expiresAt: string;
  createdAt: string;
  liabilityCommitment: string;
  membershipRoot: string;
  reserveEvidenceCommitment: string;
  coverageEvidenceCommitment: string;
  issuerPublicKey: string;
  attesterPublicKey: string;
  anchor: AnchorRecord;
  issuerSignature: string;
  attesterSignature: string | null;
  attestedAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  status: SnapshotStatus;
}

export interface SnapshotEvent {
  id: string;
  snapshotId: string;
  type: "CREATED" | "ATTESTED" | "REVOKED";
  actorId: string;
  occurredAt: string;
  metadata: Record<string, string>;
}

export interface StoredSnapshot {
  snapshot: ReserveSnapshot;
  receipts: Map<string, EncryptedReceipt>;
  events: SnapshotEvent[];
}
