import { createHash, createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { stdin as input } from "node:process";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { deployContract, getPublicStates, submitCallTx } from "@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { EnvironmentConfiguration } from "@midnight-ntwrk/testkit-js";
import * as Rx from "rxjs";
import {
  authorizationCommitment,
  authorizationSecretFromEnvironment,
  CompiledAquaReserveContract,
  ledger,
  totalEvidenceCommitment,
  type AquaPrivateState,
} from "./contract.js";
import { getNetworkConfig } from "./network.js";
import { buildProviders } from "./providers.js";
import { AquaWalletProvider } from "./wallet.js";

const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Node does not provide the browser WebSocket global used by GraphQL subscriptions.
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

type DeployInput = {
  snapshotId: string;
  scopeManifestHash: string;
  liabilityCommitment: string;
  membershipRoot: string;
  liabilityTotalBaseUnits: string;
  reserveEvidenceCommitment: string;
  reserveTotalBaseUnits: string;
  coverageEvidenceCommitment: string;
  expiresAt: string;
};
type AttestInput = { snapshotId: string; contractAddress: string; attestedAt?: string };
type RevokeInput = { snapshotId: string; contractAddress: string; reason: string };
type InspectInput = { contractAddress: string };

const toBytes32 = (value: string, name: string): Uint8Array => {
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error(`${name} must be a 32-byte hexadecimal value`);
  return Uint8Array.from(Buffer.from(value, "hex"));
};
const sha256Bytes = (value: string): Uint8Array => Uint8Array.from(createHash("sha256").update(value).digest());
const lifecycleCommitment = (payload: DeployInput): string =>
  createHash("sha256")
    .update([
      "aqua:midnight-lifecycle:v1",
      payload.snapshotId,
      payload.scopeManifestHash,
      payload.liabilityCommitment,
      payload.reserveEvidenceCommitment,
      payload.coverageEvidenceCommitment,
      payload.expiresAt,
    ].join("|"))
    .digest("hex");
const snapshotIdentifier = (snapshotId: string): Uint8Array => sha256Bytes(`aqua:snapshot-id:v1|${snapshotId}`);
const toHex = (value: Uint8Array): string => Buffer.from(value).toString("hex");
const parseExpiry = (value: string): bigint => {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) throw new Error("expiresAt must be an ISO-8601 timestamp");
  return BigInt(Math.floor(ms / 1000));
};
const parseUint64 = (value: string, name: string): bigint => {
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new Error(`${name} must be an unsigned integer string`);
  const parsed = BigInt(value);
  if (parsed > 18_446_744_073_709_551_615n) throw new Error(`${name} must fit Uint<64>`);
  return parsed;
};
const privateState = (payload: DeployInput): AquaPrivateState => {
  const issuerAuthorizationSecret = authorizationSecretFromEnvironment("AQUA_MIDNIGHT_ISSUER_AUTH_SECRET_HEX");
  const deriveOpening = (domain: string): Uint8Array =>
    Uint8Array.from(createHmac("sha256", issuerAuthorizationSecret)
      .update(`${domain}|${payload.snapshotId}|${payload.membershipRoot}|${payload.reserveEvidenceCommitment}`)
      .digest());
  return {
    liabilityTotal: parseUint64(payload.liabilityTotalBaseUnits, "liabilityTotalBaseUnits"),
    liabilityEvidenceOpening: deriveOpening("aqua:liability-evidence-opening:v1"),
    reserveTotal: parseUint64(payload.reserveTotalBaseUnits, "reserveTotalBaseUnits"),
    reserveTotalOpening: deriveOpening("aqua:reserve-total-opening:v1"),
  };
};

const readJson = async <T>(): Promise<T> => {
  const chunks: Buffer[] = [];
  for await (const chunk of input) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) throw new Error("Provide the lifecycle payload as JSON on standard input");
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
};

