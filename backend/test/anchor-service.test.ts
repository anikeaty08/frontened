import { afterEach, describe, expect, it, vi } from "vitest";
import { MidnightTestnetAnchorService } from "../src/services/anchor-service.js";

const payload = {
  snapshotId: "e51e14e4-38bf-537f-9074-3ffa2b7b249f",
  idempotencyKey: "f".repeat(64),
  scopeManifestHash: "a".repeat(64),
  liabilityCommitment: "b".repeat(64),
  reserveEvidenceCommitment: "c".repeat(64),
  coverageEvidenceCommitment: "d".repeat(64),
  expiresAt: "2030-08-08T12:00:00.000Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("Midnight testnet anchor adapter", () => {
  it("binds a submission and response to the configured contract address", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        transactionId: "midnight-tx-123",
        contractAddress: "midnight-contract-abc",
        commitment: "e".repeat(64),
        recordedAt: "2026-08-09T00:00:00.000Z",
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    const anchor = await new MidnightTestnetAnchorService("https://anchor.example/v1/anchors", "midnight-contract-abc").anchor(payload);
    expect(anchor).toMatchObject({ mode: "MIDNIGHT_TESTNET", contractAddress: "midnight-contract-abc", transactionId: "midnight-tx-123" });
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({ ...payload, contractAddress: "midnight-contract-abc" });
  });

  it("rejects a response from a different contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      transactionId: "midnight-tx-123",
      contractAddress: "wrong-contract",
      commitment: "e".repeat(64),
      recordedAt: "2026-08-09T00:00:00.000Z",
    }), { status: 200 })));
    await expect(new MidnightTestnetAnchorService("https://anchor.example/v1/anchors", "midnight-contract-abc").anchor(payload)).rejects.toThrow(
      "Midnight anchor response is malformed",
    );
  });
});
