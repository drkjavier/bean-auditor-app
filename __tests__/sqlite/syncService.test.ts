/**
 * Sync service tests.
 *
 * Tests the sync mock API and sync service.
 */

import { MockSyncApi } from '../../src/infrastructure/sync/mockSyncApi';

describe('MockSyncApi', () => {
  test('syncTags returns server IDs', async () => {
    const tags = [
      {
        uuid: 'tag-1',
        colorHex: '#ff0000',
        unique_id: 'TAG-001',
        lat: 14.283,
        lon: -91.366,
        timestamp: '2026-01-01',
        created_at: Date.now(),
        updated_at: Date.now(),
        sync_pending: true,
      },
    ];

    const result = await MockSyncApi.syncTags(tags);

    expect(result.length).toBe(1);
    expect(result[0].uuid).toBe('tag-1');
    expect(result[0].server_id).toMatch(/^srv_/);
  });

  test('syncAudits returns server IDs', async () => {
    const audits = [
      {
        uuid_tag: 'tag-1',
        status: 'audited' as const,
        timestamp: Date.now(),
        username: 'testuser',
        lat: null,
        lon: null,
        note: null,
        sync_pending: true,
      },
    ];

    const result = await MockSyncApi.syncAudits(audits);

    expect(result.length).toBe(1);
    expect(result[0].uuid_tag).toBe('tag-1');
    expect(result[0].server_id).toMatch(/^srv_/);
  });

  test('fetchTagsFromServer returns empty array', async () => {
    const result = await MockSyncApi.fetchTagsFromServer();
    expect(result).toEqual([]);
  });

  test('checkConnectivity returns boolean', async () => {
    const result = await MockSyncApi.checkConnectivity();
    expect(typeof result).toBe('boolean');
  });

  test('syncTags handles empty array', async () => {
    const result = await MockSyncApi.syncTags([]);
    expect(result).toEqual([]);
  });

  test('syncAudits handles empty array', async () => {
    const result = await MockSyncApi.syncAudits([]);
    expect(result).toEqual([]);
  });
});

describe('SyncService', () => {
  // We test the service through the mock API since the actual service
  // has dependencies on the database

  test('mock API simulates latency', async () => {
    const start = Date.now();
    await MockSyncApi.syncTags([]);
    const duration = Date.now() - start;

    // Should take at least 200ms (min delay)
    expect(duration).toBeGreaterThanOrEqual(150);
  });

  test('mock API generates unique server IDs', async () => {
    const tags = [
      { uuid: 'tag-1', colorHex: '#ff0000', unique_id: 'TAG-001', lat: 0, lon: 0, timestamp: '', created_at: 0, updated_at: 0, sync_pending: true },
      { uuid: 'tag-2', colorHex: '#00ff00', unique_id: 'TAG-002', lat: 0, lon: 0, timestamp: '', created_at: 0, updated_at: 0, sync_pending: true },
    ];

    const result = await MockSyncApi.syncTags(tags);

    expect(result[0].server_id).not.toBe(result[1].server_id);
  });
});
