import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compactHash, snapshotFreshness } from "./api.ts";

describe("public snapshot presentation", () => {
  it("distinguishes current, expired, revoked, and unavailable evidence", () => {
    const now = new Date("2030-01-01T00:00:00.000Z");

    assert.equal(
      snapshotFreshness("VERIFIED", "2030-01-02T00:00:00.000Z", now).tone,
      "current",
    );
    assert.equal(
      snapshotFreshness("VERIFIED", "2029-12-31T00:00:00.000Z", now).tone,
      "warning",
    );
    assert.deepEqual(
      snapshotFreshness("REVOKED", "2030-01-02T00:00:00.000Z", now),
      { label: "Revoked", tone: "warning" },
    );
    assert.deepEqual(
      snapshotFreshness("UNAVAILABLE", "2030-01-02T00:00:00.000Z", now),
      { label: "Unavailable", tone: "unavailable" },
    );
    assert.deepEqual(snapshotFreshness("VERIFIED", "invalid", now), {
      label: "Unavailable",
      tone: "unavailable",
    });
  });

  it("renders only a compact fingerprint for public cryptographic material", () => {
    assert.equal(compactHash("a".repeat(64), 8), "aaaaaaaa...aaaaaaaa");
    assert.equal(compactHash(null), "Not available");
  });
});
