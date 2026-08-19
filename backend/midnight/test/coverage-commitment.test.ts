import { describe, expect, it } from "vitest";
import { totalEvidenceCommitment } from "../src/contract.js";
import { lifecycleCommitment } from "../src/cli.js";

const bytes = (value: number): Uint8Array => new Uint8Array(32).fill(value);

describe("Aqua Reserve coverage commitments", () => {
  it("binds both the public evidence identifier and the private total", () => {
    const opening = bytes(3);
    const commitment = totalEvidenceCommitment(bytes(1), 9_000_000n, opening);

    expect(totalEvidenceCommitment(bytes(1), 9_000_000n, opening)).toEqual(commitment);
    expect(totalEvidenceCommitment(bytes(1), 9_000_001n, opening)).not.toEqual(commitment);
    expect(totalEvidenceCommitment(bytes(2), 9_000_000n, opening)).not.toEqual(commitment);
    expect(totalEvidenceCommitment(bytes(1), 9_000_000n, bytes(4))).not.toEqual(commitment);
  });

  it("binds the lifecycle commitment to the membership root", () => {
    const payload = {
      snapshotId: "e51e14e4-38bf-537f-9074-3ffa2b7b249f",
      scopeManifestHash: "a".repeat(64),
      liabilityCommitment: "b".repeat(64),
      membershipRoot: "c".repeat(64),
      liabilityTotalBaseUnits: "3000000",
      reserveEvidenceCommitment: "d".repeat(64),
      reserveTotalBaseUnits: "4000000",
      coverageEvidenceCommitment: "e".repeat(64),
      expiresAt: "2030-08-08T12:00:00.000Z",
    };

    expect(lifecycleCommitment({ ...payload, membershipRoot: "f".repeat(64) })).not.toEqual(lifecycleCommitment(payload));
  });
});
