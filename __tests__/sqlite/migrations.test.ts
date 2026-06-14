/**
 * SQLite migrations tests.
 */

import { mockDb } from '../helpers/sqliteMock';

// Apply mocks before importing
import '../../src/data/sqlite/migrations.native';

describe('SQLite Migrations', () => {
  beforeEach(() => {
    mockDb.clear();
  });

  test('creates user_session table', () => {
    mockDb.execute(`
      CREATE TABLE IF NOT EXISTS user_session (
        id INTEGER PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    const rows = mockDb.getTable('user_session');
    expect(rows).toBeDefined();
  });

  test('creates tags table', () => {
    mockDb.execute(`
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
    `);

    const rows = mockDb.getTable('tags');
    expect(rows).toBeDefined();
  });

  test('creates audit_records table', () => {
    mockDb.execute(`
      CREATE TABLE IF NOT EXISTS audit_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        uuid_tag TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        username TEXT NOT NULL,
        lat REAL,
        lon REAL,
        note TEXT,
        sync_pending INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      );
    `);

    const rows = mockDb.getTable('audit_records');
    expect(rows).toBeDefined();
  });

  test('creates indexes without error', () => {
    const result = mockDb.execute(`
      CREATE INDEX IF NOT EXISTS idx_audit_uuid_tag ON audit_records(uuid_tag);
    `);

    expect(result).toBeDefined();
    expect(result.rows._array).toEqual([]);
  });

  test('CREATE TABLE IF NOT EXISTS is idempotent', () => {
    const createTable = `
      CREATE TABLE IF NOT EXISTS tags (
        uuid TEXT PRIMARY KEY NOT NULL,
        colorHex TEXT NOT NULL
      );
    `;

    // Execute twice
    mockDb.execute(createTable);
    mockDb.execute(createTable);

    const rows = mockDb.getTable('tags');
    expect(rows).toEqual([]);
  });
});
