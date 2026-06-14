/**
 * Tests for ConflictResolver
 *
 * Tests the last-write-wins conflict resolution strategy.
 */

import { ConflictResolver } from '../../src/domain/sync/ConflictResolver';
import { TagRecord } from '../../src/domain/audit/AuditRecord';
import { Farm } from '../../src/domain/farm/Farm';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('resolve', () => {
    it('should prefer local version when local is newer', () => {
      const local: TagRecord = {
        uuid: 'tag-1',
        colorHex: '#FF0000',
        unique_id: 'TAG-001',
        lat: 14.0,
        lon: -90.0,
        timestamp: '2024-01-01T00:00:00Z',
        created_at: 1704067200000,
        updated_at: 1704153600000, // Jan 2, 2024
        sync_pending: true,
        version: 2,
        updated_by: 'user1',
        farm_id: null,
      };

      const server: TagRecord = {
        ...local,
        updated_at: 1704067200000, // Jan 1, 2024
        version: 1,
      };

      const result = resolver.resolve(local, server, 'tag');

      expect(result.winner).toBe('local');
      expect(result.reason).toBe('timestamp_local_newer');
      expect(result.record).toBe(local);
    });

    it('should prefer server version when server is newer', () => {
      const local: TagRecord = {
        uuid: 'tag-1',
        colorHex: '#FF0000',
        unique_id: 'TAG-001',
        lat: 14.0,
        lon: -90.0,
        timestamp: '2024-01-01T00:00:00Z',
        created_at: 1704067200000,
        updated_at: 1704067200000, // Jan 1, 2024
        sync_pending: true,
        version: 1,
        updated_by: 'user1',
        farm_id: null,
      };

      const server: TagRecord = {
        ...local,
        updated_at: 1704153600000, // Jan 2, 2024
        version: 2,
      };

      const result = resolver.resolve(local, server, 'tag');

      expect(result.winner).toBe('server');
      expect(result.reason).toBe('timestamp_server_newer');
      expect(result.record).toBe(server);
    });

    it('should prefer server version when timestamps are equal (tie)', () => {
      const timestamp = 1704067200000;

      const local: TagRecord = {
        uuid: 'tag-1',
        colorHex: '#FF0000',
        unique_id: 'TAG-001',
        lat: 14.0,
        lon: -90.0,
        timestamp: '2024-01-01T00:00:00Z',
        created_at: timestamp,
        updated_at: timestamp,
        sync_pending: true,
        version: 1,
        updated_by: 'user1',
        farm_id: null,
      };

      const server: TagRecord = {
        ...local,
        colorHex: '#00FF00', // Different color
      };

      const result = resolver.resolve(local, server, 'tag');

      expect(result.winner).toBe('server');
      expect(result.reason).toBe('server_wins_tie');
      expect(result.record).toBe(server);
    });
  });

  describe('resolveBatch', () => {
    it('should resolve batch with no conflicts', () => {
      const localRecords = new Map<string, TagRecord>();
      const serverRecords: TagRecord[] = [
        {
          uuid: 'tag-new',
          colorHex: '#FF0000',
          unique_id: 'TAG-NEW',
          lat: 14.0,
          lon: -90.0,
          timestamp: '2024-01-01T00:00:00Z',
          created_at: 1704067200000,
          updated_at: 1704067200000,
          sync_pending: false,
          version: 1,
          updated_by: null,
          farm_id: null,
        },
      ];

      const result = resolver.resolveBatch(localRecords, serverRecords, 'tag');

      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].uuid).toBe('tag-new');
      expect(result.manualConflicts).toHaveLength(0);
    });

    it('should resolve batch with conflicts using last-write-wins', () => {
      const localRecord: TagRecord = {
        uuid: 'tag-1',
        colorHex: '#FF0000',
        unique_id: 'TAG-001',
        lat: 14.0,
        lon: -90.0,
        timestamp: '2024-01-01T00:00:00Z',
        created_at: 1704067200000,
        updated_at: 1704153600000, // Jan 2 (newer)
        sync_pending: true,
        version: 2,
        updated_by: 'user1',
        farm_id: null,
      };

      const serverRecord: TagRecord = {
        ...localRecord,
        colorHex: '#00FF00',
        updated_at: 1704067200000, // Jan 1 (older)
        version: 1,
      };

      const localRecords = new Map([['tag-1', localRecord]]);
      const serverRecords = [serverRecord];

      const result = resolver.resolveBatch(localRecords, serverRecords, 'tag');

      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0]).toBe(localRecord); // Local wins
      expect(result.manualConflicts).toHaveLength(0);
    });
  });

  describe('manual conflicts', () => {
    it('should add and retrieve manual conflicts', () => {
      const conflict = {
        id: 'conflict-1',
        type: 'tag' as const,
        recordId: 'tag-1',
        localVersion: { updated_at: 1000 } as any,
        serverVersion: { updated_at: 2000 } as any,
        description: 'Test conflict',
      };

      resolver.addManualConflict(conflict);
      const conflicts = resolver.getManualConflicts();

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe('conflict-1');
    });

    it('should resolve manual conflict with local choice', () => {
      const localVersion = { id: 'tag-1', updated_at: 1000 };
      const serverVersion = { id: 'tag-1', updated_at: 2000 };

      const conflict = {
        id: 'conflict-1',
        type: 'tag' as const,
        recordId: 'tag-1',
        localVersion,
        serverVersion,
        description: 'Test conflict',
      };

      resolver.addManualConflict(conflict);
      const resolved = resolver.resolveManualConflict('conflict-1', 'local');

      expect(resolved).toBe(localVersion);
      expect(resolver.getManualConflicts()).toHaveLength(0);
    });

    it('should resolve manual conflict with server choice', () => {
      const localVersion = { id: 'tag-1', updated_at: 1000 };
      const serverVersion = { id: 'tag-1', updated_at: 2000 };

      const conflict = {
        id: 'conflict-1',
        type: 'tag' as const,
        recordId: 'tag-1',
        localVersion,
        serverVersion,
        description: 'Test conflict',
      };

      resolver.addManualConflict(conflict);
      const resolved = resolver.resolveManualConflict('conflict-1', 'server');

      expect(resolved).toBe(serverVersion);
      expect(resolver.getManualConflicts()).toHaveLength(0);
    });

    it('should return null for non-existent conflict', () => {
      const resolved = resolver.resolveManualConflict('non-existent', 'local');
      expect(resolved).toBeNull();
    });

    it('should clear all manual conflicts', () => {
      resolver.addManualConflict({
        id: 'conflict-1',
        type: 'tag',
        recordId: 'tag-1',
        localVersion: {} as any,
        serverVersion: {} as any,
        description: 'Conflict 1',
      });

      resolver.addManualConflict({
        id: 'conflict-2',
        type: 'farm',
        recordId: 'farm-1',
        localVersion: {} as any,
        serverVersion: {} as any,
        description: 'Conflict 2',
      });

      expect(resolver.getManualConflicts()).toHaveLength(2);

      resolver.clearManualConflicts();

      expect(resolver.getManualConflicts()).toHaveLength(0);
    });
  });
});
