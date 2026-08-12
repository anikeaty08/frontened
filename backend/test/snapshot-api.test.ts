import { afterEach, describe, expect, it } from "vitest";
import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { loadConfig } from "../src/config.js";
import { canonicalJson } from "../src/crypto/hash.js";
import { verifyReceipt } from "../src/crypto/merkle.js";
import { buildApp } from "../src/http/app.js";
import { InMemorySnapshotRepository } from "../src/persistence/snapshot-repository.js";
import { DevelopmentAnchorService, lifecycleCommitment, type AnchorService } from "../src/services/anchor-service.js";

let idempotencySequence = 0;
const issuerHeaders = {
  authorization: "Bearer issuer-demo-token",
  get "idempotency-key"() {
    return `test-idempotency-${String(++idempotencySequence).padStart(8, "0")}`;
  },
};
const attesterHeaders = { authorization: "Bearer attester-demo-token" };
const customerHeaders = (number: number) => ({ authorization: `Bearer customer-demo-token-${String(number).padStart(3, "0")}` });

const snapshotBody = (overrides: Record<string, unknown> = {}) => ({
  issuerId: "issuer-demo",
  attesterId: "attester-demo",
  asset: { code: "DUSD", decimals: 6 },
  scope: {
    liabilityDefinition: "Synthetic customer balances held by the demo custodian in DUSD.",
    includedCategories: ["customer spot balances"],
    excludedCategories: ["margin balances", "corporate treasury"],
    limitations: "This is a synthetic point-in-time Phase 1 demonstration. It is not a financial audit.",
  },
  cutoffAt: "2026-08-08T12:00:00.000Z",
  expiresAt: "2030-08-08T12:00:00.000Z",
  reserveTotalBaseUnits: "9000000",
  reserveEvidenceReference: "demo-reserve-evidence-reference-2026-08-08",
  liabilities: [
    { customerId: "customer-001", balanceBaseUnits: "1000000" },
    { customerId: "customer-002", balanceBaseUnits: "2000000" },
    { customerId: "customer-003", balanceBaseUnits: "3000000" },
  ],
  ...overrides,
});

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
const makeApp = async () => {
  const config = loadConfig("test");
  config.webOrigin = "http://localhost:3001";
  const app = await buildApp({
    config,
    repository: new InMemorySnapshotRepository(),
    anchorService: new DevelopmentAnchorService(),
  });
  apps.push(app);
  return app;
};

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("Aqua Reserve Phase 1 API", () => {
  it("uses the direct lifecycle for deployment, attestation, revocation, and public state", async () => {
    const calls: string[] = [];
    let deployedPayload: Parameters<AnchorService["deploy"]>[0] | undefined;
    const direct: AnchorService = {
      prepare: (payload) => ({
        mode: "MIDNIGHT_PREPROD",
        status: "PENDING",
        contractAddress: null,
        commitment: lifecycleCommitment(payload),
        transactionId: null,
        recordedAt: "2026-08-09T00:00:00.000Z",
        failure: null,
        proofCommitments: null,
      }),
      deploy: async (payload) => {
        calls.push("deploy");
        deployedPayload = payload;
        return {
          mode: "MIDNIGHT_PREPROD",
          status: "CONFIRMED",
          contractAddress: "midnight-contract-abc",
          commitment: lifecycleCommitment(payload),
          transactionId: "deploy-tx-123",
          recordedAt: "2026-08-09T00:00:01.000Z",
          failure: null,
          proofCommitments: {
            liabilityEvidenceCommitment: "d".repeat(64),
            reserveTotalCommitment: "e".repeat(64),
          },
        };
      },
      attest: async () => {
        calls.push("attest");
        return { transactionId: "attest-tx-123", recordedAt: "2026-08-09T00:00:02.000Z" };
      },
      revoke: async () => {
        calls.push("revoke");
        return { transactionId: "revoke-tx-123", recordedAt: "2026-08-09T00:00:03.000Z" };
      },
      read: async () => {
        calls.push("read");
        if (!deployedPayload) {
          throw new Error("The test lifecycle was not deployed.");
        }
        return {
          contractAddress: "midnight-contract-abc",
          status: "REVOKED",
          snapshotIdentifier: createHash("sha256")
            .update(`aqua:snapshot-id:v1|${deployedPayload.snapshotId}`)
            .digest("hex"),
          scopeManifestHash: deployedPayload.scopeManifestHash,
          liabilityCommitment: deployedPayload.liabilityCommitment,
          membershipRoot: deployedPayload.membershipRoot,
          reserveEvidenceCommitment: deployedPayload.reserveEvidenceCommitment,
          coverageEvidenceCommitment: deployedPayload.coverageEvidenceCommitment,
          liabilityEvidenceCommitment: "d".repeat(64),
          reserveTotalCommitment: "e".repeat(64),
          expiresAt: new Date(Math.floor(Date.parse(deployedPayload.expiresAt) / 1_000) * 1_000).toISOString(),
          attestedAt: "2026-08-09T00:00:02.000Z",
          revocationReasonHash: createHash("sha256")
            .update("aqua:revocation-reason:v1|Synthetic reserve evidence was intentionally replaced for this lifecycle test.")
            .digest("hex"),
        };
      },
    };
    const config = loadConfig("test");
    const app = await buildApp({ config, repository: new InMemorySnapshotRepository(), anchorService: direct });
    apps.push(app);
    const created = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers: issuerHeaders,
      payload: snapshotBody({ expiresAt: "2030-08-08T12:00:00.431Z" }),
    });
    const snapshotId = created.json<{ snapshot: { id: string; anchor: { contractAddress: string } } }>().snapshot.id;
    expect(created.json<{ snapshot: { anchor: { contractAddress: string } } }>().snapshot.anchor.contractAddress).toBe("midnight-contract-abc");
    await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders });
    await app.inject({
      method: "POST",
      url: `/v1/snapshots/${snapshotId}/revoke`,
      headers: issuerHeaders,
      payload: { reason: "Synthetic reserve evidence was intentionally replaced for this lifecycle test." },
    });
    const publicView = await app.inject({ method: "GET", url: `/v1/public/snapshots/${snapshotId}` });
    expect(publicView.statusCode).toBe(200);
    expect(publicView.json<{ snapshot: { status: string } }>().snapshot.status).toBe("REVOKED");
    const publicList = await app.inject({ method: "GET", url: "/v1/public/snapshots?limit=10" });
    expect(publicList.json<{ snapshots: Array<{ status: string }> }>().snapshots[0]?.status).toBe("REVOKED");
    const customerView = await app.inject({
      method: "GET",
      url: `/v1/customer/snapshots/${snapshotId}/verification`,
      headers: customerHeaders(1),
    });
    expect(customerView.json<{ verification: { currentStatus: string } }>().verification.currentStatus).toBe("REVOKED");
    expect(calls).toEqual(["deploy", "attest", "revoke", "read", "read", "read"]);
  });

  it("claims a direct deployment before the chain call so retries cannot deploy twice", async () => {
    let releaseDeployment: (() => void) | undefined;
    const deploymentStarted = new Promise<void>((resolve) => {
      releaseDeployment = resolve;
    });
    let deploymentCount = 0;
    const direct: AnchorService = {
      prepare: (payload) => ({
        mode: "MIDNIGHT_PREPROD",
        status: "PENDING",
        contractAddress: null,
        commitment: lifecycleCommitment(payload),
        transactionId: null,
        recordedAt: "2026-08-09T00:00:00.000Z",
        failure: null,
        proofCommitments: null,
      }),
      deploy: async (payload) => {
        deploymentCount += 1;
        await deploymentStarted;
        return {
          mode: "MIDNIGHT_PREPROD",
          status: "CONFIRMED",
          contractAddress: "midnight-contract-race-safe",
          commitment: lifecycleCommitment(payload),
          transactionId: "deploy-tx-race-safe",
          recordedAt: "2026-08-09T00:00:01.000Z",
          failure: null,
          proofCommitments: {
            liabilityEvidenceCommitment: "d".repeat(64),
            reserveTotalCommitment: "e".repeat(64),
          },
        };
      },
      attest: async () => ({ transactionId: "attest-tx", recordedAt: "2026-08-09T00:00:02.000Z" }),
      revoke: async () => ({ transactionId: "revoke-tx", recordedAt: "2026-08-09T00:00:03.000Z" }),
      read: async () => { throw new Error("Not needed for this race test"); },
    };
    const config = loadConfig("test");
    const app = await buildApp({ config, repository: new InMemorySnapshotRepository(), anchorService: direct });
    apps.push(app);
    const headers = { authorization: "Bearer issuer-demo-token", "idempotency-key": "deployment-race-key-0001" };

    const first = app.inject({ method: "POST", url: "/v1/snapshots", headers, payload: snapshotBody() });
    while (deploymentCount === 0) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    const retry = await app.inject({ method: "POST", url: "/v1/snapshots", headers, payload: snapshotBody() });
    expect(retry.statusCode).toBe(409);
    expect(deploymentCount).toBe(1);

    releaseDeployment?.();
    expect((await first).statusCode).toBe(201);
  });

  it("reconciles an uncertain attestation from authoritative chain state without submitting twice", async () => {
    const repository = new InMemorySnapshotRepository();
    let deployedPayload: Parameters<AnchorService["deploy"]>[0] | undefined;
    let chainStatus: "PENDING_ATTESTATION" | "VERIFIED" = "PENDING_ATTESTATION";
    let attestCalls = 0;
    const direct: AnchorService = {
      prepare: (payload) => ({
        mode: "MIDNIGHT_PREPROD", status: "PENDING", contractAddress: null, commitment: lifecycleCommitment(payload),
        transactionId: null, recordedAt: "2026-08-09T00:00:00.000Z", failure: null, proofCommitments: null,
      }),
      deploy: async (payload) => {
        deployedPayload = payload;
        return {
          mode: "MIDNIGHT_PREPROD", status: "CONFIRMED", contractAddress: "midnight-contract-reconcile",
          commitment: lifecycleCommitment(payload), transactionId: "deploy-reconcile", recordedAt: "2026-08-09T00:00:01.000Z",
          failure: null, proofCommitments: { liabilityEvidenceCommitment: "d".repeat(64), reserveTotalCommitment: "e".repeat(64) },
        };
      },
      attest: async () => {
        attestCalls += 1;
        chainStatus = "VERIFIED";
        throw new Error("Response lost after Midnight accepted the transaction");
      },
      revoke: async () => { throw new Error("not used"); },
      read: async () => {
        if (!deployedPayload) throw new Error("not deployed");
        return {
          contractAddress: "midnight-contract-reconcile", status: chainStatus,
          snapshotIdentifier: createHash("sha256").update(`aqua:snapshot-id:v1|${deployedPayload.snapshotId}`).digest("hex"),
          scopeManifestHash: deployedPayload.scopeManifestHash, liabilityCommitment: deployedPayload.liabilityCommitment,
          membershipRoot: deployedPayload.membershipRoot, reserveEvidenceCommitment: deployedPayload.reserveEvidenceCommitment,
          coverageEvidenceCommitment: deployedPayload.coverageEvidenceCommitment, liabilityEvidenceCommitment: "d".repeat(64),
          reserveTotalCommitment: "e".repeat(64), expiresAt: new Date(Math.floor(Date.parse(deployedPayload.expiresAt) / 1_000) * 1_000).toISOString(),
          attestedAt: "2026-08-09T00:00:02.000Z", revocationReasonHash: "a".repeat(64),
        };
      },
    };
    const config = loadConfig("test");
    const app = await buildApp({ config, repository, anchorService: direct });
    apps.push(app);
    const created = await app.inject({ method: "POST", url: "/v1/snapshots", headers: issuerHeaders, payload: snapshotBody() });
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;
    expect((await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders })).statusCode).toBe(500);
    expect((await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders })).statusCode).toBe(409);
    const reconciled = await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/reconcile`, headers: issuerHeaders, payload: {} });
    expect(reconciled.statusCode).toBe(200);
    expect(reconciled.json<{ snapshot: { status: string; attesterSignature: string | null } }>().snapshot).toMatchObject({ status: "VERIFIED" });
    expect(reconciled.json<{ snapshot: { attesterSignature: string | null } }>().snapshot.attesterSignature).not.toBeNull();
    expect(attestCalls).toBe(1);
  });

  it("lets an issuer discover and explicitly abandon an unrecorded deployment", async () => {
    const direct: AnchorService = {
      prepare: (payload) => ({ mode: "MIDNIGHT_PREPROD", status: "PENDING", contractAddress: null, commitment: lifecycleCommitment(payload), transactionId: null, recordedAt: "2026-08-09T00:00:00.000Z", failure: null, proofCommitments: null }),
      deploy: async () => { throw new Error("No transaction was submitted"); },
      attest: async () => { throw new Error("not used"); }, revoke: async () => { throw new Error("not used"); }, read: async () => { throw new Error("not used"); },
    };
    const config = loadConfig("test");
    const app = await buildApp({ config, repository: new InMemorySnapshotRepository(), anchorService: direct });
    apps.push(app);
    const headers = { authorization: "Bearer issuer-demo-token", "idempotency-key": "abandon-deployment-key-0001" };
    expect((await app.inject({ method: "POST", url: "/v1/snapshots", headers, payload: snapshotBody() })).statusCode).toBe(500);
    const found = await app.inject({ method: "GET", url: "/v1/issuer/snapshots/by-idempotency-key", headers });
    const snapshotId = found.json<{ snapshot: { id: string } }>().snapshot.id;
    expect(found.json<{ snapshot: { anchor: { status: string } } }>().snapshot.anchor.status).toBe("DEPLOYING");
    expect((await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/reconcile`, headers: issuerHeaders, payload: {} })).statusCode).toBe(409);
    const abandoned = await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/reconcile`, headers: issuerHeaders, payload: { abandonDeployment: true } });
    expect(abandoned.json<{ snapshot: { anchor: { status: string; failure: string } } }>().snapshot.anchor).toMatchObject({ status: "FAILED", failure: "MIDNIGHT_DEPLOYMENT_ABANDONED" });
    expect((await app.inject({ method: "POST", url: "/v1/snapshots", headers, payload: snapshotBody() })).statusCode).toBe(409);
  });

  it("permits only the configured web application origin", async () => {
    const app = await makeApp();
    const preflight = await app.inject({
      method: "OPTIONS",
      url: "/v1/snapshots",
      headers: {
        origin: "http://localhost:3001",
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization,content-type,idempotency-key",
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe("http://localhost:3001");
    expect(preflight.headers["access-control-allow-headers"]).toContain("idempotency-key");
  });

  it("makes snapshot publication safely idempotent and rejects key reuse with altered input", async () => {
    const app = await makeApp();
    const headers = { authorization: "Bearer issuer-demo-token", "idempotency-key": "publish-retry-key-0001" };
    const first = await app.inject({ method: "POST", url: "/v1/snapshots", headers, payload: snapshotBody() });
    const retry = await app.inject({ method: "POST", url: "/v1/snapshots", headers, payload: snapshotBody() });
    expect(first.statusCode).toBe(201);
    expect(retry.statusCode).toBe(201);
    expect(retry.json<{ snapshot: { id: string } }>().snapshot.id).toBe(first.json<{ snapshot: { id: string } }>().snapshot.id);

    const altered = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers,
      payload: snapshotBody({ reserveTotalBaseUnits: "9000001" }),
    });
    expect(altered.statusCode).toBe(409);

    const missingKey = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers: { authorization: "Bearer issuer-demo-token" },
      payload: snapshotBody(),
    });
    expect(missingKey.statusCode).toBe(400);
  });

  it("publishes an attested covered snapshot without exposing customer data publicly", async () => {
    const app = await makeApp();
    const created = await app.inject({ method: "POST", url: "/v1/snapshots", headers: issuerHeaders, payload: snapshotBody() });
    expect(created.statusCode).toBe(201);
    const snapshotId = created.json<{ snapshot: { id: string; status: string } }>().snapshot.id;
    expect(created.json<{ snapshot: { status: string } }>().snapshot.status).toBe("PENDING_ATTESTATION");

    const attested = await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders });
    expect(attested.statusCode).toBe(200);
    expect(attested.json<{ snapshot: { status: string } }>().snapshot.status).toBe("VERIFIED");

    const publicResult = await app.inject({ method: "GET", url: `/v1/public/snapshots/${snapshotId}` });
    expect(publicResult.statusCode).toBe(200);
    expect(publicResult.json<{ snapshot: { status: string; anchor: { mode: string } } }>().snapshot.status).toBe("VERIFIED");
    expect(publicResult.json<{ snapshot: { anchor: { mode: string } } }>().snapshot.anchor.mode).toBe("DEVELOPMENT");
    expect(publicResult.body).not.toContain("customer-001");
    expect(publicResult.body).not.toContain("1000000");
    expect(publicResult.body).not.toContain("demo-reserve-evidence-reference");
    const publicSnapshot = publicResult.json<{
      snapshot: {
        id: string;
        proofSystemVersion: string;
        issuerId: string;
        attesterId: string;
        scopeManifestHash: string;
        liabilityCommitment: string;
        reserveEvidenceCommitment: string;
        coverageEvidenceCommitment: string;
        expiresAt: string;
        issuerPublicKey: string;
        issuerSignature: string;
        anchor: { commitment: string };
      };
    }>().snapshot;
    expect(
      verifySignature(
        null,
        Buffer.from(
          canonicalJson({
            snapshotId: publicSnapshot.id,
            proofSystemVersion: publicSnapshot.proofSystemVersion,
            issuerId: publicSnapshot.issuerId,
            attesterId: publicSnapshot.attesterId,
            scopeManifestHash: publicSnapshot.scopeManifestHash,
            liabilityCommitment: publicSnapshot.liabilityCommitment,
            reserveEvidenceCommitment: publicSnapshot.reserveEvidenceCommitment,
            coverageEvidenceCommitment: publicSnapshot.coverageEvidenceCommitment,
            expiresAt: publicSnapshot.expiresAt,
            anchorCommitment: publicSnapshot.anchor.commitment,
            issuerPublicKey: publicSnapshot.issuerPublicKey,
            attesterPublicKey: publicResult.json<{ snapshot: { attesterPublicKey: string } }>().snapshot.attesterPublicKey,
          }),
        ),
        createPublicKey(publicSnapshot.issuerPublicKey),
        Buffer.from(publicSnapshot.issuerSignature, "base64url"),
      ),
    ).toBe(true);
  });

  it("returns a customer-only private inclusion receipt that verifies locally", async () => {
    const app = await makeApp();
    const created = await app.inject({ method: "POST", url: "/v1/snapshots", headers: issuerHeaders, payload: snapshotBody() });
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;
    await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders });

    const customer = await app.inject({
      method: "GET",
      url: `/v1/customer/snapshots/${snapshotId}/verification`,
      headers: customerHeaders(1),
    });
    expect(customer.statusCode).toBe(200);
    const verification = customer.json<{
      verification: { included: boolean; cryptographicallyValid: boolean; receipt: { balanceBaseUnits: string; proof: Array<{ siblingHash: string; siblingPosition: "LEFT" | "RIGHT" }>; customerReference: string; salt: string; membershipRoot: string } };
    }>().verification;
    expect(verification.included).toBe(true);
    expect(verification.cryptographicallyValid).toBe(true);
    expect(verification.receipt.balanceBaseUnits).toBe("1000000");
    expect(
      verifyReceipt({
        customerReference: verification.receipt.customerReference,
        balanceBaseUnits: BigInt(verification.receipt.balanceBaseUnits),
        salt: verification.receipt.salt,
        membershipRoot: verification.receipt.membershipRoot,
        proof: verification.receipt.proof,
      }),
    ).toBe(true);
    const tamperedProof = verification.receipt.proof.map((step, index) =>
      index === 0 ? { ...step, siblingHash: "0".repeat(64) } : step,
    );
    expect(
      verifyReceipt({
        customerReference: verification.receipt.customerReference,
        balanceBaseUnits: BigInt(verification.receipt.balanceBaseUnits),
        salt: verification.receipt.salt,
        membershipRoot: verification.receipt.membershipRoot,
        proof: tamperedProof,
      }),
    ).toBe(false);
  });

  it("reports an omitted customer as not included without exposing any other receipt", async () => {
    const app = await makeApp();
    const created = await app.inject({ method: "POST", url: "/v1/snapshots", headers: issuerHeaders, payload: snapshotBody() });
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;
    const customer = await app.inject({
      method: "GET",
      url: `/v1/customer/snapshots/${snapshotId}/verification`,
      headers: customerHeaders(4),
    });
    expect(customer.statusCode).toBe(200);
    expect(customer.json<{ verification: { included: boolean; receipt: unknown } }>().verification).toEqual({
      included: false,
      cryptographicallyValid: false,
      currentStatus: "PENDING_ATTESTATION",
      receipt: null,
    });
  });

  it("marks an underfunded snapshot as a shortfall", async () => {
    const app = await makeApp();
    const created = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers: issuerHeaders,
      payload: snapshotBody({ reserveTotalBaseUnits: "5999999" }),
    });
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;
    const attested = await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders });
    expect(attested.json<{ snapshot: { status: string } }>().snapshot.status).toBe("SHORTFALL");
  });

  it("does not report expired or revoked snapshots as verified", async () => {
    const app = await makeApp();
    const expired = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers: issuerHeaders,
      payload: snapshotBody({ cutoffAt: "2020-01-01T00:00:00.000Z", expiresAt: "2020-01-02T00:00:00.000Z" }),
    });
    const expiredId = expired.json<{ snapshot: { id: string } }>().snapshot.id;
    const expiredPublic = await app.inject({ method: "GET", url: `/v1/public/snapshots/${expiredId}` });
    expect(expiredPublic.json<{ snapshot: { status: string } }>().snapshot.status).toBe("EXPIRED");

    const created = await app.inject({ method: "POST", url: "/v1/snapshots", headers: issuerHeaders, payload: snapshotBody() });
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;
    await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders });
    const revoked = await app.inject({
      method: "POST",
      url: `/v1/snapshots/${snapshotId}/revoke`,
      headers: issuerHeaders,
      payload: { reason: "The synthetic reserve evidence was intentionally replaced for the demo." },
    });
    expect(revoked.json<{ snapshot: { status: string } }>().snapshot.status).toBe("REVOKED");
  });

  it("enforces role separation and input invariants", async () => {
    const app = await makeApp();
    const forbiddenPublish = await app.inject({ method: "POST", url: "/v1/snapshots", headers: customerHeaders(1), payload: snapshotBody() });
    expect(forbiddenPublish.statusCode).toBe(403);

    const duplicateCustomers = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers: issuerHeaders,
      payload: snapshotBody({ liabilities: [{ customerId: "customer-001", balanceBaseUnits: "1" }, { customerId: "customer-001", balanceBaseUnits: "2" }] }),
    });
    expect(duplicateCustomers.statusCode).toBe(409);
  });

  it("handles the 25-customer Phase 1 demo size", async () => {
    const app = await makeApp();
    const liabilities = Array.from({ length: 25 }, (_, index) => ({
      customerId: `customer-${String(index + 1).padStart(3, "0")}`,
      balanceBaseUnits: String((index + 1) * 100_000),
    }));
    const created = await app.inject({
      method: "POST",
      url: "/v1/snapshots",
      headers: issuerHeaders,
      payload: snapshotBody({ liabilities, reserveTotalBaseUnits: "33500000" }),
    });
    expect(created.statusCode).toBe(201);
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;
    const attested = await app.inject({ method: "POST", url: `/v1/snapshots/${snapshotId}/attest`, headers: attesterHeaders });
    expect(attested.json<{ snapshot: { status: string } }>().snapshot.status).toBe("VERIFIED");
  });

  it("lists public, issuer, and attester snapshots with role-scoped lifecycle events", async () => {
    const app = await makeApp();
    const created = await app.inject({ method: "POST", url: "/v1/snapshots", headers: issuerHeaders, payload: snapshotBody() });
    const snapshotId = created.json<{ snapshot: { id: string } }>().snapshot.id;

    const publicList = await app.inject({ method: "GET", url: "/v1/public/snapshots?limit=10" });
    expect(publicList.statusCode).toBe(200);
    expect(publicList.json<{ snapshots: Array<{ id: string }>; nextCursor: string | null }>().snapshots.map((snapshot) => snapshot.id)).toContain(snapshotId);

    const issuerList = await app.inject({ method: "GET", url: "/v1/issuer/snapshots", headers: issuerHeaders });
    expect(issuerList.statusCode).toBe(200);
    expect(issuerList.json<{ snapshots: Array<{ issuerId: string }> }>().snapshots.every((snapshot) => snapshot.issuerId === "issuer-demo")).toBe(true);

    const attesterList = await app.inject({ method: "GET", url: "/v1/attester/snapshots", headers: attesterHeaders });
    expect(attesterList.statusCode).toBe(200);
    expect(attesterList.json<{ snapshots: Array<{ attesterId: string }> }>().snapshots.every((snapshot) => snapshot.attesterId === "attester-demo")).toBe(true);

    const events = await app.inject({ method: "GET", url: `/v1/snapshots/${snapshotId}/events`, headers: attesterHeaders });
    expect(events.statusCode).toBe(200);
    expect(events.json<{ events: Array<{ type: string }> }>().events.map((event) => event.type)).toContain("CREATED");
    expect((await app.inject({ method: "GET", url: `/v1/snapshots/${snapshotId}/events`, headers: customerHeaders(1) })).statusCode).toBe(403);
  });
});
