import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { AquaWalletProvider } from "./wallet.js";
import type { NetworkConfig } from "./network.js";

export const buildProviders = (wallet: AquaWalletProvider, snapshotId: string, config: NetworkConfig): MidnightProviders<any> => {
  const zkConfigProvider = new NodeZkConfigProvider<any>(new URL("../contracts/managed/aqua-reserve-snapshot", import.meta.url).pathname);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `aqua-reserve-${snapshotId}`,
      privateStoragePasswordProvider: () => process.env.AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD ?? "development-only-change-me",
      accountId: wallet.getCoinPublicKey(),
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
};
