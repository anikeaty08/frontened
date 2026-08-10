import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { stdin as input } from "node:process";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
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
// A deployer can be launched from a shell that still has stale secret values.
// The project file is the source of truth for this worker, so intentionally
// override inherited values rather than using loadEnvFile's non-overriding merge.
if (existsSync(envFile)) Object.assign(process.env, parseEnv(readFileSync(envFile, "utf8")));

// Node does not provide the browser WebSocket global used by GraphQL subscriptions.
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

export type DeployInput = {
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
export type AttestInput = { snapshotId: string; contractAddress: string; attestedAt?: string };
export type RevokeInput = { snapshotId: string; contractAddress: string; reason: string };
export type InspectInput = { contractAddress: string };
export type LifecycleCommand = "deploy" | "attest" | "revoke" | "inspect" | "status";

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

const timeoutSetting = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw) || Number(raw) < 1) throw new Error(`${name} must be a positive whole number of milliseconds`);
  return Number(raw);
};

const within = async <T>(stage: string, timeoutMs: number, operation: Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${stage} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const syncWallet = async (wallet: AquaWalletProvider): Promise<void> => {
  const allowedGap = BigInt(timeoutSetting("MIDNIGHT_ALLOWED_SYNC_GAP", 0));
  const checkpointIntervalMs = timeoutSetting("MIDNIGHT_WALLET_CHECKPOINT_MS", 30_000);
  type Progress = {
    isConnected?: boolean;
    appliedIndex?: bigint;
    highestRelevantWalletIndex?: bigint;
    highestIndex?: bigint;
    appliedId?: bigint;
    highestTransactionId?: bigint;
    isCompleteWithin?: (gap: bigint) => boolean;
  };
  const complete = (value: unknown): boolean => {
    const progress = value as Progress | undefined;
    return Boolean(progress && typeof progress.isCompleteWithin === "function" && progress.isCompleteWithin(allowedGap));
  };
  const describe = (value: unknown): string => {
    const progress = value as Progress;
    const entry = (name: keyof Progress): string => typeof progress?.[name] === "bigint" ? `${name}=${progress[name]}` : "";
    return [
      `connected=${Boolean(progress?.isConnected)}`,
      entry("appliedIndex"),
      entry("highestRelevantWalletIndex"),
      entry("highestIndex"),
      entry("appliedId"),
      entry("highestTransactionId"),
    ].filter(Boolean).join(" ");
  };
  let previousProgress = "";
  let lastReportedAt = 0;
  let lastCheckpointAt = 0;
  let checkpointFailure: Error | undefined;
  let checkpoint = Promise.resolve();
  await Rx.firstValueFrom(wallet.wallet.state().pipe(
    Rx.tap((state) => {
      if (checkpointFailure) throw checkpointFailure;
      const progress = `allowedGap=${allowedGap} shielded=${complete(state.shielded.state.progress)} (${describe(state.shielded.state.progress)}) dust=${complete(state.dust.state.progress)} (${describe(state.dust.state.progress)}) unshielded=${complete(state.unshielded.progress)} (${describe(state.unshielded.progress)})`;
      const now = Date.now();
      if (progress !== previousProgress && now - lastReportedAt >= 5_000) {
        console.error(`[wallet sync] ${progress}`);
        lastReportedAt = now;
      }
      previousProgress = progress;
      if (now - lastCheckpointAt >= checkpointIntervalMs) {
        lastCheckpointAt = now;
        checkpoint = checkpoint.then(async () => {
          await wallet.saveCheckpoint();
          console.error("[wallet checkpoint] saved");
        }).catch((cause: unknown) => {
          checkpointFailure = cause instanceof Error ? cause : new Error(String(cause));
        });
      }
    }),
    Rx.filter((state) => complete(state.shielded.state.progress) && complete(state.dust.state.progress) && complete(state.unshielded.progress)),
    // A timeout on every emission prevents a subscribed-but-stalled indexer from
    // leaving an operator waiting forever after the first incomplete state.
    Rx.timeout({ each: timeoutSetting("MIDNIGHT_SYNC_TIMEOUT_MS", 120_000) }),
  ));
  await checkpoint;
  if (checkpointFailure) throw checkpointFailure;
};

type WalletSession = { wallet: AquaWalletProvider; config: ReturnType<typeof getNetworkConfig> };
let warmSession: Promise<WalletSession> | undefined;
let warmWallet: AquaWalletProvider | undefined;
let activeWalletForRecovery: AquaWalletProvider | undefined;

const startWalletSession = async (config: ReturnType<typeof getNetworkConfig>): Promise<WalletSession> => {
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
  activeWalletForRecovery = wallet;
  if (process.env.MIDNIGHT_WALLET_SESSION === "warm") warmWallet = wallet;
  try {
    const startupTimeoutMs = timeoutSetting("MIDNIGHT_WALLET_START_TIMEOUT_MS", 120_000);
    console.error(`[wallet] starting ${config.networkId}; timeout=${startupTimeoutMs}ms`);
    await within("Midnight wallet startup", startupTimeoutMs, wallet.start());
    console.error("[wallet] started; waiting for shielded, unshielded, and DUST sync");
    await syncWallet(wallet);
    console.error("[wallet] synchronization complete");
    return { wallet, config };
  } catch (cause) {
    await wallet.saveCheckpoint().catch(() => undefined);
    await within("Midnight wallet shutdown", timeoutSetting("MIDNIGHT_WALLET_STOP_TIMEOUT_MS", 15_000), wallet.stop()).catch(() => undefined);
    if (warmWallet === wallet) warmWallet = undefined;
    if (activeWalletForRecovery === wallet) activeWalletForRecovery = undefined;
    throw cause;
  }
};

export const stopWarmWalletSession = async (): Promise<void> => {
  const wallet = warmWallet;
  warmSession = undefined;
  warmWallet = undefined;
  if (!wallet) return;
  try {
    console.error("[wallet] stopping warm session");
    await wallet.saveCheckpoint();
    await wallet.stop();
  } catch {
    // A failed startup has no usable wallet to stop.
  }
  if (activeWalletForRecovery === wallet) activeWalletForRecovery = undefined;
};

export const checkpointWarmWalletSession = async (): Promise<void> => {
  if (!warmWallet) return;
  await warmWallet.saveCheckpoint();
  console.error("[wallet checkpoint] saved during recovery");
};

const withChain = async <T>(snapshotId: string, action: (providers: ReturnType<typeof buildProviders>) => Promise<T>): Promise<T> => {
  const config = getNetworkConfig();
  if (process.env.MIDNIGHT_WALLET_SESSION === "warm") {
    warmSession ??= startWalletSession(config).catch((cause: unknown) => {
      warmSession = undefined;
      throw cause;
    });
    const session = await warmSession;
    if (session.config.networkId !== config.networkId) throw new Error("Warm Midnight wallet network differs from requested network");
    return action(buildProviders(session.wallet, snapshotId, config));
  }
  const { wallet } = await startWalletSession(config);
  try {
    return await action(buildProviders(wallet, snapshotId, config));
  } finally {
    console.error("[wallet] stopping");
    await wallet.saveCheckpoint();
    await within("Midnight wallet shutdown", timeoutSetting("MIDNIGHT_WALLET_STOP_TIMEOUT_MS", 15_000), wallet.stop()).catch(() => undefined);
    if (activeWalletForRecovery === wallet) activeWalletForRecovery = undefined;
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

export const executeLifecycle = async (
  command: LifecycleCommand,
  payload?: DeployInput | AttestInput | RevokeInput | InspectInput,
): Promise<Record<string, string>> => {
  if (command === "deploy") return deploy(payload as DeployInput);
  if (command === "attest") return attest(payload as AttestInput);
  if (command === "revoke") return revoke(payload as RevokeInput);
  if (command === "inspect") return inspect(payload as InspectInput);
  return status();
};

const isCliEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCliEntrypoint) {
  let faultExit: Promise<void> | undefined;
  const checkpointAndExitAfterFault = (reason: unknown): void => {
    if (faultExit) return;
    faultExit = (async () => {
      console.error(`[wallet] runtime fault: ${reason instanceof Error ? reason.message : String(reason)}`);
      await activeWalletForRecovery?.saveCheckpoint().catch((checkpointError: unknown) => {
        console.error(`[wallet] checkpoint recovery failed: ${checkpointError instanceof Error ? checkpointError.message : String(checkpointError)}`);
      });
      process.exit(1);
    })();
  };
  process.once("uncaughtException", checkpointAndExitAfterFault);
  process.once("unhandledRejection", checkpointAndExitAfterFault);
  const command = process.argv[2] as LifecycleCommand | undefined;
  try {
    if (!command || !["deploy", "attest", "revoke", "inspect", "status"].includes(command)) {
      throw new Error("Usage: npm run lifecycle -- <status|deploy|attest|revoke|inspect> < payload.json");
    }
    const payload = command === "status" ? undefined : await readJson<DeployInput | AttestInput | RevokeInput | InspectInput>();
    console.log(JSON.stringify(await executeLifecycle(command, payload)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    // SDK subscriptions can outlive a failed one-shot command. The persistent
    // daemon has its own lifecycle; a CLI invocation must not leave a stale
    // wallet process behind after it has checkpointed and reported its result.
    setTimeout(() => process.exit(process.exitCode ?? 0), 0);
  }
}
