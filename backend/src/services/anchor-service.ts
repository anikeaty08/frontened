import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import type { AnchorRecord, ChainState, SnapshotStatus } from "../domain/types.js";

export interface AnchorPayload {
  snapshotId: string;
  scopeManifestHash: string;
  liabilityCommitment: string;
  membershipRoot: string;
  liabilityTotalBaseUnits: string;
  reserveEvidenceCommitment: string;
  reserveTotalBaseUnits: string;
  coverageEvidenceCommitment: string;
  expiresAt: string;
}

export interface AttestPayload {
  snapshotId: string;
  contractAddress: string;
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
      payload.membershipRoot,
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
      proofCommitments: null,
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
  private daemon: ReturnType<typeof spawn> | undefined;
  private nextRequestId = 1;
  private stdoutRemainder = "";
  private stderrTail = "";
  private readonly pending = new Map<number, { resolve: (value: Record<string, string>) => void; reject: (reason: Error) => void }>();

  public constructor(private readonly workerDirectory: string) {}

  private rejectPending(reason: Error): void {
    for (const request of this.pending.values()) request.reject(reason);
    this.pending.clear();
  }

  private handleOutput(chunk: Buffer): void {
    this.stdoutRemainder += chunk.toString("utf8");
    const lines = this.stdoutRemainder.split(/\r?\n/);
    this.stdoutRemainder = lines.pop() ?? "";
    for (const line of lines) {
      try {
        const response: unknown = JSON.parse(line);
        if (!response || typeof response !== "object" || Array.isArray(response)) continue;
        const { id, ok, result, error } = response as { id?: unknown; ok?: unknown; result?: unknown; error?: unknown };
        if (!Number.isSafeInteger(id) || typeof ok !== "boolean") continue;
        const request = this.pending.get(id as number);
        if (!request) continue;
        this.pending.delete(id as number);
        if (!ok) {
          request.reject(new Error(`Midnight lifecycle failed: ${typeof error === "string" ? error : "unknown daemon error"}`));
          continue;
        }
        if (!result || typeof result !== "object" || Array.isArray(result)) {
          request.reject(new Error("Midnight lifecycle daemon returned an invalid result"));
          continue;
        }
        request.resolve(result as Record<string, string>);
      } catch {
        // Dependency logs are allowed on stdout; only protocol-shaped messages are consumed.
      }
    }
  }

  private ensureDaemon(): ReturnType<typeof spawn> {
    if (this.daemon && !this.daemon.killed && this.daemon.exitCode === null) return this.daemon;
    const windows = process.platform === "win32";
    const executable = windows ? (process.env.ComSpec ?? "cmd.exe") : "npm";
    const args = windows ? ["/d", "/s", "/c", "npm run lifecycle:daemon"] : ["run", "lifecycle:daemon"];
    const child = spawn(executable, args, {
      cwd: this.workerDirectory,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    this.daemon = child;
    child.stdout.on("data", (chunk: Buffer) => this.handleOutput(chunk));
    child.stderr.on("data", (chunk: Buffer) => {
      const output = chunk.toString("utf8");
      this.stderrTail = `${this.stderrTail}${output}`.slice(-4_000);
      process.stderr.write(`[midnight-worker] ${output}`);
    });
    child.once("error", (cause) => {
      this.daemon = undefined;
      this.rejectPending(new Error(`Midnight lifecycle daemon failed to start: ${cause.message}`));
    });
    child.once("close", (code) => {
      this.daemon = undefined;
      this.rejectPending(new Error(`Midnight lifecycle daemon stopped (code ${code ?? "unknown"})${this.stderrTail ? `: ${this.stderrTail.trim()}` : ""}`));
    });
    return child;
  }

  public async run(command: "deploy" | "attest" | "revoke" | "inspect", payload: AnchorPayload | AttestPayload | RevokePayload | { contractAddress: string }): Promise<Record<string, string>> {
    const child = this.ensureDaemon();
    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      if (!child.stdin) return reject(new Error("Midnight lifecycle daemon does not have a writable input channel"));
      this.pending.set(id, { resolve, reject });
      child.stdin.write(`${JSON.stringify({ id, command, payload })}\n`, (error) => {
        if (!error) return;
        const request = this.pending.get(id);
        this.pending.delete(id);
        request?.reject(new Error(`Midnight lifecycle daemon request failed: ${error.message}`));
      });
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
      proofCommitments: null,
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
      proofCommitments: {
        liabilityEvidenceCommitment: required(response, "liabilityEvidenceCommitment"),
        reserveTotalCommitment: required(response, "reserveTotalCommitment"),
      },
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
      membershipRoot: required(response, "membershipRoot"),
      reserveEvidenceCommitment: required(response, "reserveEvidenceCommitment"),
      coverageEvidenceCommitment: required(response, "coverageEvidenceCommitment"),
      liabilityEvidenceCommitment: required(response, "liabilityEvidenceCommitment"),
      reserveTotalCommitment: required(response, "reserveTotalCommitment"),
      expiresAt: required(response, "expiresAt"),
      attestedAt: required(response, "attestedAt"),
      revocationReasonHash: required(response, "revocationReasonHash"),
    };
  }
}
