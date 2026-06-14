import { execute } from './db.native';

/**
 * Run initial migrations for the native SQLite database.
 * The function is idempotent and safe to call on every app start.
 */
export async function runMigrations(): Promise<void> {
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
      sync_pending INTEGER NOT NULL DEFAULT 0
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

  // ── New tables for offline sync ────────────────────────────────────────────

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

  // ── Add sync columns to existing tables ────────────────────────────────────

  const addSyncColumnsToTags = `
    ALTER TABLE tags ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE tags ADD COLUMN updated_by TEXT;
    ALTER TABLE tags ADD COLUMN farm_id TEXT;
  `;

  // ── Sync metadata table ────────────────────────────────────────────────────

  const createSyncMetadataTable = `
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `;

  const migrations = [
    createSessionTable,
    createTagsTable,
    createAuditRecordsTable,
    createIndexes,
    createFarmsTable,
    createUsersTable,
    createNewIndexes,
    createSyncMetadataTable,
  ];

  try {
    for (const sql of migrations) {
      const result = execute(sql);
      // Some SQLite drivers return a Promise, others are synchronous
      if (result && typeof (result as any).then === 'function') {
        await result;
      }
    }
  } catch (err) {
    // Surface the error but keep it explicit for callers to decide recovery
    // Do not silently swallow migration errors.
    console.error('runMigrations failed', err);
    throw err;
  }
}

export default runMigrations;
