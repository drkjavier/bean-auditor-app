import { execute, queryRows } from './sqlite/db.native';
import { tagsMock } from './mocks/tagsMock';

/**
 * Seed the tags table from mock data if it is empty.
 * Safe to call multiple times (idempotent).
 * All seeded tags have sync_pending = 0 (synced from server).
 */
export async function seedTagsIfNeeded(): Promise<void> {
  const existing = queryRows('SELECT COUNT(*) as count FROM tags;', []);
  const count = Number((existing[0]?.count ?? 0));

  if (count > 0) return;

  const now = Date.now();

  const insert = `
    INSERT OR IGNORE INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0);
  `;

  for (const tag of tagsMock) {
    execute(insert, [
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

export default seedTagsIfNeeded;
