/**
 * SQLite migrations tests.
 *
 * These tests exercise the REAL runMigrations() against the in-memory mock.
 * The mock registers schemas and validates columns, so these tests catch
 * schema mismatches (like the missing tags sync columns) before runtime.
 */

import { mockDb } from '../helpers/sqliteMock';

// Use the real migrations (db.native is mocked by sqliteMock to hit mockDb)
const migrationsModule = jest.requireActual<{
  default: () => Promise<void>;
  runMigrations: () => Promise<void>;
  getSchemaVersion: () => Promise<number>;
}>('../../src/data/sqlite/migrations.native');
const runMigrations = migrationsModule.default;
const getSchemaVersion = migrationsModule.getSchemaVersion;

const OLD_TAGS_DDL = `
  CREATE TABLE IF NOT EXISTS tags (
    uuid TEXT PRIMARY KEY NOT NULL,
    colorHex TEXT NOT NULL,
    unique_id TEXT NOT NULL UNIQUE,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    timestamp TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_pending INTEGER NOT NULL DEFAULT 0
  );
`;

describe('SQLite Migrations', () => {
  beforeEach(() => {
    mockDb.clear();
  });

  // ── Fresh database ──────────────────────────────────────────────────────

  test('creates the full tags schema on a fresh database', async () => {
    await runMigrations();

    const schema = mockDb.getSchema('tags');
    expect(schema).toEqual(
      expect.arrayContaining([
        'uuid',
        'colorHex',
        'unique_id',
        'lat',
        'lon',
        'timestamp',
        'created_at',
        'updated_at',
        'sync_pending',
        'version',
        'updated_by',
        'farm_id',
      ]),
    );
  });

  test('creates all sync tables', async () => {
    await runMigrations();

    for (const table of [
      'user_session',
      'tags',
      'audit_records',
      'farms',
      'users',
      'sync_metadata',
      'app_settings',
      'schema_version',
    ]) {
      expect(mockDb.getSchema(table).length).toBeGreaterThan(0);
    }
  });

  test('records migrations 1..4 in schema_version on a fresh database', async () => {
    await runMigrations();

    const rows = mockDb.execute('SELECT version FROM schema_version ORDER BY version ASC;');
    const versions = rows.rows._array.map(r => r.version);
    expect(versions).toEqual([1, 2, 3, 4]);
  });

  test('re-running migrations does not duplicate schema_version rows', async () => {
    await runMigrations();
    await runMigrations();
    await runMigrations();

    const rows = mockDb.execute('SELECT version FROM schema_version ORDER BY version ASC;');
    expect(rows.rows._array.map(r => r.version)).toEqual([1, 2, 3, 4]);
  });

  test('creates the offline query indexes', async () => {
    await runMigrations();

    const indexes = mockDb.getIndexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        'idx_audit_uuid_tag_time',
        'idx_audit_sync_pending_time',
        'idx_tags_sync_pending_updated',
      ]),
    );
  });

  test('getSchemaVersion returns the highest applied version', async () => {
    expect(await getSchemaVersion()).toBe(0); // nothing applied yet
    await runMigrations();
    expect(await getSchemaVersion()).toBe(4);
  });

  // ── Upgrade path (databases created before versioning) ──────────────────

  test('upgrades an existing tags table missing sync columns', async () => {
    mockDb.execute(OLD_TAGS_DDL);

    await runMigrations();

    const schema = mockDb.getSchema('tags');
    expect(schema).toEqual(expect.arrayContaining(['version', 'updated_by', 'farm_id']));
  });

  test('legacy pre-versioning database gets all versions recorded', async () => {
    // Simulate a database created by the previous (unversioned) migrations
    mockDb.execute(OLD_TAGS_DDL);
    mockDb.execute(`
      CREATE TABLE IF NOT EXISTS user_session (
        id INTEGER PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await runMigrations();

    const rows = mockDb.execute('SELECT version FROM schema_version ORDER BY version ASC;');
    expect(rows.rows._array.map(r => r.version)).toEqual([1, 2, 3, 4]);
    expect(mockDb.getSchema('tags')).toEqual(expect.arrayContaining(['version', 'farm_id']));
  });

  test('migrations are idempotent on upgraded databases', async () => {
    mockDb.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        uuid TEXT PRIMARY KEY NOT NULL,
        colorHex TEXT NOT NULL
      );
    `);

    await runMigrations();
    await runMigrations();

    const schema = mockDb.getSchema('tags');
    expect(schema.filter(col => col === 'version')).toHaveLength(1);
    expect(schema.filter(col => col === 'updated_by')).toHaveLength(1);
    expect(schema.filter(col => col === 'farm_id')).toHaveLength(1);
  });

  // ── Regression guards ───────────────────────────────────────────────────

  test('INSERT with sync columns fails before the upgrade (regression guard)', () => {
    mockDb.execute(OLD_TAGS_DDL);

    expect(() =>
      mockDb.execute(
        `INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending, version, updated_by, farm_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?);`,
        ['u1', '#ffffff', 'T-1', 14.2, -91.3, '2026-01-01', 1, 1, 1, 'auditor', 'farm-1'],
      ),
    ).toThrow(/has no column named version/);
  });

  test('INSERT with sync columns succeeds after the upgrade', async () => {
    mockDb.execute(OLD_TAGS_DDL);

    await runMigrations();

    mockDb.execute(
      `INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending, version, updated_by, farm_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?);`,
      ['u1', '#ffffff', 'T-1', 14.2, -91.3, '2026-01-01', 1, 1, 1, 'auditor', 'farm-1'],
    );

    const rows = mockDb.getTable('tags');
    expect(rows).toHaveLength(1);
    expect(rows[0].version).toBe(1);
    expect(rows[0].updated_by).toBe('auditor');
    expect(rows[0].farm_id).toBe('farm-1');
  });

  test('create indexes without error', async () => {
    const result = mockDb.execute(`
      CREATE INDEX IF NOT EXISTS idx_audit_uuid_tag ON audit_records(uuid_tag);
    `);

    expect(result).toBeDefined();
    expect(result.rows._array).toEqual([]);
  });
});
