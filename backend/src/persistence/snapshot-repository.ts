import type { EncryptedReceipt, ReserveSnapshot, SnapshotEvent, StoredSnapshot } from "../domain/types.js";

export type CreateSnapshotResult = { created: true } | { created: false; snapshot: ReserveSnapshot };

export class SnapshotRevisionConflictError extends Error {
  public constructor(snapshotId: string) {
    super(`Snapshot ${snapshotId} was updated concurrently`);
  }
}

export interface SnapshotRepository {
  create(snapshot: ReserveSnapshot, receipts: Map<string, EncryptedReceipt>, event: SnapshotEvent): Promise<CreateSnapshotResult>;
  findById(snapshotId: string): Promise<ReserveSnapshot | null>;
  findByIdempotencyKey(idempotencyKeyDigest: string): Promise<ReserveSnapshot | null>;
  getReceipt(snapshotId: string, customerReference: string): Promise<EncryptedReceipt | null>;
  update(snapshot: ReserveSnapshot, event: SnapshotEvent): Promise<ReserveSnapshot>;
  listEvents(snapshotId: string): Promise<SnapshotEvent[]>;
}

const cloneSnapshot = (snapshot: ReserveSnapshot): ReserveSnapshot => structuredClone(snapshot);
const cloneReceipt = (receipt: EncryptedReceipt): EncryptedReceipt => structuredClone(receipt);
const cloneEvent = (event: SnapshotEvent): SnapshotEvent => structuredClone(event);
const normalizeSnapshot = (snapshot: ReserveSnapshot): ReserveSnapshot => ({
  ...snapshot,
  revision: Number.isSafeInteger(snapshot.revision) && snapshot.revision >= 0 ? snapshot.revision : 0,
});

export class InMemorySnapshotRepository implements SnapshotRepository {
  private readonly snapshots = new Map<string, StoredSnapshot>();
  private readonly snapshotsByIdempotencyKey = new Map<string, string>();

  public async create(snapshot: ReserveSnapshot, receipts: Map<string, EncryptedReceipt>, event: SnapshotEvent): Promise<CreateSnapshotResult> {
    const existingId = this.snapshotsByIdempotencyKey.get(snapshot.idempotencyKeyDigest);
    if (existingId) {
      const existing = this.snapshots.get(existingId);
      if (!existing) throw new Error("Idempotency index is inconsistent");
      return { created: false, snapshot: cloneSnapshot(existing.snapshot) };
    }
    if (this.snapshots.has(snapshot.id)) {
      throw new Error(`Snapshot ${snapshot.id} already exists`);
    }
    this.snapshots.set(snapshot.id, {
      snapshot: cloneSnapshot(snapshot),
      receipts: new Map([...receipts.entries()].map(([key, receipt]) => [key, cloneReceipt(receipt)])),
      events: [cloneEvent(event)],
    });
    this.snapshotsByIdempotencyKey.set(snapshot.idempotencyKeyDigest, snapshot.id);
    return { created: true };
  }

  public async findById(snapshotId: string): Promise<ReserveSnapshot | null> {
    const stored = this.snapshots.get(snapshotId);
    return stored ? normalizeSnapshot(cloneSnapshot(stored.snapshot)) : null;
  }

  public async findByIdempotencyKey(idempotencyKeyDigest: string): Promise<ReserveSnapshot | null> {
    const snapshotId = this.snapshotsByIdempotencyKey.get(idempotencyKeyDigest);
    return snapshotId ? this.findById(snapshotId) : null;
  }

  public async getReceipt(snapshotId: string, customerReference: string): Promise<EncryptedReceipt | null> {
    const receipt = this.snapshots.get(snapshotId)?.receipts.get(customerReference);
    return receipt ? cloneReceipt(receipt) : null;
  }

  public async update(snapshot: ReserveSnapshot, event: SnapshotEvent): Promise<ReserveSnapshot> {
    const stored = this.snapshots.get(snapshot.id);
    if (!stored) {
      throw new Error(`Snapshot ${snapshot.id} does not exist`);
    }
    if (normalizeSnapshot(stored.snapshot).revision !== snapshot.revision) {
      throw new SnapshotRevisionConflictError(snapshot.id);
    }
    const next = { ...snapshot, revision: snapshot.revision + 1 };
    stored.snapshot = cloneSnapshot(next);
    stored.events.push(cloneEvent(event));
    return cloneSnapshot(next);
  }

  public async listEvents(snapshotId: string): Promise<SnapshotEvent[]> {
    return this.snapshots.get(snapshotId)?.events.map(cloneEvent) ?? [];
  }
}
