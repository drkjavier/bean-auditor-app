/**
 * Sync Repository - Native implementation (SQLite)
 *
 * Handles all local database operations for sync:
 * - Read pending records for push
 * - Write downloaded records from pull
 * - Merge strategies for conflicts
 * - Track sync metadata (lastSync timestamp)
 */

import { execute, queryRows } from '../sqlite/db.native';
import { TagRecord, AuditRecord } from '../../domain/audit/AuditRecord';
import { Farm } from '../../domain/farm/Farm';
import { User } from '../../domain/user/User';

type AnyRow = Record<string, unknown>;

// ── Sync Metadata ──────────────────────────────────────────────────────────

export async function getLastSyncTimestamp(): Promise<number | null> {
  const rows = queryRows(
    'SELECT value FROM sync_metadata WHERE key = ?',
    ['lastSyncTimestamp']
  );
  if (rows.length > 0) {
    return parseInt(rows[0].value as string, 10);
  }
  return null;
}

export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  execute(
    `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
     VALUES (?, ?, ?)`,
    ['lastSyncTimestamp', String(timestamp), Date.now()]
  );
}

// ── Pull: Write downloaded records ─────────────────────────────────────────

export async function upsertTags(tags: TagRecord[]): Promise<number> {
  let count = 0;

  for (const tag of tags) {
    try {
      execute(
        `INSERT OR REPLACE INTO tags
         (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending, version, updated_by, farm_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tag.uuid,
          tag.colorHex,
          tag.unique_id,
          tag.lat,
          tag.lon,
          tag.timestamp,
          tag.created_at,
          tag.updated_at,
          tag.sync_pending ? 1 : 0,
          tag.version ?? 1,
          tag.updated_by ?? null,
          tag.farm_id ?? null,
        ]
      );
      count++;
    } catch (err) {
      console.error('[SyncRepo] Failed to upsert tag:', tag.uuid, err);
    }
  }

  return count;
}

export async function upsertFarms(farms: Farm[]): Promise<number> {
  let count = 0;

  for (const farm of farms) {
    try {
      execute(
        `INSERT OR REPLACE INTO farms
         (id, name, location, lat, lon, owner, area_hectares, status, version, created_at, updated_at, sync_pending)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          farm.id,
          farm.name,
          farm.location,
          farm.lat,
          farm.lon,
          farm.owner,
          farm.area_hectares ?? null,
          farm.status,
          farm.version ?? 1,
          farm.created_at,
          farm.updated_at,
          farm.sync_pending ? 1 : 0,
        ]
      );
      count++;
    } catch (err) {
      console.error('[SyncRepo] Failed to upsert farm:', farm.id, err);
    }
  }

  return count;
}

