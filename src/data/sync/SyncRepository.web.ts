/**
 * Sync Repository - Web implementation (In-memory + localStorage)
 *
 * For web platform, we use localStorage to persist sync data.
 * This provides offline capability without requiring SQLite WASM.
 */

import { TagRecord, AuditRecord } from '../../domain/audit/AuditRecord';
import { Farm } from '../../domain/farm/Farm';
import { User } from '../../domain/user/User';

// ── Storage Keys ───────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  tags: 'bean_auditor_tags',
  farms: 'bean_auditor_farms',
  users: 'bean_auditor_users',
  audits: 'bean_auditor_audits',
  lastSyncTimestamp: 'bean_auditor_last_sync',
} as const;

// ── Helper Functions ───────────────────────────────────────────────────────

function loadFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('[SyncRepo] Failed to save to localStorage:', key, err);
  }
}

// ── Sync Metadata ──────────────────────────────────────────────────────────

export async function getLastSyncTimestamp(): Promise<number | null> {
  const value = localStorage.getItem(STORAGE_KEYS.lastSyncTimestamp);
  return value ? parseInt(value, 10) : null;
}

export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  localStorage.setItem(STORAGE_KEYS.lastSyncTimestamp, String(timestamp));
}

// ── Pull: Write downloaded records ─────────────────────────────────────────

export async function upsertTags(tags: TagRecord[]): Promise<number> {
  const existing = loadFromStorage<TagRecord>(STORAGE_KEYS.tags);
  const map = new Map(existing.map(t => [t.uuid, t]));

  for (const tag of tags) {
    map.set(tag.uuid, tag);
  }

  saveToStorage(STORAGE_KEYS.tags, Array.from(map.values()));
  return tags.length;
}

export async function upsertFarms(farms: Farm[]): Promise<number> {
  const existing = loadFromStorage<Farm>(STORAGE_KEYS.farms);
  const map = new Map(existing.map(f => [f.id, f]));

  for (const farm of farms) {
    map.set(farm.id, farm);
  }

  saveToStorage(STORAGE_KEYS.farms, Array.from(map.values()));
  return farms.length;
}

export async function upsertUsers(users: User[]): Promise<number> {
  const existing = loadFromStorage<User>(STORAGE_KEYS.users);
  const map = new Map(existing.map(u => [u.id, u]));

  for (const user of users) {
    map.set(user.id, user);
  }

  saveToStorage(STORAGE_KEYS.users, Array.from(map.values()));
  return users.length;
}

// ── Push: Read pending records ─────────────────────────────────────────────

export async function getPendingSyncTags(): Promise<TagRecord[]> {
  return loadFromStorage<TagRecord>(STORAGE_KEYS.tags).filter(t => t.sync_pending);
}

export async function getPendingSyncAudits(): Promise<AuditRecord[]> {
  return loadFromStorage<AuditRecord>(STORAGE_KEYS.audits).filter(a => a.sync_pending);
}

export async function getPendingSyncFarms(): Promise<Farm[]> {
  return loadFromStorage<Farm>(STORAGE_KEYS.farms).filter(f => f.sync_pending);
}

export async function getPendingSyncUsers(): Promise<User[]> {
  return loadFromStorage<User>(STORAGE_KEYS.users).filter(u => u.sync_pending);
}

// ── Mark as synced ─────────────────────────────────────────────────────────

export async function markTagAsSynced(uuid: string): Promise<void> {
  const tags = loadFromStorage<TagRecord>(STORAGE_KEYS.tags);
  const updated = tags.map(t =>
    t.uuid === uuid ? { ...t, sync_pending: false } : t
  );
  saveToStorage(STORAGE_KEYS.tags, updated);
}

export async function markAuditAsSynced(uuidTag: string): Promise<void> {
  const audits = loadFromStorage<AuditRecord>(STORAGE_KEYS.audits);
  const updated = audits.map(a =>
    a.uuid_tag === uuidTag ? { ...a, sync_pending: false } : a
  );
  saveToStorage(STORAGE_KEYS.audits, updated);
}

export async function markFarmAsSynced(id: string): Promise<void> {
  const farms = loadFromStorage<Farm>(STORAGE_KEYS.farms);
  const updated = farms.map(f =>
    f.id === id ? { ...f, sync_pending: false } : f
  );
  saveToStorage(STORAGE_KEYS.farms, updated);
}

export async function markUserAsSynced(id: string): Promise<void> {
  const users = loadFromStorage<User>(STORAGE_KEYS.users);
  const updated = users.map(u =>
    u.id === id ? { ...u, sync_pending: false } : u
  );
  saveToStorage(STORAGE_KEYS.users, updated);
}

// ── Mark as modified (for local changes) ───────────────────────────────────

export async function markTagAsModified(uuid: string): Promise<void> {
  const tags = loadFromStorage<TagRecord>(STORAGE_KEYS.tags);
  const updated = tags.map(t =>
    t.uuid === uuid ? { ...t, sync_pending: true, updated_at: Date.now() } : t
  );
  saveToStorage(STORAGE_KEYS.tags, updated);
}

export async function markAuditAsModified(uuidTag: string): Promise<void> {
  const audits = loadFromStorage<AuditRecord>(STORAGE_KEYS.audits);
  const updated = audits.map(a =>
    a.uuid_tag === uuidTag ? { ...a, sync_pending: true } : a
  );
  saveToStorage(STORAGE_KEYS.audits, updated);
}

// ── Sync Status ────────────────────────────────────────────────────────────

export async function getSyncStatus(): Promise<{
  tags_pending: number;
  audits_pending: number;
  farms_pending: number;
  users_pending: number;
  total_pending: number;
}> {
  const tags_pending = (await getPendingSyncTags()).length;
  const audits_pending = (await getPendingSyncAudits()).length;
  const farms_pending = (await getPendingSyncFarms()).length;
  const users_pending = (await getPendingSyncUsers()).length;

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
  return loadFromStorage<TagRecord>(STORAGE_KEYS.tags);
}

export async function getAllFarms(): Promise<Farm[]> {
  return loadFromStorage<Farm>(STORAGE_KEYS.farms);
}

export async function getAllUsers(): Promise<User[]> {
  return loadFromStorage<User>(STORAGE_KEYS.users);
}
