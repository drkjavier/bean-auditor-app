import { execute, queryRows } from './db.native';

type Migration = {
  version: number;
  description: string;
  run: () => Promise<void>;
};

/**
 * Run pending migrations for the SQLite database.
 * The function is idempotent and safe to call on every app start.
 *
 * Migrations are versioned in the schema_version table and each version is
 * recorded ONLY after its statements succeed, so a failed migration is
 * retried on the next app start. Every step is idempotent (CREATE TABLE /
 * CREATE INDEX IF NOT EXISTS, PRAGMA-guarded ALTERs), which makes retries
 * safe without explicit transactions (avoids sql.js shim quirks).
 */
export async function runMigrations(): Promise<void> {
  try {
    await runSql(CREATE_SCHEMA_VERSION_TABLE);

    const appliedRows = queryRows('SELECT version FROM schema_version;', []);
    const applied = new Set(appliedRows.map((row: Record<string, unknown>) => Number(row.version)));

    for (const migration of MIGRATIONS) {
      if (applied.has(migration.version)) continue;
      await migration.run();
      await runSql(
        `INSERT INTO schema_version (version, description) VALUES (?, ?);`,
        [migration.version, migration.description],
      );
    }
  } catch (err) {
    // Surface the error but keep it explicit for callers to decide recovery
    // Do not silently swallow migration errors.
    console.error('runMigrations failed', err);
    throw err;
  }
}

/** Highest applied migration version (0 when nothing was applied yet). */
export async function getSchemaVersion(): Promise<number> {
  try {
    const rows = queryRows('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;', []);
    if (rows.length === 0) return 0;
    return Number(rows[0].version) || 0;
  } catch {
    // schema_version may not exist yet (before the first migration)
    return 0;
  }
}

// ── SQL: schema_version ────────────────────────────────────────────────────

const CREATE_SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY NOT NULL,
    description TEXT NOT NULL,
    applied_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`;

// ── SQL: table definitions ─────────────────────────────────────────────────

const createSessionTable = `
  CREATE TABLE IF NOT EXISTS user_session (
    id INTEGER PRIMARY KEY NOT NULL,
    username TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

const createTagsTable = `
  CREATE TABLE IF NOT EXISTS tags (
    uuid TEXT PRIMARY KEY NOT NULL,
    colorHex TEXT NOT NULL,
    unique_id TEXT NOT NULL UNIQUE,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    timestamp TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    sync_pending INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    farm_id TEXT
  );
`;

const createAuditRecordsTable = `
  CREATE TABLE IF NOT EXISTS audit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    uuid_tag TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('audited', 'not_audited', 'pending')),
    timestamp INTEGER NOT NULL,
    username TEXT NOT NULL,
    lat REAL,
    lon REAL,
    note TEXT,
    sync_pending INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (uuid_tag) REFERENCES tags(uuid) ON DELETE CASCADE
  );
`;

const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_audit_uuid_tag ON audit_records(uuid_tag);
  CREATE INDEX IF NOT EXISTS idx_audit_sync_pending ON audit_records(sync_pending);
  CREATE INDEX IF NOT EXISTS idx_tags_unique_id ON tags(unique_id);
  CREATE INDEX IF NOT EXISTS idx_tags_sync_pending ON tags(sync_pending);
`;

const createFarmsTable = `
  CREATE TABLE IF NOT EXISTS farms (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    owner TEXT NOT NULL,
    area_hectares REAL,
    status TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    sync_pending INTEGER NOT NULL DEFAULT 0
  );
`;

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'auditor', 'viewer')) DEFAULT 'viewer',
    is_active INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    sync_pending INTEGER NOT NULL DEFAULT 0
  );
`;

const createNewIndexes = `
  CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);
  CREATE INDEX IF NOT EXISTS idx_farms_sync_pending ON farms(sync_pending);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_sync_pending ON users(sync_pending);
`;

const createSyncMetadataTable = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`;

const createAppSettingsTable = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean')) DEFAULT 'string',
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    sync_pending INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`;

const createAppSettingsIndex = `
  CREATE INDEX IF NOT EXISTS idx_app_settings_sync_pending ON app_settings(sync_pending);
`;

/**
 * Offline query indexes derived from the app's real query patterns:
 * - idx_audit_uuid_tag_time: latest audit per tag (getAuditStatus,
 *   getLatestAudit, getTagsWithAuditStatus, countByStatus)
 * - idx_audit_sync_pending_time: pending audits ordered by timestamp
 * - idx_tags_sync_pending_updated: pending tags ordered by updated_at
 */
const createOfflineIndexes = `
  CREATE INDEX IF NOT EXISTS idx_audit_uuid_tag_time ON audit_records(uuid_tag, timestamp DESC, id DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_sync_pending_time ON audit_records(sync_pending, timestamp);
  CREATE INDEX IF NOT EXISTS idx_tags_sync_pending_updated ON tags(sync_pending, updated_at);
`;

// ── tags sync columns (guarded ALTERs for pre-existing databases) ──────────
// tags originally lacked the sync conflict columns declared in the domain
// model (TagRecord). Existing databases are upgraded via PRAGMA-guarded ALTERs.

const tagColumnUpgrades = [
  { column: 'version', ddl: 'version INTEGER NOT NULL DEFAULT 1' },
  { column: 'updated_by', ddl: 'updated_by TEXT' },
  { column: 'farm_id', ddl: 'farm_id TEXT' },
];

// ── Migration registry ─────────────────────────────────────────────────────

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'core offline schema: user_session, tags, audit_records, farms, users, sync_metadata',
    run: async () => {
      await runSql(createSessionTable);
      await runSql(createTagsTable);
      await runSql(createAuditRecordsTable);
      await runSql(createIndexes);
      await runSql(createFarmsTable);
      await runSql(createUsersTable);
      await runSql(createNewIndexes);
      await runSql(createSyncMetadataTable);
    },
  },
  {
    version: 2,
    description: 'tags sync conflict columns: version, updated_by, farm_id (guarded ALTERs)',
    run: async () => {
      for (const upgrade of tagColumnUpgrades) {
        await ensureColumn('tags', upgrade.column, upgrade.ddl);
      }
    },
  },
  {
    version: 3,
    description: 'app_settings key/value table + sync index',
    run: async () => {
      await runSql(createAppSettingsTable);
      await runSql(createAppSettingsIndex);
    },
  },
  {
    version: 4,
    description: 'offline query indexes: latest audit per tag, pending sync scans',
    run: async () => {
      await runSql(createOfflineIndexes);
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Execute SQL, awaiting when the driver returns a Promise
 * (some SQLite drivers are synchronous, others are not).
 */
async function runSql(sql: string, params: (string | number | null)[] = []): Promise<void> {
  const result = execute(sql, params);
  if (result && typeof (result as any).then === 'function') {
    await result;
  }
}

/**
 * Add a column to an existing table if it is missing.
 * Uses PRAGMA table_info so the migration stays idempotent across drivers.
 */
async function ensureColumn(table: string, column: string, columnDdl: string): Promise<void> {
  const rows = queryRows(`PRAGMA table_info(${table});`, []);
  const exists = rows.some(
    (row: Record<string, unknown>) => String(row.name).toLowerCase() === column.toLowerCase(),
  );
  if (!exists) {
    await runSql(`ALTER TABLE ${table} ADD COLUMN ${columnDdl};`);
  }
}

export default runMigrations;
