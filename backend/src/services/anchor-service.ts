import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import type { AnchorRecord, ChainState, SnapshotStatus } from "../domain/types.js";

export interface AnchorPayload {
  snapshotId: string;
  scopeManifestHash: string;
  liabilityCommitment: string;
  reserveEvidenceCommitment: string;
  coverageEvidenceCommitment: string;
  expiresAt: string;
}

export interface AttestPayload {
  snapshotId: string;
  contractAddress: string;
  result: Extract<SnapshotStatus, "VERIFIED" | "SHORTFALL">;
  attestedAt: string;
}

export interface RevokePayload {
  snapshotId: string;
  contractAddress: string;
  reason: string;
}

export interface LifecycleTransaction {
  transactionId: string | null;
  recordedAt: string;
}

export interface AnchorService {
  prepare(payload: AnchorPayload): AnchorRecord;
  deploy(payload: AnchorPayload): Promise<AnchorRecord>;
  attest(payload: AttestPayload): Promise<LifecycleTransaction>;
  revoke(payload: RevokePayload): Promise<LifecycleTransaction>;
  read(contractAddress: string): Promise<ChainState>;
}

export const lifecycleCommitment = (payload: AnchorPayload): string =>
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

export class DevelopmentAnchorService implements AnchorService {
  public prepare(payload: AnchorPayload): AnchorRecord {
    return {
      mode: "DEVELOPMENT",
      status: "CONFIRMED",
      contractAddress: null,
      commitment: lifecycleCommitment(payload),
      transactionId: null,
      recordedAt: new Date().toISOString(),
      failure: null,
    };
  }

  public async deploy(payload: AnchorPayload): Promise<AnchorRecord> { return this.prepare(payload); }
  public async attest(): Promise<LifecycleTransaction> { return { transactionId: null, recordedAt: new Date().toISOString() }; }
  public async revoke(): Promise<LifecycleTransaction> { return { transactionId: null, recordedAt: new Date().toISOString() }; }
  public async read(): Promise<ChainState> { throw new Error("Development lifecycle has no public Midnight state"); }
}

export interface LifecycleRunner {
  run(command: "deploy", payload: AnchorPayload): Promise<Record<string, string>>;
  run(command: "attest", payload: AttestPayload): Promise<Record<string, string>>;
  run(command: "revoke", payload: RevokePayload): Promise<Record<string, string>>;
  run(command: "inspect", payload: { contractAddress: string }): Promise<Record<string, string>>;
}

export class NodeLifecycleRunner implements LifecycleRunner {
  public constructor(private readonly workerDirectory: string) {}

  public async run(command: "deploy" | "attest" | "revoke" | "inspect", payload: AnchorPayload | AttestPayload | RevokePayload | { contractAddress: string }): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const executable = process.platform === "win32" ? "npm.cmd" : "npm";
      const child = spawn(executable, ["run", "lifecycle", "--", command], {
        cwd: this.workerDirectory,
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
      child.once("error", reject);
      child.once("close", (code) => {
        const output = Buffer.concat(stdout).toString("utf8").trim();
        const error = Buffer.concat(stderr).toString("utf8").trim().slice(-4_000);
        if (code !== 0) return reject(new Error(`Midnight lifecycle ${command} failed${error ? `: ${error}` : ""}`));
        try {
          const parsed: unknown = JSON.parse(output);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Lifecycle command returned a non-object payload");
          return resolve(parsed as Record<string, string>);
        } catch (cause) {
          return reject(cause instanceof Error ? cause : new Error("Lifecycle command returned invalid JSON"));
        }
      });
      child.stdin.end(JSON.stringify(payload));
    });
  }
}

const required = (response: Record<string, string>, name: string): string => {
  const value = response[name];
  if (!value) throw new Error(`Midnight lifecycle response is missing ${name}`);
  return value;
};

const asStatus = (value: string): Extract<SnapshotStatus, "PENDING_ATTESTATION" | "VERIFIED" | "SHORTFALL" | "REVOKED"> => {
  if (value === "PENDING_ATTESTATION" || value === "VERIFIED" || value === "SHORTFALL" || value === "REVOKED") return value;
  throw new Error(`Midnight lifecycle returned an unsupported status: ${value}`);
};

export class MidnightDirectAnchorService implements AnchorService {
  public constructor(private readonly runner: LifecycleRunner) {}

  public prepare(payload: AnchorPayload): AnchorRecord {
    return {
      mode: "MIDNIGHT_PREPROD",
      status: "PENDING",
      contractAddress: null,
      commitment: lifecycleCommitment(payload),
      transactionId: null,
      recordedAt: new Date().toISOString(),
      failure: null,
    };
  }

  public async deploy(payload: AnchorPayload): Promise<AnchorRecord> {
    const response = await this.runner.run("deploy", payload);
    if (required(response, "operation") !== "DEPLOYED") throw new Error("Midnight deploy did not return DEPLOYED");
    if (required(response, "commitment") !== lifecycleCommitment(payload)) throw new Error("Midnight deploy commitment did not bind the submitted snapshot");
    return {
      mode: "MIDNIGHT_PREPROD",
      status: "CONFIRMED",
      contractAddress: required(response, "contractAddress"),
      commitment: required(response, "commitment"),
      transactionId: required(response, "transactionId"),
      recordedAt: required(response, "recordedAt"),
      failure: null,
    };
  }

  public async attest(payload: AttestPayload): Promise<LifecycleTransaction> {
    const response = await this.runner.run("attest", payload);
    if (required(response, "operation") !== "ATTESTED") throw new Error("Midnight attestation did not return ATTESTED");
    return { transactionId: required(response, "transactionId"), recordedAt: required(response, "recordedAt") };
  }

  public async revoke(payload: RevokePayload): Promise<LifecycleTransaction> {
    const response = await this.runner.run("revoke", payload);
    if (required(response, "operation") !== "REVOKED") throw new Error("Midnight revocation did not return REVOKED");
    return { transactionId: required(response, "transactionId"), recordedAt: required(response, "recordedAt") };
  }

  public async read(contractAddress: string): Promise<ChainState> {
    const response = await this.runner.run("inspect", { contractAddress });
    if (required(response, "operation") !== "INSPECTED") throw new Error("Midnight inspection did not return INSPECTED");
    return {
      contractAddress: required(response, "contractAddress"),
      status: asStatus(required(response, "status")),
      snapshotIdentifier: required(response, "snapshotIdentifier"),
      scopeManifestHash: required(response, "scopeManifestHash"),
      liabilityCommitment: required(response, "liabilityCommitment"),
      reserveEvidenceCommitment: required(response, "reserveEvidenceCommitment"),
      coverageEvidenceCommitment: required(response, "coverageEvidenceCommitment"),
      expiresAt: required(response, "expiresAt"),
      attestedAt: required(response, "attestedAt"),
      revocationReasonHash: required(response, "revocationReasonHash"),
    };
  }
}
