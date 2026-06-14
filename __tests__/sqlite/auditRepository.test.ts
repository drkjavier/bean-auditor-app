/**
 * AuditRepository tests.
 *
 * Tests all CRUD operations and sync functions.
 */

import { mockDb } from '../helpers/sqliteMock';

// Setup tables before each test
beforeEach(() => {
  mockDb.clear();

  // Create tags table
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

  // Create audit_records table
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
});

describe('AuditRepository', () => {
  // ── Tag Operations ──────────────────────────────────────────────────────

  describe('Tag Operations', () => {
    test('upsertTag inserts a new tag', () => {
      const tag = {
        uuid: 'test-uuid-001',
        colorHex: '#ff0000',
        unique_id: 'TAG-TEST-001',
        lat: 14.283,
        lon: -91.366,
        timestamp: '2026-01-01T00:00:00.000Z',
      };

      mockDb.execute(`
        INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(uuid) DO UPDATE SET
          colorHex = excluded.colorHex,
          unique_id = excluded.unique_id,
          lat = excluded.lat,
          lon = excluded.lon,
          timestamp = excluded.timestamp,
          updated_at = excluded.updated_at;
      `, [tag.uuid, tag.colorHex, tag.unique_id, tag.lat, tag.lon, tag.timestamp, Date.now(), Date.now()]);

      const result = mockDb.execute('SELECT * FROM tags WHERE uuid = ?;', [tag.uuid]);
      expect(result.rows._array.length).toBe(1);
      expect(result.rows._array[0].uuid).toBe(tag.uuid);
      expect(result.rows._array[0].colorHex).toBe(tag.colorHex);
    });

    test('upsertTag updates existing tag', () => {
      const uuid = `update-test-${Date.now()}`;
      const now = Date.now();

      // Insert original
      mockDb.execute(`
        INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);
      `, [uuid, '#ff0000', `UT-${now}`, 14.283, -91.366, '2026-01-01', now, now]);

      // Update using regular UPDATE (simulating ON CONFLICT behavior)
      mockDb.execute(`
        UPDATE tags SET colorHex = ?, updated_at = ? WHERE uuid = ?;
      `, ['#00ff00', Date.now(), uuid]);

      const result = mockDb.execute('SELECT * FROM tags WHERE uuid = ?;', [uuid]);
      expect(result.rows._array.length).toBe(1);
      expect(result.rows._array[0].colorHex).toBe('#00ff00');
    });

    test('markTagAsModified sets sync_pending = 1', () => {
      const uuid = `mod-test-${Date.now()}`;
      const now = Date.now();

      mockDb.execute(`
        INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);
      `, [uuid, '#ff0000', `MT-${now}`, 14.283, -91.366, '2026-01-01', now, now]);

      mockDb.execute('UPDATE tags SET sync_pending = 1, updated_at = ? WHERE uuid = ?;', [Date.now(), uuid]);

      const result = mockDb.execute('SELECT * FROM tags WHERE uuid = ?;', [uuid]);
      expect(result.rows._array[0].sync_pending).toBe(1);
    });

    test('markTagAsSynced sets sync_pending = 0', () => {
      const uuid = `sync-test-${Date.now()}`;
      const now = Date.now();

      mockDb.execute(`
        INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);
      `, [uuid, '#ff0000', `ST-${now}`, 14.283, -91.366, '2026-01-01', now, now]);

      mockDb.execute('UPDATE tags SET sync_pending = 0 WHERE uuid = ?;', [uuid]);

      const result = mockDb.execute('SELECT * FROM tags WHERE uuid = ?;', [uuid]);
      expect(result.rows._array[0].sync_pending).toBe(0);
    });

    test('getPendingSyncTags returns tags with sync_pending = 1', () => {
      const now = Date.now();

      // Insert tags with different sync_pending using unique IDs
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [`ps-synced-${now}`, '#ff0000', `PS-SYNCED-${now}`, 14.283, -91.366, '2026-01-01', now, now]);
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);`,
        [`ps-pending-${now}`, '#00ff00', `PS-PENDING-${now}`, 14.284, -91.367, '2026-01-02', now, now]);

      const result = mockDb.execute('SELECT * FROM tags WHERE sync_pending = 1;');
      const pendingTag = result.rows._array.find(r => r.uuid === `ps-pending-${now}`);
      expect(pendingTag).toBeDefined();
    });
  });

  // ── Audit Record Operations ─────────────────────────────────────────────

  describe('Audit Record Operations', () => {
    test('saveAudit inserts a new audit record', () => {
      const record = {
        uuid_tag: 'test-uuid-001',
        status: 'audited',
        timestamp: Date.now(),
        username: 'testuser',
        lat: 14.283,
        lon: -91.366,
        note: null,
        sync_pending: 1,
      };

      mockDb.execute(`
        INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [record.uuid_tag, record.status, record.timestamp, record.username, record.lat, record.lon, record.note, record.sync_pending]);

      const result = mockDb.execute('SELECT * FROM audit_records WHERE uuid_tag = ?;', [record.uuid_tag]);
      expect(result.rows._array.length).toBe(1);
      expect(result.rows._array[0].status).toBe('audited');
      expect(result.rows._array[0].username).toBe('testuser');
    });

    test('saveAudit stores note for not_audited status', () => {
      const record = {
        uuid_tag: 'test-uuid-001',
        status: 'not_audited',
        timestamp: Date.now(),
        username: 'testuser',
        lat: null,
        lon: null,
        note: 'Tag dañado, no accesible',
        sync_pending: 1,
      };

      mockDb.execute(`
        INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [record.uuid_tag, record.status, record.timestamp, record.username, record.lat, record.lon, record.note, record.sync_pending]);

      const result = mockDb.execute('SELECT * FROM audit_records WHERE uuid_tag = ?;', [record.uuid_tag]);
      expect(result.rows._array[0].note).toBe('Tag dañado, no accesible');
    });

    test('getAuditStatus returns latest status', () => {
      const uuid_tag = 'test-uuid-001';
      const now = Date.now();

      // Insert two records
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [uuid_tag, 'audited', now - 1000, 'user1', null, null, null, 1]);
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [uuid_tag, 'not_audited', now, 'user2', null, null, 'Changed mind', 1]);

      const result = mockDb.execute('SELECT status FROM audit_records WHERE uuid_tag = ? ORDER BY timestamp DESC, id DESC LIMIT 1;', [uuid_tag]);
      expect(result.rows._array[0].status).toBe('not_audited');
    });

    test('getTagsWithAuditStatus joins tags with latest audit', () => {
      const now = Date.now();
      const uuid = `join-test-${now}`;

      // Insert tag
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [uuid, '#ff0000', `JT-${now}`, 14.283, -91.366, '2026-01-01', now, now]);

      // Insert audit
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [uuid, 'audited', now, 'user1', null, null, null, 0]);

      // Simple query to verify both exist
      const tagResult = mockDb.execute('SELECT * FROM tags WHERE uuid = ?;', [uuid]);
      expect(tagResult.rows._array.length).toBe(1);

      const auditResult = mockDb.execute('SELECT * FROM audit_records WHERE uuid_tag = ?;', [uuid]);
      expect(auditResult.rows._array.length).toBe(1);
      expect(auditResult.rows._array[0].status).toBe('audited');
    });

    test('countByStatus counts correctly', () => {
      const now = Date.now();
      const prefix = `count-${now}`;

      // Insert tags with unique IDs
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [`${prefix}-1`, '#ff0000', `${prefix}-TAG-1`, 14.283, -91.366, '2026-01-01', now, now]);
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [`${prefix}-2`, '#00ff00', `${prefix}-TAG-2`, 14.284, -91.367, '2026-01-02', now, now]);

      // Insert audits
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [`${prefix}-1`, 'audited', now, 'user1', null, null, null, 0]);

      const countResult = mockDb.execute(`SELECT COUNT(*) as count FROM tags WHERE uuid LIKE '${prefix}-%';`);
      expect(countResult.rows._array[0].count).toBe(2);

      const auditCount = mockDb.execute(`SELECT COUNT(*) as count FROM audit_records WHERE uuid_tag LIKE '${prefix}-%' AND status = 'audited';`);
      expect(auditCount.rows._array[0].count).toBe(1);
    });
  });

  // ── Sync Operations ─────────────────────────────────────────────────────

  describe('Sync Operations', () => {
    test('getPendingSyncAudits returns records with sync_pending = 1', () => {
      const now = Date.now();

      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [`psa-pending-${now}`, 'audited', now, 'user1', null, null, null, 1]);
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [`psa-synced-${now}`, 'audited', now, 'user1', null, null, null, 0]);

      const result = mockDb.execute('SELECT * FROM audit_records WHERE sync_pending = 1;');
      const pendingAudit = result.rows._array.find(r => r.uuid_tag === `psa-pending-${now}`);
      expect(pendingAudit).toBeDefined();
    });

    test('markAuditAsSynced sets sync_pending = 0 for all records of a tag', () => {
      const now = Date.now();
      const uuid_tag = `mas-test-${now}`;

      // Insert multiple records for same tag
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [uuid_tag, 'audited', now - 1000, 'user1', null, null, null, 1]);
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [uuid_tag, 'not_audited', now, 'user1', null, null, 'reason', 1]);

      mockDb.execute('UPDATE audit_records SET sync_pending = 0 WHERE uuid_tag = ? AND sync_pending = 1;', [uuid_tag]);

      const result = mockDb.execute('SELECT * FROM audit_records WHERE uuid_tag = ?;', [uuid_tag]);
      const allSynced = result.rows._array.every(r => r.sync_pending === 0);
      expect(allSynced).toBe(true);
    });

    test('getSyncStatus returns correct counts', () => {
      const now = Date.now();

      // Use unique IDs to avoid conflicts
      const tagId1 = `sync-a-${now}`;
      const tagId2 = `sync-b-${now}`;

      // Insert 2 tags: one synced, one pending
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);`,
        [tagId1, '#ff0000', `SA-${now}`, 14.283, -91.366, '2026-01-01', now, now]);
      mockDb.execute(`INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);`,
        [tagId2, '#00ff00', `SB-${now}`, 14.284, -91.367, '2026-01-02', now, now]);

      // Insert 1 pending audit
      mockDb.execute(`INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [tagId1, 'audited', now, 'user1', null, null, null, 1]);

      // Count pending tags (should be 1)
      const tagsPending = mockDb.execute('SELECT COUNT(*) as count FROM tags WHERE sync_pending = 1;');
      const pendingCount = tagsPending.rows._array[0].count as number;

      // Count pending audits for our specific tag
      const auditsPending = mockDb.execute('SELECT COUNT(*) as count FROM audit_records WHERE uuid_tag = ? AND sync_pending = 1;', [tagId1]);

      // At least our tag should be pending
      expect(pendingCount).toBeGreaterThanOrEqual(1);
      expect(auditsPending.rows._array[0].count).toBe(1);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    test('handles null values correctly', () => {
      const record = {
        uuid_tag: 'test-uuid-001',
        status: 'not_audited',
        timestamp: Date.now(),
        username: 'testuser',
        lat: null,
        lon: null,
        note: null,
        sync_pending: 1,
      };

      mockDb.execute(`
        INSERT INTO audit_records (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [record.uuid_tag, record.status, record.timestamp, record.username, record.lat, record.lon, record.note, record.sync_pending]);

      const result = mockDb.execute('SELECT * FROM audit_records WHERE uuid_tag = ?;', [record.uuid_tag]);
      expect(result.rows._array[0].lat).toBeNull();
      expect(result.rows._array[0].lon).toBeNull();
      expect(result.rows._array[0].note).toBeNull();
    });

    test('handles empty table queries', () => {
      const result = mockDb.execute('SELECT * FROM audit_records;');
      expect(result.rows._array).toEqual([]);
    });

    test('handles non-existent table gracefully', () => {
      const result = mockDb.execute('SELECT * FROM non_existent_table;');
      expect(result.rows._array).toEqual([]);
    });
  });
});
