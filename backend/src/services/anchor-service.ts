import type { AnchorRecord } from "../domain/types.js";
import { sha256 } from "../crypto/hash.js";

export interface AnchorPayload {
  snapshotId: string;
  idempotencyKey: string;
  scopeManifestHash: string;
  liabilityCommitment: string;
  reserveEvidenceCommitment: string;
  coverageEvidenceCommitment: string;
  expiresAt: string;
}

export interface AnchorService {
  anchor(payload: AnchorPayload): Promise<AnchorRecord>;
}

export class DevelopmentAnchorService implements AnchorService {
  public async anchor(payload: AnchorPayload): Promise<AnchorRecord> {
    return {
      mode: "DEVELOPMENT",
      contractAddress: null,
      commitment: sha256(`aqua:anchor:v1|${JSON.stringify(payload)}`),
      transactionId: null,
      recordedAt: new Date().toISOString(),
    };
  }
}

export class MidnightTestnetAnchorService implements AnchorService {
  public constructor(
    private readonly submitUrl: string,
    private readonly contractAddress: string,
  ) {}

  public async anchor(payload: AnchorPayload): Promise<AnchorRecord> {
    const response = await fetch(this.submitUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, contractAddress: this.contractAddress }),
    });
    if (!response.ok) {
      throw new Error(`Midnight anchor submission failed with ${response.status}`);
    }
    const data = (await response.json()) as { transactionId?: unknown; commitment?: unknown; recordedAt?: unknown; contractAddress?: unknown };
    if (
      typeof data.transactionId !== "string" ||
      typeof data.commitment !== "string" ||
      typeof data.recordedAt !== "string" ||
      data.contractAddress !== this.contractAddress
    ) {
      throw new Error("Midnight anchor response is malformed");
    }
    return {
      mode: "MIDNIGHT_TESTNET",
      contractAddress: this.contractAddress,
      commitment: data.commitment,
      transactionId: data.transactionId,
      recordedAt: data.recordedAt,
    };
  }
}
