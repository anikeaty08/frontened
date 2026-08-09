import type pg from "pg";

interface Migration {
  version: string;
  statements: string[];
}

const migrations: Migration[] = [
  {
    version: "001_initial",
    statements: [
      `CREATE TABLE IF NOT EXISTS aqua_snapshots (
        id UUID PRIMARY KEY,
        idempotency_key TEXT NOT NULL UNIQUE,
        snapshot JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS aqua_snapshot_receipts (
        snapshot_id UUID NOT NULL REFERENCES aqua_snapshots(id) ON DELETE RESTRICT,
        customer_reference TEXT NOT NULL,
        encrypted_receipt JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (snapshot_id, customer_reference)
      )`,
      `CREATE TABLE IF NOT EXISTS aqua_snapshot_events (
        id UUID PRIMARY KEY,
        snapshot_id UUID NOT NULL REFERENCES aqua_snapshots(id) ON DELETE RESTRICT,
        event JSONB NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS aqua_snapshot_events_snapshot_id_idx ON aqua_snapshot_events(snapshot_id, occurred_at)",
    ],
  },
  {
    // Supports databases created by the pre-migration Phase 1 prototype.
    version: "002_idempotency_index",
    statements: [
      "ALTER TABLE aqua_snapshots ADD COLUMN IF NOT EXISTS idempotency_key TEXT",
      "CREATE UNIQUE INDEX IF NOT EXISTS aqua_snapshots_idempotency_key_idx ON aqua_snapshots(idempotency_key) WHERE idempotency_key IS NOT NULL",
    ],
  },
];

export const runMigrations = async (pool: pg.Pool): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('aqua-reserve-schema-migrations'))");
    await client.query(`CREATE TABLE IF NOT EXISTS aqua_schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const applied = await client.query<{ version: string }>("SELECT version FROM aqua_schema_migrations");
    const appliedVersions = new Set(applied.rows.map((row) => row.version));
    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) continue;
      await client.query("BEGIN");
      try {
        for (const statement of migration.statements) await client.query(statement);
        await client.query("INSERT INTO aqua_schema_migrations (version) VALUES ($1)", [migration.version]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(hashtext('aqua-reserve-schema-migrations'))");
    } finally {
      client.release();
    }
  }
};
