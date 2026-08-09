import pg from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { readFileSync } from "node:fs";
import type { RdsIamConfig } from "../config.js";
import type { EncryptedReceipt, ReserveSnapshot, SnapshotEvent } from "../domain/types.js";
import type { SnapshotRepository } from "./snapshot-repository.js";
import { runMigrations } from "./migrations.js";

const { Pool } = pg;

export class PostgresSnapshotRepository implements SnapshotRepository {
  private readonly pool: pg.Pool;

  public constructor(connection: string | pg.PoolConfig) {
    this.pool = new Pool(typeof connection === "string" ? { connectionString: connection, max: 10 } : connection);
  }

  public static fromRdsIam(config: RdsIamConfig, requireTlsVerification: boolean): PostgresSnapshotRepository {
    const signer = new Signer({
      hostname: config.host,
      port: config.port,
      username: config.username,
      region: config.region,
    });
    const ssl = config.caCertificatePath
      ? { ca: readFileSync(config.caCertificatePath, "utf8"), rejectUnauthorized: true }
      : requireTlsVerification
        ? (() => {
            throw new Error("RDS_CA_CERT_PATH is required when TLS verification is enabled");
          })()
        : { rejectUnauthorized: false };
    return new PostgresSnapshotRepository({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: () => signer.getAuthToken(),
      ssl,
      max: 10,
    });
  }

  public async migrate(): Promise<void> {
    await runMigrations(this.pool);
  }

  public async create(snapshot: ReserveSnapshot, receipts: Map<string, EncryptedReceipt>, event: SnapshotEvent) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO aqua_snapshots (id, idempotency_key, snapshot) VALUES ($1, $2, $3::jsonb)", [
        snapshot.id,
        snapshot.idempotencyKeyDigest,
        JSON.stringify(snapshot),
      ]);
      for (const [customerReference, receipt] of receipts) {
        await client.query(
          "INSERT INTO aqua_snapshot_receipts (snapshot_id, customer_reference, encrypted_receipt) VALUES ($1, $2, $3::jsonb)",
          [snapshot.id, customerReference, JSON.stringify(receipt)],
        );
      }
      await this.insertEvent(client, event);
      await client.query("COMMIT");
      return { created: true } as const;
    } catch (error) {
      await client.query("ROLLBACK");
      if (isUniqueViolation(error)) {
        const existing = await this.findByIdempotencyKey(snapshot.idempotencyKeyDigest);
        if (existing) return { created: false, snapshot: existing } as const;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  public async findById(snapshotId: string): Promise<ReserveSnapshot | null> {
    const result = await this.pool.query<{ snapshot: ReserveSnapshot }>("SELECT snapshot FROM aqua_snapshots WHERE id = $1", [snapshotId]);
    return result.rows[0]?.snapshot ?? null;
  }

  public async findByIdempotencyKey(idempotencyKeyDigest: string): Promise<ReserveSnapshot | null> {
    const result = await this.pool.query<{ snapshot: ReserveSnapshot }>(
      "SELECT snapshot FROM aqua_snapshots WHERE idempotency_key = $1",
      [idempotencyKeyDigest],
    );
    return result.rows[0]?.snapshot ?? null;
  }

  public async getReceipt(snapshotId: string, customerReference: string): Promise<EncryptedReceipt | null> {
    const result = await this.pool.query<{ encrypted_receipt: EncryptedReceipt }>(
      "SELECT encrypted_receipt FROM aqua_snapshot_receipts WHERE snapshot_id = $1 AND customer_reference = $2",
      [snapshotId, customerReference],
    );
    return result.rows[0]?.encrypted_receipt ?? null;
  }

  public async update(snapshot: ReserveSnapshot, event: SnapshotEvent): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query("UPDATE aqua_snapshots SET snapshot = $2::jsonb WHERE id = $1", [snapshot.id, JSON.stringify(snapshot)]);
      if (result.rowCount !== 1) throw new Error(`Snapshot ${snapshot.id} does not exist`);
      await this.insertEvent(client, event);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async listEvents(snapshotId: string): Promise<SnapshotEvent[]> {
    const result = await this.pool.query<{ event: SnapshotEvent }>(
      "SELECT event FROM aqua_snapshot_events WHERE snapshot_id = $1 ORDER BY occurred_at ASC",
      [snapshotId],
    );
    return result.rows.map((row) => row.event);
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  private async insertEvent(client: pg.PoolClient, event: SnapshotEvent): Promise<void> {
    await client.query("INSERT INTO aqua_snapshot_events (id, snapshot_id, event, occurred_at) VALUES ($1, $2, $3::jsonb, $4)", [
      event.id,
      event.snapshotId,
      JSON.stringify(event),
      event.occurredAt,
    ]);
  }
}

const isUniqueViolation = (error: unknown): error is { code: string } =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "23505";
