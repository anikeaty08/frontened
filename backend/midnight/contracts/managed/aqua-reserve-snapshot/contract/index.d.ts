import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  issuerAuthorizationSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  attesterAuthorizationSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  liabilityTotal(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  liabilityEvidenceOpening(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  reserveTotal(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  reserveTotalOpening(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  assertIssuerAuthorised(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  attest(context: __compactRuntime.CircuitContext<PS>, attestationTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, reasonHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  isCurrent(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  assertIssuerAuthorised(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  attest(context: __compactRuntime.CircuitContext<PS>, attestationTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, reasonHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  isCurrent(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  assertIssuerAuthorised(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  attest(context: __compactRuntime.CircuitContext<PS>, attestationTime_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, reasonHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  isCurrent(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  readonly status: bigint;
  readonly snapshotId: Uint8Array;
  readonly issuerAuthorizationCommitment: Uint8Array;
  readonly attesterAuthorizationCommitment: Uint8Array;
  readonly scopeManifestHash: Uint8Array;
  readonly liabilityRoot: Uint8Array;
  readonly membershipRoot: Uint8Array;
  readonly reserveEvidenceCommitment: Uint8Array;
  readonly coverageEvidenceCommitment: Uint8Array;
  readonly liabilityEvidenceCommitment: Uint8Array;
  readonly reserveTotalCommitment: Uint8Array;
  readonly expiresAt: bigint;
  readonly attestedAt: bigint;
  readonly revocationReasonHash: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               initialSnapshotId_0: Uint8Array,
               initialIssuerAuthorizationCommitment_0: Uint8Array,
               initialAttesterAuthorizationCommitment_0: Uint8Array,
               initialScopeManifestHash_0: Uint8Array,
               initialLiabilityRoot_0: Uint8Array,
               initialMembershipRoot_0: Uint8Array,
               initialReserveEvidenceCommitment_0: Uint8Array,
               initialCoverageEvidenceCommitment_0: Uint8Array,
               initialLiabilityTotal_0: bigint,
               initialLiabilityEvidenceOpening_0: Uint8Array,
               initialReserveTotal_0: bigint,
               initialReserveTotalOpening_0: Uint8Array,
               initialExpiresAt_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
