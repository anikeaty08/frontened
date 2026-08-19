import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { CompactTypeBytes, CompactTypeVector, convertFieldToBytes, persistentCommit, persistentHash } from "@midnight-ntwrk/compact-runtime";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Contract, ledger, type Witnesses } from "../contracts/managed/aqua-reserve-snapshot/contract/index.js";

export interface AquaPrivateState {
  liabilityTotal: bigint;
  liabilityEvidenceOpening: Uint8Array;
  reserveTotal: bigint;
  reserveTotalOpening: Uint8Array;
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

export const authorizationSecretFromEnvironment = (name: "AQUA_MIDNIGHT_ISSUER_AUTH_SECRET_HEX" | "AQUA_MIDNIGHT_ATTESTER_AUTH_SECRET_HEX"): Uint8Array => {
  const value = process.env[name] ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error(`${name} must be a 32-byte hexadecimal value`);
  return Uint8Array.from(Buffer.from(value, "hex"));
};

export const authorizationCommitment = (domain: string, secret: Uint8Array): Uint8Array =>
  persistentHash(vector2Bytes32, [pad32(domain), secret]);

export const totalEvidenceCommitment = (publicEvidence: Uint8Array, total: bigint, opening: Uint8Array): Uint8Array =>
  persistentCommit(vector2Bytes32, [publicEvidence, convertFieldToBytes(32, total, "Uint<64>")], opening);

const witnesses: Witnesses<AquaPrivateState> = {
  issuerAuthorizationSecret: ({ privateState }) => [privateState, authorizationSecretFromEnvironment("AQUA_MIDNIGHT_ISSUER_AUTH_SECRET_HEX")],
  attesterAuthorizationSecret: ({ privateState }) => [privateState, authorizationSecretFromEnvironment("AQUA_MIDNIGHT_ATTESTER_AUTH_SECRET_HEX")],
  liabilityTotal: ({ privateState }) => [privateState, privateState.liabilityTotal],
  liabilityEvidenceOpening: ({ privateState }) => [privateState, privateState.liabilityEvidenceOpening],
  reserveTotal: ({ privateState }) => [privateState, privateState.reserveTotal],
  reserveTotalOpening: ({ privateState }) => [privateState, privateState.reserveTotalOpening],
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(currentDir, "..", "contracts", "managed", "aqua-reserve-snapshot");
export const CompiledAquaReserveContract = CompiledContract.make("AquaReserveSnapshot", Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
export { ledger };
