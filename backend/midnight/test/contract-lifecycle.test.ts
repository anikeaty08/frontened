import { describe, expect, it } from "vitest";
import {
  createCircuitContext,
  createConstructorContext,
  dummyContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  ledger,
  type Witnesses,
} from "../contracts/managed/aqua-reserve-snapshot/contract/index.js";
import {
  authorizationCommitment,
  type AquaPrivateState,
} from "../src/contract.js";

const coinPublicKey =
  "8f27b8ed0dc33f85a08e295ff04970e9386ddd6e73e89dbffa6b8c6e36aacf45";
const bytes = (value: number): Uint8Array => new Uint8Array(32).fill(value);

interface HarnessOptions {
  liabilityTotal?: bigint;
  reserveTotal?: bigint;
  expiresAt?: bigint;
  blockTime?: number;
  witnessIssuerSecret?: Uint8Array;
  witnessAttesterSecret?: Uint8Array;
  witnessLiabilityOpening?: Uint8Array;
  witnessReserveOpening?: Uint8Array;
}

const createHarness = (options: HarnessOptions = {}) => {
  const issuerSecret = bytes(1);
  const attesterSecret = bytes(2);
  const committedPrivateState: AquaPrivateState = {
    liabilityTotal: options.liabilityTotal ?? 100n,
    liabilityEvidenceOpening: bytes(10),
    reserveTotal: options.reserveTotal ?? 120n,
    reserveTotalOpening: bytes(11),
  };
  const witnessPrivateState: AquaPrivateState = {
    ...committedPrivateState,
    liabilityEvidenceOpening:
      options.witnessLiabilityOpening ??
      committedPrivateState.liabilityEvidenceOpening,
    reserveTotalOpening:
      options.witnessReserveOpening ?? committedPrivateState.reserveTotalOpening,
  };
  const witnesses: Witnesses<AquaPrivateState> = {
    issuerAuthorizationSecret: ({ privateState }) => [
      privateState,
      options.witnessIssuerSecret ?? issuerSecret,
    ],
    attesterAuthorizationSecret: ({ privateState }) => [
      privateState,
      options.witnessAttesterSecret ?? attesterSecret,
    ],
    liabilityTotal: ({ privateState }) => [
      privateState,
      privateState.liabilityTotal,
    ],
    liabilityEvidenceOpening: ({ privateState }) => [
      privateState,
      privateState.liabilityEvidenceOpening,
    ],
    reserveTotal: ({ privateState }) => [
      privateState,
      privateState.reserveTotal,
    ],
    reserveTotalOpening: ({ privateState }) => [
      privateState,
      privateState.reserveTotalOpening,
    ],
  };
  const contract = new Contract(witnesses);
  const initial = contract.initialState(
    createConstructorContext(witnessPrivateState, coinPublicKey),
    bytes(3),
    authorizationCommitment("aqua:issuer-authorisation:v1", issuerSecret),
    authorizationCommitment("aqua:attester-authorisation:v1", attesterSecret),
    bytes(4),
    bytes(5),
    bytes(6),
    bytes(7),
    bytes(8),
    committedPrivateState.liabilityTotal,
    committedPrivateState.liabilityEvidenceOpening,
    committedPrivateState.reserveTotal,
    committedPrivateState.reserveTotalOpening,
    options.expiresAt ?? 2_000n,
  );
  const context = createCircuitContext(
    dummyContractAddress(),
    initial.currentZswapLocalState,
    initial.currentContractState,
    witnessPrivateState,
    undefined,
    undefined,
    options.blockTime ?? 1_000,
  );
  return { contract, context, initial };
};

describe("Aqua Reserve generated Compact lifecycle", () => {
  it("constructs an immutable pending snapshot with the supplied commitments", () => {
    const { initial } = createHarness();
    const state = ledger(initial.currentContractState.data);

    expect(state.status).toBe(0n);
    expect(state.expiresAt).toBe(2_000n);
    expect(state.attestedAt).toBe(0n);
    expect(state.membershipRoot).toEqual(bytes(6));
  });

  it("attests covered reserves as verified", () => {
    const { contract, context } = createHarness();
    const result = contract.circuits.attest(context, 1_001n);
    const state = ledger(result.context.currentQueryContext.state);

    expect(state.status).toBe(1n);
    expect(state.attestedAt).toBe(1_001n);
    expect(contract.circuits.isCurrent(result.context).result).toBe(true);
  });

  it("attests insufficient reserves as a shortfall", () => {
    const { contract, context } = createHarness({ reserveTotal: 99n });
    const result = contract.circuits.attest(context, 1_001n);

    expect(ledger(result.context.currentQueryContext.state).status).toBe(2n);
  });

  it("rejects an unapproved attester and expired attestation", () => {
    const unauthorized = createHarness({ witnessAttesterSecret: bytes(99) });
    expect(() =>
      unauthorized.contract.circuits.attest(unauthorized.context, 1_001n),
    ).toThrow(/Attester authorisation failed/);

    const expired = createHarness({ expiresAt: 1_000n, blockTime: 1_000 });
    expect(() => expired.contract.circuits.attest(expired.context, 1_001n)).toThrow(
      /Snapshot has expired/,
    );
  });

  it("rejects liability or reserve witnesses that do not open their commitments", () => {
    const wrongLiabilities = createHarness({ witnessLiabilityOpening: bytes(90) });
    expect(() =>
      wrongLiabilities.contract.circuits.attest(
        wrongLiabilities.context,
        1_001n,
      ),
    ).toThrow(/Liability evidence does not match its commitment/);

    const wrongReserves = createHarness({ witnessReserveOpening: bytes(91) });
    expect(() =>
      wrongReserves.contract.circuits.attest(wrongReserves.context, 1_001n),
    ).toThrow(/Reserve evidence does not match its commitment/);
  });

  it("requires issuer authority for revocation and prevents double revocation", () => {
    const unauthorized = createHarness({ witnessIssuerSecret: bytes(99) });
    expect(() =>
      unauthorized.contract.circuits.revoke(unauthorized.context, bytes(12)),
    ).toThrow(/Issuer authorisation failed/);

    const { contract, context } = createHarness();
    const revoked = contract.circuits.revoke(context, bytes(12));
    expect(ledger(revoked.context.currentQueryContext.state).status).toBe(3n);
    expect(contract.circuits.isCurrent(revoked.context).result).toBe(false);
    expect(() => contract.circuits.revoke(revoked.context, bytes(13))).toThrow(
      /Snapshot is already revoked/,
    );
  });
});