const syncWallet = async (wallet: AquaWalletProvider): Promise<void> => {
  const complete = (value: unknown): boolean => Boolean(value && typeof value === "object" && typeof (value as { isStrictlyComplete?: unknown }).isStrictlyComplete === "function" && (value as { isStrictlyComplete: () => boolean }).isStrictlyComplete());
  let previousProgress = "";
  await Rx.firstValueFrom(wallet.wallet.state().pipe(
    Rx.tap((state) => {
      const progress = `shielded=${complete(state.shielded.state.progress)} dust=${complete(state.dust.state.progress)} unshielded=${complete(state.unshielded.progress)}`;
      if (progress !== previousProgress) {
        console.error(`[wallet sync] ${progress}`);
        previousProgress = progress;
      }
    }),
    Rx.filter((state) => complete(state.shielded.state.progress) && complete(state.dust.state.progress) && complete(state.unshielded.progress)),
    Rx.timeout({ first: Number(process.env.MIDNIGHT_SYNC_TIMEOUT_MS ?? 3_600_000) }),
  ));
};

const withChain = async <T>(snapshotId: string, action: (providers: ReturnType<typeof buildProviders>) => Promise<T>): Promise<T> => {
  const config = getNetworkConfig();
  setNetworkId(config.networkId);
  const environment: EnvironmentConfiguration = {
    walletNetworkId: config.networkId,
    networkId: config.networkId,
    indexer: config.indexer,
    indexerWS: config.indexerWS,
    node: config.node,
    nodeWS: config.nodeWS,
    faucet: config.faucet,
    proofServer: config.proofServer,
  };
  const wallet = await AquaWalletProvider.fromEnvironment(environment);
  await wallet.start();
  try {
    await syncWallet(wallet);
    return await action(buildProviders(wallet, snapshotId, config));
  } finally {
    await wallet.stop();
  }
};

const withPublicData = async <T>(action: (provider: ReturnType<typeof indexerPublicDataProvider>) => Promise<T>): Promise<T> => {
  const config = getNetworkConfig();
  setNetworkId(config.networkId);
  return action(indexerPublicDataProvider(config.indexer, config.indexerWS));
};

const deploy = async (payload: DeployInput): Promise<Record<string, string>> => {
  const secrets = privateState(payload);
  const issuerAuthorizationSecret = authorizationSecretFromEnvironment("AQUA_MIDNIGHT_ISSUER_AUTH_SECRET_HEX");
  const attesterAuthorizationSecret = authorizationSecretFromEnvironment("AQUA_MIDNIGHT_ATTESTER_AUTH_SECRET_HEX");
  const liabilityEvidenceCommitment = totalEvidenceCommitment(toBytes32(payload.membershipRoot, "membershipRoot"), secrets.liabilityTotal, secrets.liabilityEvidenceOpening);
  const reserveTotalCommitment = totalEvidenceCommitment(toBytes32(payload.reserveEvidenceCommitment, "reserveEvidenceCommitment"), secrets.reserveTotal, secrets.reserveTotalOpening);
  return withChain(payload.snapshotId, async (providers) => {
    const result = await deployContract(providers, {
      compiledContract: CompiledAquaReserveContract,
      privateStateId: `aqua-reserve:${payload.snapshotId}`,
      initialPrivateState: secrets,
      args: [
        snapshotIdentifier(payload.snapshotId),
        authorizationCommitment("aqua:issuer-authorisation:v1", issuerAuthorizationSecret),
        authorizationCommitment("aqua:attester-authorisation:v1", attesterAuthorizationSecret),
        toBytes32(payload.scopeManifestHash, "scopeManifestHash"),
        toBytes32(payload.liabilityCommitment, "liabilityCommitment"),
        toBytes32(payload.membershipRoot, "membershipRoot"),
        toBytes32(payload.reserveEvidenceCommitment, "reserveEvidenceCommitment"),
        toBytes32(payload.coverageEvidenceCommitment, "coverageEvidenceCommitment"),
        secrets.liabilityTotal,
        secrets.liabilityEvidenceOpening,
        secrets.reserveTotal,
        secrets.reserveTotalOpening,
        parseExpiry(payload.expiresAt),
      ],
    });
    return {
      operation: "DEPLOYED",
      network: String(getNetworkConfig().networkId),
      contractAddress: result.deployTxData.public.contractAddress,
      transactionId: result.deployTxData.public.txId,
      recordedAt: new Date().toISOString(),
      commitment: lifecycleCommitment(payload),
      liabilityEvidenceCommitment: toHex(liabilityEvidenceCommitment),
      reserveTotalCommitment: toHex(reserveTotalCommitment),
    };
  });
};

