const scenario = process.argv[2];
if (!new Set(["shortfall", "expiry"]).has(scenario)) {
  throw new Error("Usage: node scripts/phase1-live-scenario.mjs <shortfall|expiry>");
}

process.loadEnvFile(".env");
const baseUrl = process.env.AQUA_BASE_URL ?? "http://127.0.0.1:3000";
const issuerToken = process.env.AQUA_ISSUER_TOKEN ?? "issuer-demo-token";
const attesterToken = process.env.AQUA_ATTESTER_TOKEN ?? "attester-demo-token";
const releaseVersion = process.env.AQUA_LIVE_SCENARIO_VERSION ?? "v1";
if (!/^v[1-9][0-9]*$/.test(releaseVersion)) throw new Error("AQUA_LIVE_SCENARIO_VERSION must look like v1 or v2");
const idempotencyKey = `aqua-phase1-live-${scenario}-${releaseVersion}`;
const issuerHeaders = { authorization: `Bearer ${issuerToken}`, "idempotency-key": idempotencyKey };

const request = async (url, init = {}) => {
  const response = await fetch(`${baseUrl}${url}`, init);
  const body = await response.text();
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} failed (${response.status}): ${body}`);
  return JSON.parse(body);
};

let snapshot;
const existing = await fetch(`${baseUrl}/v1/issuer/snapshots/by-idempotency-key`, { headers: issuerHeaders });
if (existing.ok) {
  snapshot = (await existing.json()).snapshot;
} else if (existing.status === 404) {
  const liabilities = Array.from({ length: 25 }, (_, index) => ({
    customerId: `customer-${String(index + 1).padStart(3, "0")}`,
    balanceBaseUnits: String((index + 1) * 100_000),
  }));
  const liabilityTotal = liabilities.reduce((sum, row) => sum + BigInt(row.balanceBaseUnits), 0n);
  const now = Date.now();
  const expiresAt = scenario === "expiry" ? new Date(now + 12 * 60_000).toISOString() : new Date(now + 24 * 60 * 60_000).toISOString();
  const reserveTotal = scenario === "shortfall" ? liabilityTotal - 1n : liabilityTotal + 1_000_000n;
  snapshot = (await request("/v1/snapshots", {
    method: "POST",
    headers: { ...issuerHeaders, "content-type": "application/json" },
    body: JSON.stringify({
      issuerId: "issuer-demo",
      attesterId: "attester-demo",
      asset: { code: "DUSD", decimals: 6 },
      scope: {
        liabilityDefinition: `Synthetic Phase 1 ${scenario} acceptance balances in native DUSD units.`,
        includedCategories: ["customer spot balances"],
        excludedCategories: ["margin balances", "corporate treasury"],
        limitations: `Synthetic Phase 1 ${scenario} acceptance evidence only; not an audit or safety guarantee.`,
      },
      cutoffAt: new Date(now).toISOString(),
      expiresAt,
      reserveTotalBaseUnits: reserveTotal.toString(),
      reserveEvidenceReference: `aqua-phase1-live-${scenario}-reserve-evidence-v1`,
      liabilities,
    }),
  })).snapshot;
} else {
  throw new Error(`Snapshot lookup failed (${existing.status}): ${await existing.text()}`);
}

if (snapshot.anchor.status !== "CONFIRMED") throw new Error(`Snapshot ${snapshot.id} requires deployment reconciliation`);
if (scenario === "shortfall" && snapshot.status === "PENDING_ATTESTATION") {
  snapshot = (await request(`/v1/snapshots/${snapshot.id}/attest`, {
    method: "POST",
    headers: { authorization: `Bearer ${attesterToken}` },
  })).snapshot;
}

console.log(JSON.stringify({
  scenario,
  snapshotId: snapshot.id,
  status: snapshot.status,
  expiresAt: snapshot.expiresAt,
  contractAddress: snapshot.anchor.contractAddress,
  deployTransactionId: snapshot.anchor.transactionId,
  attestedAt: snapshot.attestedAt,
}, null, 2));
