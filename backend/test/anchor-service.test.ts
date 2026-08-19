import { describe, expect, it } from "vitest";
import {
  MidnightDirectAnchorService,
  lifecycleCommitment,
  type LifecycleRunner,
} from "../src/services/anchor-service.js";
import { lifecycleCommitment as workerLifecycleCommitment } from "../midnight/src/cli.js";

const payload = {
  snapshotId: "e51e14e4-38bf-537f-9074-3ffa2b7b249f",
  scopeManifestHash: "a".repeat(64),
  liabilityCommitment: "b".repeat(64),
  membershipRoot: "c".repeat(64),
  liabilityTotalBaseUnits: "3000000",
  reserveEvidenceCommitment: "c".repeat(64),
  reserveTotalBaseUnits: "4000000",
  coverageEvidenceCommitment: "d".repeat(64),
  expiresAt: "2030-08-08T12:00:00.000Z",
};

const runner = (response: Record<string, string>): LifecycleRunner => ({
  run: async () => response,
});

describe("Midnight direct lifecycle adapter", () => {
  it("uses the same lifecycle commitment as the Midnight worker", () => {
    expect(workerLifecycleCommitment(payload)).toBe(lifecycleCommitment(payload));
  });

  it("binds a deployment response to the exact snapshot commitments", async () => {
    const service = new MidnightDirectAnchorService(runner({
      operation: "DEPLOYED",
      contractAddress: "midnight-contract-abc",
      transactionId: "midnight-tx-123",
      recordedAt: "2026-08-09T00:00:00.000Z",
      commitment: lifecycleCommitment(payload),
      liabilityEvidenceCommitment: "e".repeat(64),
      reserveTotalCommitment: "f".repeat(64),
    }));

    expect(service.prepare(payload)).toMatchObject({ mode: "MIDNIGHT_PREPROD", status: "PENDING", contractAddress: null });
    await expect(service.deploy(payload)).resolves.toMatchObject({
      mode: "MIDNIGHT_PREPROD",
      status: "CONFIRMED",
      contractAddress: "midnight-contract-abc",
      transactionId: "midnight-tx-123",
    });
  });

  it("rejects a deployment response that is not bound to the submitted snapshot", async () => {
    const service = new MidnightDirectAnchorService(runner({
      operation: "DEPLOYED",
      contractAddress: "midnight-contract-abc",
      transactionId: "midnight-tx-123",
      recordedAt: "2026-08-09T00:00:00.000Z",
      commitment: "e".repeat(64),
    }));

    await expect(service.deploy(payload)).rejects.toThrow("Midnight deploy commitment did not bind the submitted snapshot");
  });

  it("accepts an empty attestation timestamp for a pending contract", async () => {
    const service = new MidnightDirectAnchorService(runner({
      operation: "INSPECTED",
      contractAddress: "midnight-contract-pending",
      status: "PENDING_ATTESTATION",
      snapshotIdentifier: "a",
      scopeManifestHash: "b",
      liabilityCommitment: "c",
      membershipRoot: "d",
      reserveEvidenceCommitment: "e",
      coverageEvidenceCommitment: "f",
      liabilityEvidenceCommitment: "g",
      reserveTotalCommitment: "h",
      expiresAt: "2030-01-01T00:00:00.000Z",
      attestedAt: "",
      revocationReasonHash: "i",
    }));
    await expect(service.read("midnight-contract-pending")).resolves.toMatchObject({ status: "PENDING_ATTESTATION", attestedAt: "" });
  });
});
