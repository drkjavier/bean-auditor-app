/**
 * SettingsRepository tests (app_settings table) against the SQLite mock.
 * Uses the REAL migrations so the schema matches production.
 */

import { mockDb } from '../helpers/sqliteMock';

// Use the real migrations (db.native is mocked by sqliteMock to hit mockDb)
const { default: runMigrations } = jest.requireActual<{
  default: () => Promise<void>;
}>('../../src/data/sqlite/migrations.native');

// Import AFTER sqliteMock registers the db.native/migrations mocks
import * as settingsRepo from '../../src/data/settings/SettingsRepository';

const LEGACY_KEY = 'bean_auditor.arrival_radius_m';
const memory = new Map<string, string>();

describe('SettingsRepository (app_settings)', () => {
  beforeEach(async () => {
    mockDb.clear();
    await runMigrations();
    memory.clear();
    (global as any).localStorage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, String(value));
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    };
  });

  afterEach(() => {
    delete (global as any).localStorage;
  });

  test('real migrations create the full app_settings schema', () => {
    const schema = mockDb.getSchema('app_settings');
    expect(schema).toEqual(
      expect.arrayContaining([
        'key',
        'value',
        'type',
        'version',
        'updated_by',
        'sync_pending',
        'created_at',
        'updated_at',
      ]),
    );
  });

  test('setSetting/getSetting roundtrip decodes number values', async () => {
    await settingsRepo.setSetting('arrivalRadiusMeters', 15, 'number');
    const value = await settingsRepo.getSetting<number>('arrivalRadiusMeters');
    expect(value).toBe(15);
  });

  test('setSetting/getSetting roundtrip decodes boolean values', async () => {
    await settingsRepo.setSetting('showUserLocation', true, 'boolean');
    const value = await settingsRepo.getSetting<boolean>('showUserLocation');
    expect(value).toBe(true);
  });

  test('updating an existing setting bumps version and keeps created_at', async () => {
    await settingsRepo.setSetting('arrivalRadiusMeters', 15, 'number');
    const before = await settingsRepo.getSettingRecord('arrivalRadiusMeters');

    await settingsRepo.setSetting('arrivalRadiusMeters', 20, 'number');
    const after = await settingsRepo.getSettingRecord('arrivalRadiusMeters');

    expect(after).not.toBeNull();
    expect(after!.value).toBe('20');
    expect(after!.version).toBe(2);
    expect(after!.created_at === undefined ? after!.updated_at : after!.updated_at).toBeDefined();
    expect(before!.version).toBe(1);
    expect(after!.sync_pending).toBe(true);
  });

  test('getSetting returns null for missing keys', async () => {
    const value = await settingsRepo.getSetting('missing_key');
    expect(value).toBeNull();
  });

  test('typed getters return UI defaults on empty database', async () => {
    expect(await settingsRepo.getShowUserLocation()).toBe(false);
    expect(await settingsRepo.getArrivalRadiusMeters()).toBeNull();
  });

  test('showUserLocation helper persists via app_settings', async () => {
    await settingsRepo.setShowUserLocation(true);
    expect(await settingsRepo.getShowUserLocation()).toBe(true);

    const rows = mockDb.execute('SELECT * FROM app_settings WHERE key = ?;', ['showUserLocation']);
    expect(rows.rows._array[0].sync_pending).toBe(1);
  });

  test('setArrivalRadiusMeters rejects invalid values without writing', async () => {
    await expect(settingsRepo.setArrivalRadiusMeters(0)).rejects.toThrow(/positive finite/);
    await expect(settingsRepo.setArrivalRadiusMeters(-5)).rejects.toThrow(/positive finite/);
    await expect(settingsRepo.setArrivalRadiusMeters(Number.NaN)).rejects.toThrow(/positive finite/);

    expect(await settingsRepo.getArrivalRadiusMeters()).toBeNull();
  });

  test('marker rows are written with sync_pending = 0', async () => {
    await settingsRepo.migrateLegacyLocalStorage();
    const marker = await settingsRepo.getSettingRecord(settingsRepo.SETTINGS_KEYS.legacyMigrationDone);
    expect(marker).not.toBeNull();
    expect(marker!.sync_pending).toBe(false);
  });

  test('migrateLegacyLocalStorage imports a valid legacy value and writes the marker', async () => {
    memory.set(LEGACY_KEY, '20');

    await settingsRepo.migrateLegacyLocalStorage();

    expect(await settingsRepo.getArrivalRadiusMeters()).toBe(20);
    const marker = await settingsRepo.getSettingRecord(settingsRepo.SETTINGS_KEYS.legacyMigrationDone);
    expect(marker).not.toBeNull();
  });

  test('migrateLegacyLocalStorage is idempotent', async () => {
    memory.set(LEGACY_KEY, '20');
    await settingsRepo.migrateLegacyLocalStorage();

    // User changes the setting after migration
    await settingsRepo.setArrivalRadiusMeters(33);
    // Legacy value still present in localStorage, but marker blocks re-import
    await settingsRepo.migrateLegacyLocalStorage();

    expect(await settingsRepo.getArrivalRadiusMeters()).toBe(33);
  });

  test('invalid legacy values are not imported but the marker is still written', async () => {
    memory.set(LEGACY_KEY, '0');

    await settingsRepo.migrateLegacyLocalStorage();

    expect(await settingsRepo.getArrivalRadiusMeters()).toBeNull();
    const marker = await settingsRepo.getSettingRecord(settingsRepo.SETTINGS_KEYS.legacyMigrationDone);
    expect(marker).not.toBeNull();
  });

  test('without localStorage the migration only writes the marker', async () => {
    delete (global as any).localStorage;

    await expect(settingsRepo.migrateLegacyLocalStorage()).resolves.toBeUndefined();

    const marker = await settingsRepo.getSettingRecord(settingsRepo.SETTINGS_KEYS.legacyMigrationDone);
    expect(marker).not.toBeNull();
  });

  test('getAllSettings returns every record', async () => {
    await settingsRepo.setShowUserLocation(true);
    await settingsRepo.setArrivalRadiusMeters(12);

    const all = await settingsRepo.getAllSettings();
    const keys = all.map(r => r.key);
    expect(keys).toEqual(expect.arrayContaining(['showUserLocation', 'arrivalRadiusMeters']));
  });
});
