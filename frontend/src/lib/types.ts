export type SnapshotStatus =
  | "PENDING_ATTESTATION"
  | "VERIFIED"
  | "SHORTFALL"
  | "EXPIRED"
  | "REVOKED"
  | "INVALID"
  | "UNAVAILABLE";

export type Role = "ISSUER" | "ATTESTER" | "CUSTOMER";

export interface PublicSnapshot {
  id: string;
  schemaVersion: string;
  proofSystemVersion: string;
  issuerId: string;
  attesterId: string;
  asset: { code: string; decimals: number };
  scope: {
    liabilityDefinition: string;
    includedCategories: string[];
    excludedCategories: string[];
    limitations: string;
  };
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
  anchor: {
    mode: "DEVELOPMENT" | "MIDNIGHT_PREPROD";
    status: "PENDING" | "DEPLOYING" | "CONFIRMED" | "FAILED";
    contractAddress: string | null;
    commitment: string;
    transactionId: string | null;
    recordedAt: string;
    failure: string | null;
    proofCommitments: {
      liabilityEvidenceCommitment: string;
      reserveTotalCommitment: string;
    } | null;
  };
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
  type: string;
  actorId: string;
  occurredAt: string;
  metadata: Record<string, string>;
}

export interface PrivateReceipt {
  snapshotId: string;
  customerReference: string;
  balanceBaseUnits: string;
  salt: string;
  membershipRoot: string;
  proof: Array<{ siblingHash: string; siblingPosition: "LEFT" | "RIGHT" }>;
}

export interface CustomerVerification {
  included: boolean;
  cryptographicallyValid: boolean;
  currentStatus: SnapshotStatus;
  receipt: PrivateReceipt | null;
}

export interface SnapshotListResponse {
  snapshots: PublicSnapshot[];
  nextCursor: string | null;
}

export interface ApiErrorBody {
  error?: { code?: string; message?: string };
}