export async function upsertUsers(users: User[]): Promise<number> {
  let count = 0;

  for (const user of users) {
    try {
      execute(
        `INSERT OR REPLACE INTO users
         (id, username, display_name, email, role, is_active, version, created_at, updated_at, sync_pending)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.display_name,
          user.email,
          user.role,
          user.is_active ? 1 : 0,
          user.version ?? 1,
          user.created_at,
          user.updated_at,
          user.sync_pending ? 1 : 0,
        ]
      );
      count++;
    } catch (err) {
      console.error('[SyncRepo] Failed to upsert user:', user.id, err);
    }
  }

  return count;
}

// ── Push: Read pending records ─────────────────────────────────────────────

export async function getPendingSyncTags(): Promise<TagRecord[]> {
  const rows = queryRows(
    'SELECT * FROM tags WHERE sync_pending = 1'
  );
  return rows.map(rowToTagRecord);
}

export async function getPendingSyncAudits(): Promise<AuditRecord[]> {
  const rows = queryRows(
    'SELECT * FROM audit_records WHERE sync_pending = 1'
  );
  return rows.map(rowToAuditRecord);
}

export async function getPendingSyncFarms(): Promise<Farm[]> {
  const rows = queryRows(
    'SELECT * FROM farms WHERE sync_pending = 1'
  );
  return rows.map(rowToFarm);
}

export async function getPendingSyncUsers(): Promise<User[]> {
  const rows = queryRows(
    'SELECT * FROM users WHERE sync_pending = 1'
  );
  return rows.map(rowToUser);
}

// ── Mark as synced ─────────────────────────────────────────────────────────

export async function markTagAsSynced(uuid: string): Promise<void> {
  execute('UPDATE tags SET sync_pending = 0 WHERE uuid = ?', [uuid]);
}

export async function markAuditAsSynced(uuidTag: string): Promise<void> {
  execute(
    'UPDATE audit_records SET sync_pending = 0 WHERE uuid_tag = ? AND sync_pending = 1',
    [uuidTag]
  );
}

export async function markFarmAsSynced(id: string): Promise<void> {
  execute('UPDATE farms SET sync_pending = 0 WHERE id = ?', [id]);
}

export async function markUserAsSynced(id: string): Promise<void> {
  execute('UPDATE users SET sync_pending = 0 WHERE id = ?', [id]);
}

// ── Mark as modified (for local changes) ───────────────────────────────────

export async function markTagAsModified(uuid: string): Promise<void> {
  execute(
    'UPDATE tags SET sync_pending = 1, updated_at = ? WHERE uuid = ?',
    [Date.now(), uuid]
  );
}

export async function markAuditAsModified(uuidTag: string): Promise<void> {
  execute(
    'UPDATE audit_records SET sync_pending = 1 WHERE uuid_tag = ?',
    [uuidTag]
  );
}

// ── Sync Status ────────────────────────────────────────────────────────────

export async function getSyncStatus(): Promise<{
  tags_pending: number;
  audits_pending: number;
  farms_pending: number;
  users_pending: number;
  total_pending: number;
}> {
  const tagsResult = queryRows('SELECT COUNT(*) as count FROM tags WHERE sync_pending = 1');
  const auditsResult = queryRows('SELECT COUNT(*) as count FROM audit_records WHERE sync_pending = 1');
  const farmsResult = queryRows('SELECT COUNT(*) as count FROM farms WHERE sync_pending = 1');
  const usersResult = queryRows('SELECT COUNT(*) as count FROM users WHERE sync_pending = 1');

  const tags_pending = (tagsResult[0]?.count as number) || 0;
  const audits_pending = (auditsResult[0]?.count as number) || 0;
  const farms_pending = (farmsResult[0]?.count as number) || 0;
  const users_pending = (usersResult[0]?.count as number) || 0;

  return {
    tags_pending,
    audits_pending,
    farms_pending,
    users_pending,
    total_pending: tags_pending + audits_pending + farms_pending + users_pending,
  };
}

// ── Get all records (for initial state) ────────────────────────────────────

export async function getAllTags(): Promise<TagRecord[]> {
  const rows = queryRows('SELECT * FROM tags');
  return rows.map(rowToTagRecord);
}

export async function getAllFarms(): Promise<Farm[]> {
  const rows = queryRows('SELECT * FROM farms');
  return rows.map(rowToFarm);
}

export async function getAllUsers(): Promise<User[]> {
  const rows = queryRows('SELECT * FROM users');
  return rows.map(rowToUser);
}

// ── Row Mappers ────────────────────────────────────────────────────────────

function rowToTagRecord(row: AnyRow): TagRecord {
  return {
    uuid: row.uuid as string,
    colorHex: row.colorHex as string,
    unique_id: row.unique_id as string,
    lat: row.lat as number,
    lon: row.lon as number,
    timestamp: row.timestamp as string,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
    sync_pending: (row.sync_pending as number) === 1,
    version: (row.version as number) ?? 1,
    updated_by: (row.updated_by as string) ?? null,
    farm_id: (row.farm_id as string) ?? null,
  };
}

function rowToAuditRecord(row: AnyRow): AuditRecord {
  return {
    uuid_tag: row.uuid_tag as string,
    status: row.status as AuditRecord['status'],
    timestamp: row.timestamp as number,
    username: row.username as string,
    lat: row.lat as number | null,
    lon: row.lon as number | null,
    note: row.note as string | null,
    sync_pending: (row.sync_pending as number) === 1,
  };
}

function rowToFarm(row: AnyRow): Farm {
  return {
    id: row.id as string,
    name: row.name as string,
    location: row.location as string,
    lat: row.lat as number,
    lon: row.lon as number,
    owner: row.owner as string,
    area_hectares: row.area_hectares as number | null,
    status: row.status as Farm['status'],
    version: (row.version as number) ?? 1,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
    sync_pending: (row.sync_pending as number) === 1,
  };
}

function rowToUser(row: AnyRow): User {
  return {
    id: row.id as string,
    username: row.username as string,
    display_name: row.display_name as string,
    email: row.email as string,
    role: row.role as User['role'],
    is_active: (row.is_active as number) === 1,
    version: (row.version as number) ?? 1,
    created_at: row.created_at as number,
    updated_at: row.updated_at as number,
    sync_pending: (row.sync_pending as number) === 1,
  };
}