const attest = async (payload: AttestInput): Promise<Record<string, string>> =>
  withChain(payload.snapshotId, async (providers) => {
    const transaction = await submitCallTx(providers, {
      compiledContract: CompiledAquaReserveContract,
      contractAddress: payload.contractAddress,
      privateStateId: `aqua-reserve:${payload.snapshotId}`,
      circuitId: "attest",
      args: [BigInt(Math.floor(Date.parse(payload.attestedAt ?? new Date().toISOString()) / 1000))],
    });
    return { operation: "ATTESTED", contractAddress: payload.contractAddress, transactionId: transaction.public.txId, recordedAt: new Date().toISOString() };
  });

const revoke = async (payload: RevokeInput): Promise<Record<string, string>> =>
  withChain(payload.snapshotId, async (providers) => {
    if (!payload.reason.trim()) throw new Error("A non-empty revocation reason is required");
    const transaction = await submitCallTx(providers, {
      compiledContract: CompiledAquaReserveContract,
      contractAddress: payload.contractAddress,
      privateStateId: `aqua-reserve:${payload.snapshotId}`,
      circuitId: "revoke",
      args: [sha256Bytes(`aqua:revocation-reason:v1|${payload.reason}`)],
    });
    return { operation: "REVOKED", contractAddress: payload.contractAddress, transactionId: transaction.public.txId, recordedAt: new Date().toISOString() };
  });

const inspect = async (payload: InspectInput): Promise<Record<string, string>> =>
  withPublicData(async (provider) => {
    const publicStates = await getPublicStates(provider, payload.contractAddress as Parameters<typeof getPublicStates>[1]);
    const state = ledger(publicStates.contractState.data);
    const status = new Map<bigint, string>([
      [0n, "PENDING_ATTESTATION"],
      [1n, "VERIFIED"],
      [2n, "SHORTFALL"],
      [3n, "REVOKED"],
    ]).get(state.status);
    if (!status) throw new Error(`Unsupported AquaReserve contract status ${state.status}`);
    return {
      operation: "INSPECTED",
      contractAddress: payload.contractAddress,
      status,
      snapshotIdentifier: toHex(state.snapshotId),
      scopeManifestHash: toHex(state.scopeManifestHash),
      liabilityCommitment: toHex(state.liabilityRoot),
      membershipRoot: toHex(state.membershipRoot),
      reserveEvidenceCommitment: toHex(state.reserveEvidenceCommitment),
      coverageEvidenceCommitment: toHex(state.coverageEvidenceCommitment),
      liabilityEvidenceCommitment: toHex(state.liabilityEvidenceCommitment),
      reserveTotalCommitment: toHex(state.reserveTotalCommitment),
      expiresAt: new Date(Number(state.expiresAt) * 1_000).toISOString(),
      attestedAt: state.attestedAt === 0n ? "" : new Date(Number(state.attestedAt) * 1_000).toISOString(),
      revocationReasonHash: toHex(state.revocationReasonHash),
    };
  });

const status = async (): Promise<Record<string, string>> =>
  withChain("aqua-reserve-readiness", async () => ({
    operation: "READY",
    network: String(getNetworkConfig().networkId),
    proofServer: getNetworkConfig().proofServer,
    wallet: "synced",
  }));

const command = process.argv[2];
try {
  if (command === "deploy") console.log(JSON.stringify(await deploy(await readJson<DeployInput>())));
  else if (command === "attest") console.log(JSON.stringify(await attest(await readJson<AttestInput>())));
  else if (command === "revoke") console.log(JSON.stringify(await revoke(await readJson<RevokeInput>())));
  else if (command === "inspect") console.log(JSON.stringify(await inspect(await readJson<InspectInput>())));
  else if (command === "status") console.log(JSON.stringify(await status()));
  else throw new Error("Usage: npm run lifecycle -- <status|deploy|attest|revoke|inspect> < payload.json");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
