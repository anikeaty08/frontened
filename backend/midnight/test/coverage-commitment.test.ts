import { describe, expect, it } from "vitest";
import { totalEvidenceCommitment } from "../src/contract.js";

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
});
