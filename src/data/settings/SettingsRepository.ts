/**
 * Settings Repository - local persistence for app preferences.
 *
 * Stores settings in the app_settings key/value table (SQLite via db.native).
 * Runs on both platforms: native uses react-native-quick-sqlite; web uses the
 * sql.js shim (vite alias). The sync columns (version, updated_by,
 * sync_pending) are reserved for a future settings sync feature; there is no
 * sync wire for settings yet.
 */

import { execute, queryRows } from '../sqlite/db.native';
import runMigrations from '../sqlite/migrations.native';

export type SettingType = 'string' | 'number' | 'boolean';

export type SettingRecord = {
  key: string;
  value: string;
  type: SettingType;
  version: number;
  updated_by: string | null;
  sync_pending: boolean;
  updated_at: number;
};

/** Known setting keys. */
export const SETTINGS_KEYS = {
  showUserLocation: 'showUserLocation',
  arrivalRadiusMeters: 'arrivalRadiusMeters',
  themeMode: 'themeMode',
  /** Internal marker: legacy localStorage migration ran (not a user setting). */
  legacyMigrationDone: '__legacy_migration_v1',
} as const;

/** Legacy localStorage key (pre-SQLite persistence of arrival radius). */
const LEGACY_ARRIVAL_RADIUS_KEY = 'bean_auditor.arrival_radius_m';

async function ensure(): Promise<void> {
  await runMigrations();
}

function decodeValue(value: string, type: SettingType): string | number | boolean | null {
  if (type === 'number') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (type === 'boolean') {
    return value === 'true';
  }
  return value;
}

/** Read the raw record for a setting key (null when missing). */
export async function getSettingRecord(key: string): Promise<SettingRecord | null> {
  await ensure();
  const rows = queryRows(
    `SELECT key, value, type, version, updated_by, sync_pending, updated_at
     FROM app_settings WHERE key = ?;`,
    [key],
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    key: String(row.key),
    value: String(row.value),
    type: String(row.type) as SettingType,
    version: Number(row.version) || 1,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    sync_pending: row.sync_pending === 1 || row.sync_pending === true,
    updated_at: Number(row.updated_at) || 0,
  };
}

/** Read a setting decoded to its declared type (null when missing/invalid). */
export async function getSetting<T extends string | number | boolean>(key: string): Promise<T | null> {
  const record = await getSettingRecord(key);
  if (!record) return null;
  return decodeValue(record.value, record.type) as T | null;
}

/**
 * Write a setting (upsert). Existing rows keep created_at, bump version and
 * get sync_pending = 1 so a future settings sync can pick them up.
 */
export async function setSetting(
  key: string,
  value: string | number | boolean,
  type: SettingType,
  options: { updatedBy?: string | null; syncPending?: boolean } = {},
): Promise<void> {
  await ensure();
  const now = Date.now();
  const syncPending = (options.syncPending ?? true) ? 1 : 0;
  execute(
    `INSERT INTO app_settings (key, value, type, version, updated_by, sync_pending, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       type = excluded.type,
       version = app_settings.version + 1,
       updated_by = excluded.updated_by,
       sync_pending = excluded.sync_pending,
       updated_at = excluded.updated_at;`,
    [key, String(value), type, options.updatedBy ?? null, syncPending, now, now],
  );
}

/** All settings records (debug/dev helper). */
export async function getAllSettings(): Promise<SettingRecord[]> {
  await ensure();
  const rows = queryRows(
    `SELECT key, value, type, version, updated_by, sync_pending, updated_at
     FROM app_settings ORDER BY key;`,
    [],
  );
  return rows.map(row => ({
    key: String(row.key),
    value: String(row.value),
    type: String(row.type) as SettingType,
    version: Number(row.version) || 1,
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    sync_pending: row.sync_pending === 1 || row.sync_pending === true,
    updated_at: Number(row.updated_at) || 0,
  }));
}

// ── Typed helpers (known settings) ─────────────────────────────────────────

export async function getShowUserLocation(): Promise<boolean> {
  return (await getSetting<boolean>(SETTINGS_KEYS.showUserLocation)) ?? false;
}

export async function setShowUserLocation(value: boolean): Promise<void> {
  await setSetting(SETTINGS_KEYS.showUserLocation, value, 'boolean');
}

export async function getArrivalRadiusMeters(): Promise<number | null> {
  return getSetting<number>(SETTINGS_KEYS.arrivalRadiusMeters);
}

export async function setArrivalRadiusMeters(meters: number): Promise<void> {
  if (!Number.isFinite(meters) || meters <= 0) {
    throw new Error('Arrival radius must be a positive finite number');
  }
  await setSetting(SETTINGS_KEYS.arrivalRadiusMeters, meters, 'number');
}

/** Read the persisted theme mode as a raw string (null when missing). Sanitization happens in the state layer. */
export async function getThemeMode(): Promise<string | null> {
  return getSetting<string>(SETTINGS_KEYS.themeMode);
}

/** Persist the theme mode ('light' | 'dark' | 'system'). */
export async function setThemeMode(mode: string): Promise<void> {
  await setSetting(SETTINGS_KEYS.themeMode, mode, 'string');
}

// ── Legacy localStorage migration ──────────────────────────────────────────

/**
 * One-time import of the legacy localStorage arrival radius
 * (key: bean_auditor.arrival_radius_m) into app_settings.
 * Idempotent: guarded by the __legacy_migration_v1 marker row.
 * Safe on native (no localStorage → only writes the marker).
 */
export async function migrateLegacyLocalStorage(): Promise<void> {
  await ensure();
  const marker = await getSettingRecord(SETTINGS_KEYS.legacyMigrationDone);
  if (marker) return;

  try {
    const storage = typeof localStorage !== 'undefined' ? localStorage : null;
    if (storage) {
      const raw = storage.getItem(LEGACY_ARRIVAL_RADIUS_KEY);
      const meters = raw != null ? Number(raw) : NaN;
      if (Number.isFinite(meters) && meters > 0) {
        await setSetting(SETTINGS_KEYS.arrivalRadiusMeters, meters, 'number');
      }
    }
  } catch (err) {
    console.warn('[settings] Legacy localStorage migration failed:', err);
  }

  // Mark as done even when there was nothing to import (keeps it idempotent)
  await setSetting(SETTINGS_KEYS.legacyMigrationDone, new Date().toISOString(), 'string', {
    syncPending: false,
  });
}

export default {
  getSettingRecord,
  getSetting,
  setSetting,
  getAllSettings,
  getShowUserLocation,
  setShowUserLocation,
  getArrivalRadiusMeters,
  setArrivalRadiusMeters,
  getThemeMode,
  setThemeMode,
  migrateLegacyLocalStorage,
  SETTINGS_KEYS,
};
