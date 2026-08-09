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
import type { UnshieldedKeystore, WalletFacade } from "@midnight-ntwrk/wallet-sdk";

export class AquaWalletProvider implements MidnightProvider, WalletProvider {
  private constructor(
    readonly wallet: WalletFacade,
    private readonly zswapSecretKeys: ZswapSecretKeys,
    private readonly dustSecretKey: DustSecretKey,
    readonly unshieldedKeystore: UnshieldedKeystore,
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

  static async fromEnvironment(environment: EnvironmentConfiguration): Promise<AquaWalletProvider> {
    const mnemonic = process.env.MIDNIGHT_WALLET_MNEMONIC?.trim().replace(/\s+/g, " ");
    const seed = process.env.MIDNIGHT_WALLET_SEED?.trim();
    if (Boolean(mnemonic) === Boolean(seed)) throw new Error("Set exactly one of MIDNIGHT_WALLET_MNEMONIC or MIDNIGHT_WALLET_SEED");
    if (seed && (!/^[0-9a-fA-F]+$/.test(seed) || seed.length % 2 !== 0)) throw new Error("MIDNIGHT_WALLET_SEED must be even-length hexadecimal without 0x");
    const dustOptions: DustWalletOptions = { ledgerParams: LedgerParameters.initialParameters(), additionalFeeOverhead: 1_000n, feeBlocksMargin: 5 };
    const base = FluentWalletBuilder.forEnvironment(environment).withDustOptions(dustOptions);
    const result = await (mnemonic ? base.withMnemonic(mnemonic).buildWithoutStarting() : base.withSeed(seed!).buildWithoutStarting());
    const typed = result as { wallet: WalletFacade; seeds: { shielded: Uint8Array; dust: Uint8Array }; keystore: UnshieldedKeystore };
    return new AquaWalletProvider(typed.wallet, ZswapSecretKeys.fromSeed(typed.seeds.shielded), DustSecretKey.fromSeed(typed.seeds.dust), typed.keystore);
  }
}
