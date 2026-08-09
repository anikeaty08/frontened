export type MidnightNetwork = "local" | "preview" | "preprod";

export interface NetworkConfig {
  networkId: MidnightNetwork | "undeployed";
  indexer: string;
  indexerWS: string;
  node: string;
  nodeWS: string;
  proofServer: string;
  faucet: string;
}

const proofServer = (): string => process.env.MIDNIGHT_PROOF_SERVER ?? "http://127.0.0.1:6300";

const networks: Record<MidnightNetwork, NetworkConfig> = {
  local: {
    networkId: "undeployed",
    indexer: "http://127.0.0.1:8088/api/v4/graphql",
    indexerWS: "ws://127.0.0.1:8088/api/v4/graphql/ws",
    node: "http://127.0.0.1:9944",
    nodeWS: "ws://127.0.0.1:9944",
    proofServer: proofServer(),
    faucet: "",
  },
  preview: {
    networkId: "preview",
    indexer: "https://indexer.preview.midnight.network/api/v4/graphql",
    indexerWS: "wss://indexer.preview.midnight.network/api/v4/graphql/ws",
    node: "https://rpc.preview.midnight.network",
    nodeWS: "wss://rpc.preview.midnight.network",
    proofServer: proofServer(),
    faucet: "https://midnight-tmnight-preview.nethermind.dev/",
  },
  preprod: {
    networkId: "preprod",
    indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
    node: "https://rpc.preprod.midnight.network",
    nodeWS: "wss://rpc.preprod.midnight.network",
    proofServer: proofServer(),
    faucet: "https://midnight-tmnight-preprod.nethermind.dev/",
  },
};

export const getNetworkConfig = (): NetworkConfig => {
  // Preprod is the public network used for final validation before mainnet.
  // Preview remains available for early integration testing via MIDNIGHT_NETWORK=preview.
  const requested = process.env.MIDNIGHT_NETWORK ?? "preprod";
  if (requested !== "local" && requested !== "preview" && requested !== "preprod") {
    throw new Error("MIDNIGHT_NETWORK must be local, preview, or preprod");
  }
  return networks[requested];
};
