import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DustSecretKey,
  LedgerParameters,
  ZswapSecretKeys,
  type CoinPublicKey,
  type EncPublicKey,
  type FinalizedTransaction,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import type { MidnightProvider, UnboundTransaction, WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import { ttlOneHour } from "@midnight-ntwrk/midnight-js-utils";
import { FluentWalletBuilder, type EnvironmentConfiguration, type DustWalletOptions } from "@midnight-ntwrk/testkit-js";
import {
  DustWallet,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  ShieldedWallet,
  UnshieldedWallet,
  WalletEntrySchema,
  WalletFacade,
  mergeWalletEntries,
  type UnshieldedKeystore,
} from "@midnight-ntwrk/wallet-sdk";

type WalletCheckpoint = {
  version: 1;
  networkId: string;
  shielded: string;
  unshielded: string;
  dust: string;
};

type EncryptedCheckpoint = {
  version: 1;
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
};

type WalletInternals = {
  shielded: { serializeState(): Promise<string> };
  unshielded: { serializeState(): Promise<string> };
  dust: { serializeState(): Promise<string> };
};

const checkpointDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".aqua-midnight-state");

const checkpointPassword = (): string => {
  const password = process.env.AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD;
  if (!password) throw new Error("AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD is required for Midnight wallet checkpoints");
  return password;
};

const encrypt = (checkpoint: WalletCheckpoint): EncryptedCheckpoint => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(checkpointPassword(), salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(checkpoint), "utf8"), cipher.final()]);
  return { version: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext: ciphertext.toString("base64") };
};

const decrypt = (stored: EncryptedCheckpoint): WalletCheckpoint => {
  if (stored.version !== 1) throw new Error("Unsupported Midnight wallet checkpoint version");
  const key = scryptSync(checkpointPassword(), Buffer.from(stored.salt, "base64"), 32);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(stored.iv, "base64"));
    decipher.setAuthTag(Buffer.from(stored.tag, "base64"));
    const value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(stored.ciphertext, "base64")), decipher.final()]).toString("utf8")) as WalletCheckpoint;
    if (value.version !== 1 || typeof value.networkId !== "string" || !value.shielded || !value.unshielded || !value.dust) throw new Error("Malformed Midnight wallet checkpoint");
    return value;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Cannot decrypt the Midnight wallet checkpoint: ${message}. Verify AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD; do not overwrite the checkpoint.`);
  }
};

const readCheckpoint = (checkpointPath: string): WalletCheckpoint | undefined => {
  if (!existsSync(checkpointPath)) return undefined;
  return decrypt(JSON.parse(readFileSync(checkpointPath, "utf8")) as EncryptedCheckpoint);
};

const writeCheckpoint = (checkpointPath: string, checkpoint: WalletCheckpoint): void => {
  mkdirSync(path.dirname(checkpointPath), { recursive: true });
  const temporaryPath = `${checkpointPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(encrypt(checkpoint)), { encoding: "utf8", mode: 0o600 });
  renameSync(temporaryPath, checkpointPath);
};

const configurationFor = (environment: EnvironmentConfiguration, dustOptions: DustWalletOptions) => ({
  indexerClientConnection: { indexerHttpUrl: environment.indexer, indexerWsUrl: environment.indexerWS },
  // The SDK's defaults prioritize interactive responsiveness. A headless
  // deployer may need to replay the entire private DUST ledger on first use;
  // batching preserves event order while avoiding an artificial inter-batch
  // pause during that one-time catch-up.
  batchUpdates: { size: 50, timeout: 20, spacing: 0 },
  provingServerUrl: new URL(environment.proofServer),
  networkId: environment.walletNetworkId,
  relayURL: new URL(environment.nodeWS),
  txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries),
  costParameters: {
    ledgerParams: dustOptions.ledgerParams,
    additionalFeeOverhead: dustOptions.additionalFeeOverhead,
    feeBlocksMargin: dustOptions.feeBlocksMargin,
  },
});

