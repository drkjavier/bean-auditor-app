/**
 * SQLite mock contract tests (M3).
 *
 * The mock must validate schemas like real SQLite so that schema mismatches
 * (missing tables/columns) fail loudly in tests instead of being masked.
 */

import { mockDb } from '../helpers/sqliteMock';

describe('sqliteMock schema validation', () => {
  beforeEach(() => {
    mockDb.clear();
  });

  test('registers columns on CREATE TABLE', () => {
    mockDb.execute(
      `CREATE TABLE IF NOT EXISTS tags (
        uuid TEXT PRIMARY KEY NOT NULL,
        colorHex TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
      );`,
    );
    expect(mockDb.getSchema('tags')).toEqual(['uuid', 'colorHex', 'version']);
  });

  test('rejects INSERT into a table that was never created', () => {
    expect(() => mockDb.execute('INSERT INTO tags (uuid) VALUES (?);', ['u1'])).toThrow(
      /no such table: tags/,
    );
  });

  test('rejects INSERT with an unknown column', () => {
    mockDb.execute(
      `CREATE TABLE IF NOT EXISTS tags (
        uuid TEXT PRIMARY KEY NOT NULL,
        colorHex TEXT NOT NULL
      );`,
    );

    expect(() =>
      mockDb.execute('INSERT INTO tags (uuid, colorHex, version) VALUES (?, ?, ?);', [
        'u1',
        '#ffffff',
        1,
      ]),
    ).toThrow(/has no column named version/);
  });

  test('INSERT OR REPLACE updates the row with the same primary key', () => {
    mockDb.execute(
      `CREATE TABLE IF NOT EXISTS user_session (
        id INTEGER PRIMARY KEY NOT NULL,
        username TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
    );

    mockDb.execute('INSERT OR REPLACE INTO user_session (id, username, updated_at) VALUES (1, ?, ?);', ['alice', 100]);
    mockDb.execute('INSERT OR REPLACE INTO user_session (id, username, updated_at) VALUES (1, ?, ?);', ['bob', 200]);

    const rows = mockDb.getTable('user_session');
    expect(rows).toHaveLength(1);
    expect(rows[0].username).toBe('bob');
  });

  test('INSERT ... ON CONFLICT DO UPDATE applies excluded values and bumps version', () => {
    mockDb.execute(
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
      );`,
    );

    const upsert = `INSERT INTO app_settings (key, value, version) VALUES (?, ?, 1)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        version = app_settings.version + 1;`;

    mockDb.execute(upsert, ['radius', '10']);
    mockDb.execute(upsert, ['radius', '20']);

    const rows = mockDb.getTable('app_settings');
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe('20');
    expect(rows[0].version).toBe(2);
  });

  test('plain INSERT with duplicate primary key throws UNIQUE constraint', () => {
    mockDb.execute(
      `CREATE TABLE IF NOT EXISTS tags (
        uuid TEXT PRIMARY KEY NOT NULL,
        colorHex TEXT NOT NULL
      );`,
    );

    mockDb.execute('INSERT INTO tags (uuid, colorHex) VALUES (?, ?);', ['u1', '#ffffff']);
    expect(() => mockDb.execute('INSERT INTO tags (uuid, colorHex) VALUES (?, ?);', ['u1', '#000000'])).toThrow(
      /UNIQUE constraint failed/,
    );
  });

  test('ALTER TABLE ADD COLUMN extends the schema', () => {
    mockDb.execute('CREATE TABLE IF NOT EXISTS tags (uuid TEXT PRIMARY KEY NOT NULL);');
    mockDb.execute('ALTER TABLE tags ADD COLUMN version INTEGER NOT NULL DEFAULT 1;');
    expect(mockDb.getSchema('tags')).toEqual(['uuid', 'version']);
  });

  test('PRAGMA table_info returns the registered columns', () => {
    mockDb.execute(
      `CREATE TABLE IF NOT EXISTS tags (
        uuid TEXT PRIMARY KEY NOT NULL,
        version INTEGER
      );`,
    );

    const result = mockDb.execute('PRAGMA table_info(tags);');
    expect(result.rows._array.map(r => r.name)).toEqual(['uuid', 'version']);
  });

  test('SELECT on unknown table returns empty rows (legacy lenient behavior)', () => {
    const result = mockDb.execute('SELECT * FROM non_existent_table;');
    expect(result.rows._array).toEqual([]);
  });
});
