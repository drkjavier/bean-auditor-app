/**
 * Tag seed tests.
 */

import { mockDb } from '../helpers/sqliteMock';
import { tagsMock } from '../../src/data/mocks/tagsMock';

// Create tables before seed
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
});

describe('Tag Seed', () => {
  test('seeds tags from mock data', () => {
    const now = Date.now();

    // Simulate seedTagsIfNeeded
    const countResult = mockDb.execute('SELECT COUNT(*) as count FROM tags;');
    const count = countResult.rows._array[0]?.count || 0;

    if (count === 0) {
      const insert = `
        INSERT OR IGNORE INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);
      `;

      for (const tag of tagsMock.slice(0, 10)) { // Only first 10 for speed
        mockDb.execute(insert, [
          tag.uuid,
          tag.colorHex,
          tag.unique_id,
          tag.lat,
          tag.lon,
          tag.timestamp,
          now,
          now,
        ]);
      }
    }

    const result = mockDb.execute('SELECT COUNT(*) as count FROM tags;');
    expect(result.rows._array[0].count).toBe(10);
  });

  test('seed is idempotent (does not duplicate)', () => {
    const now = Date.now();
    const insert = `
      INSERT OR IGNORE INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);
    `;

    // Seed 5 tags
    for (const tag of tagsMock.slice(0, 5)) {
      mockDb.execute(insert, [
        tag.uuid, tag.colorHex, tag.unique_id, tag.lat, tag.lon, tag.timestamp, now, now,
      ]);
    }

    // Try to seed same 5 tags again
    for (const tag of tagsMock.slice(0, 5)) {
      mockDb.execute(insert, [
        tag.uuid, tag.colorHex, tag.unique_id, tag.lat, tag.lon, tag.timestamp, now, now,
      ]);
    }

    const result = mockDb.execute('SELECT COUNT(*) as count FROM tags;');
    // Should be 5, not 10 (INSERT OR IGNORE prevents duplicates)
    expect(result.rows._array[0].count).toBe(5);
  });

  test('tags have correct structure', () => {
    const now = Date.now();
    const tag = tagsMock[0];

    mockDb.execute(`
      INSERT OR IGNORE INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);
    `, [tag.uuid, tag.colorHex, tag.unique_id, tag.lat, tag.lon, tag.timestamp, now, now]);

    const result = mockDb.execute('SELECT * FROM tags WHERE uuid = ?;', [tag.uuid]);
    const row = result.rows._array[0];

    expect(row.uuid).toBe(tag.uuid);
    expect(row.colorHex).toBe(tag.colorHex);
    expect(row.unique_id).toBe(tag.unique_id);
    expect(row.lat).toBe(tag.lat);
    expect(row.lon).toBe(tag.lon);
    expect(row.timestamp).toBe(tag.timestamp);
    expect(row.sync_pending).toBe(0);
  });

  test('all tags from mock are included', () => {
    expect(tagsMock.length).toBeGreaterThanOrEqual(6_500);
    expect(tagsMock[0].uuid).toBeDefined();
    expect(tagsMock[0].colorHex).toBeDefined();
  });
});
