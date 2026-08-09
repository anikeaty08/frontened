const baseUrl = process.env.AQUA_BASE_URL ?? "http://127.0.0.1:3000";
const issuerToken = process.env.AQUA_ISSUER_TOKEN ?? "issuer-demo-token";
const attesterToken = process.env.AQUA_ATTESTER_TOKEN ?? "attester-demo-token";

const liabilities = Array.from({ length: 25 }, (_, index) => ({
  customerId: `customer-${String(index + 1).padStart(3, "0")}`,
  balanceBaseUnits: String((index + 1) * 100_000),
}));
const liabilityTotal = liabilities.reduce((total, liability) => total + BigInt(liability.balanceBaseUnits), 0n);

const createResponse = await fetch(`${baseUrl}/v1/snapshots`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${issuerToken}`,
    "content-type": "application/json",
    "idempotency-key": `demo-phase1-${randomUUID()}`,
  },
  body: JSON.stringify({
    issuerId: "issuer-demo",
    attesterId: "attester-demo",
    asset: { code: "DUSD", decimals: 6 },
    scope: {
      liabilityDefinition: "Synthetic demo-custodian DUSD customer spot balances.",
      includedCategories: ["customer spot balances"],
      excludedCategories: ["margin balances", "corporate treasury"],
      limitations: "Synthetic Phase 1 demonstration only. This snapshot is not an audit or a safety guarantee.",
    },
    cutoffAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reserveTotalBaseUnits: (liabilityTotal + 1_000_000n).toString(),
    reserveEvidenceReference: `synthetic-demo-reserve-evidence-${new Date().toISOString()}`,
    liabilities,
  }),
});
if (!createResponse.ok) throw new Error(`Snapshot creation failed: ${await createResponse.text()}`);
const created = (await createResponse.json()) as { snapshot: { id: string } };

const attestationResponse = await fetch(`${baseUrl}/v1/snapshots/${created.snapshot.id}/attest`, {
  method: "POST",
  headers: { authorization: `Bearer ${attesterToken}` },
});
if (!attestationResponse.ok) throw new Error(`Snapshot attestation failed: ${await attestationResponse.text()}`);
console.log(JSON.stringify(await attestationResponse.json(), null, 2));
import { randomUUID } from "node:crypto";
