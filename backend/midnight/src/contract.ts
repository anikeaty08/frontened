import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { CompactTypeBytes, CompactTypeVector, persistentHash } from "@midnight-ntwrk/compact-runtime";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, ledger, type Witnesses } from "../contracts/managed/aqua-reserve-snapshot/contract/index.js";

export interface AquaPrivateState {
  issuerAuthorizationSecret: Uint8Array;
  attesterAuthorizationSecret: Uint8Array;
}

const bytes32 = new CompactTypeBytes(32);
const vector2Bytes32 = new CompactTypeVector(2, bytes32);
const pad32 = (value: string): Uint8Array => {
  const encoded = new TextEncoder().encode(value);
  if (encoded.length > 32) throw new Error("Compact pad value exceeds 32 bytes");
  const padded = new Uint8Array(32);
  padded.set(encoded);
  return padded;
};

export const authorizationCommitment = (domain: string, secret: Uint8Array): Uint8Array =>
  persistentHash(vector2Bytes32, [pad32(domain), secret]);

const witnesses: Witnesses<AquaPrivateState> = {
  issuerAuthorizationSecret: ({ privateState }) => [privateState, privateState.issuerAuthorizationSecret],
  attesterAuthorizationSecret: ({ privateState }) => [privateState, privateState.attesterAuthorizationSecret],
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(currentDir, "..", "contracts", "managed", "aqua-reserve-snapshot");
export const CompiledAquaReserveContract = CompiledContract.make("AquaReserveSnapshot", Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
export { ledger };
