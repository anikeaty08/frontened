import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { fileURLToPath } from "node:url";
import { AquaWalletProvider } from "./wallet.js";
import type { NetworkConfig } from "./network.js";

export const buildProviders = (wallet: AquaWalletProvider, snapshotId: string, config: NetworkConfig): MidnightProviders<any> => {
  const zkConfigProvider = new NodeZkConfigProvider<any>(zkConfigDirectory);
  const privateStoragePassword = process.env.AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD;
  if (!privateStoragePassword) throw new Error("AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD is required for Midnight private state storage");
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `aqua-reserve-${snapshotId}`,
      privateStoragePasswordProvider: () => privateStoragePassword,
      accountId: wallet.getCoinPublicKey(),
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
};

// URL.pathname is not a valid Windows filesystem path (it prefixes drive paths
// with a slash). The ZK provider reads Compact key files from disk, so convert
// the module-relative URL with Node's cross-platform file-URL helper.
export const zkConfigDirectory = fileURLToPath(new URL("../contracts/managed/aqua-reserve-snapshot", import.meta.url));