const restoreWallet = async (
  checkpoint: WalletCheckpoint,
  environment: EnvironmentConfiguration,
  keystore: UnshieldedKeystore,
  dustOptions: DustWalletOptions,
): Promise<WalletFacade> => {
  if (checkpoint.networkId !== environment.networkId) throw new Error("Midnight wallet checkpoint belongs to a different network");
  const configuration = configurationFor(environment, dustOptions);
  const shielded = ShieldedWallet(configuration).restore(checkpoint.shielded);
  const unshielded = UnshieldedWallet({ ...configuration, txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries) }).restore(checkpoint.unshielded);
  const dust = DustWallet(configuration).restore(checkpoint.dust);
  return WalletFacade.init({ configuration, shielded: () => shielded, unshielded: () => unshielded, dust: () => dust });
};

export class AquaWalletProvider implements MidnightProvider, WalletProvider {
  private constructor(
    readonly wallet: WalletFacade,
    private readonly zswapSecretKeys: ZswapSecretKeys,
    private readonly dustSecretKey: DustSecretKey,
    readonly unshieldedKeystore: UnshieldedKeystore,
    private readonly checkpointPath: string,
    private readonly networkId: string,
  ) {}

  getCoinPublicKey(): CoinPublicKey { return this.zswapSecretKeys.coinPublicKey; }
  getEncryptionPublicKey(): EncPublicKey { return this.zswapSecretKeys.encryptionPublicKey; }
  async balanceTx(tx: UnboundTransaction, ttl: Date = ttlOneHour()): Promise<FinalizedTransaction> {
    const recipe = await this.wallet.balanceUnboundTransaction(tx, { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey }, { ttl });
    return this.wallet.finalizeRecipe(recipe);
  }
  submitTx(tx: FinalizedTransaction): Promise<string> { return this.wallet.submitTransaction(tx); }
  start(): Promise<void> { return this.wallet.start(this.zswapSecretKeys, this.dustSecretKey); }
  stop(): Promise<void> { return this.wallet.stop(); }

  async saveCheckpoint(): Promise<void> {
    const wallet = this.wallet as unknown as WalletInternals;
    writeCheckpoint(this.checkpointPath, {
      version: 1,
      networkId: this.networkId,
      shielded: await wallet.shielded.serializeState(),
      unshielded: await wallet.unshielded.serializeState(),
      dust: await wallet.dust.serializeState(),
    });
  }

  static async fromEnvironment(environment: EnvironmentConfiguration): Promise<AquaWalletProvider> {
    const mnemonic = process.env.MIDNIGHT_WALLET_MNEMONIC?.trim().replace(/\s+/g, " ");
    const seed = process.env.MIDNIGHT_WALLET_SEED?.trim();
    if (Boolean(mnemonic) === Boolean(seed)) throw new Error("Set exactly one of MIDNIGHT_WALLET_MNEMONIC or MIDNIGHT_WALLET_SEED");
    if (seed && (!/^[0-9a-fA-F]+$/.test(seed) || seed.length % 2 !== 0)) throw new Error("MIDNIGHT_WALLET_SEED must be even-length hexadecimal without 0x");
    const dustOptions: DustWalletOptions = { ledgerParams: LedgerParameters.initialParameters(), additionalFeeOverhead: 1_000n, feeBlocksMargin: 5 };
    const base = FluentWalletBuilder.forEnvironment(environment).withDustOptions(dustOptions);
    const result = await (mnemonic ? base.withMnemonic(mnemonic).buildWithoutStarting() : base.withSeed(seed!).buildWithoutStarting());
    const typed = result as { wallet: WalletFacade; seeds: { shielded: Uint8Array; dust: Uint8Array }; keystore: UnshieldedKeystore };
    const fingerprint = createHash("sha256").update(typed.seeds.shielded).digest("hex").slice(0, 16);
    const checkpointPath = path.join(checkpointDirectory, `${environment.networkId}-${fingerprint}.json.enc`);
    const checkpoint = readCheckpoint(checkpointPath);
    const wallet = checkpoint ? await restoreWallet(checkpoint, environment, typed.keystore, dustOptions) : typed.wallet;
    return new AquaWalletProvider(wallet, ZswapSecretKeys.fromSeed(typed.seeds.shielded), DustSecretKey.fromSeed(typed.seeds.dust), typed.keystore, checkpointPath, environment.networkId);
  }
}
