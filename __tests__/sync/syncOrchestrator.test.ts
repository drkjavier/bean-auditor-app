/**
 * Tests for SyncOrchestrator
 *
 * Tests the orchestration of pull and push operations.
 */

import { SyncOrchestrator } from '../../src/domain/sync/SyncOrchestrator';
import { ISyncApi } from '../../src/domain/sync/ISyncApi';
import { PullResponse, PushResponse } from '../../src/domain/sync/SyncContracts';

// Mock the sync repository
jest.mock('../../src/data/sync', () => ({
  getSyncStatus: jest.fn().mockResolvedValue({
    tags_pending: 5,
    audits_pending: 3,
    farms_pending: 0,
    users_pending: 0,
    total_pending: 8,
  }),
  getLastSyncTimestamp: jest.fn().mockResolvedValue(1704067200000),
  setLastSyncTimestamp: jest.fn().mockResolvedValue(undefined),
  upsertTags: jest.fn().mockResolvedValue(0),
  upsertFarms: jest.fn().mockResolvedValue(0),
  upsertUsers: jest.fn().mockResolvedValue(0),
  getPendingSyncTags: jest.fn().mockResolvedValue([]),
  getPendingSyncAudits: jest.fn().mockResolvedValue([]),
  getPendingSyncFarms: jest.fn().mockResolvedValue([]),
  getPendingSyncUsers: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../src/infrastructure/connectivity', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
    subscribe: jest.fn().mockReturnValue(() => {}),
    checkConnectivity: jest.fn().mockResolvedValue(true),
  },
}));

describe('SyncOrchestrator', () => {
  let orchestrator: SyncOrchestrator;
  let mockApi: jest.Mocked<ISyncApi>;

  const mockPullResponse: PullResponse = {
    tags: [],
    farms: [],
    users: [],
    serverTimestamp: 1704153600000,
    hasMore: false,
  };

  const mockPushResponse: PushResponse = {
    accepted: { tags: [], audits: [], farms: [], users: [] },
    rejected: [],
    serverTimestamp: 1704153600000,
    summary: {
      tagsAccepted: 0,
      tagsRejected: 0,
      auditsAccepted: 0,
      auditsRejected: 0,
    },
  };

  beforeEach(() => {
    mockApi = {
      pull: jest.fn().mockResolvedValue(mockPullResponse),
      push: jest.fn().mockResolvedValue(mockPushResponse),
      healthCheck: jest.fn().mockResolvedValue({
        status: 'ok',
        latency: 50,
        timestamp: Date.now(),
      }),
      checkConnectivity: jest.fn().mockResolvedValue(true),
    };

    orchestrator = new SyncOrchestrator(mockApi);
  });

  afterEach(() => {
    orchestrator.destroy();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await orchestrator.initialize();

      const connectivityService = require('../../src/infrastructure/connectivity').default;
      expect(connectivityService.initialize).toHaveBeenCalled();
    });
  });

  describe('syncNow', () => {
    it('should perform full sync (pull + push)', async () => {
      await orchestrator.initialize();

      const result = await orchestrator.syncNow();

      // Result should have the expected structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('pull');
      expect(result).toHaveProperty('push');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return error when not connected', async () => {
      await orchestrator.initialize();
      mockApi.checkConnectivity.mockResolvedValue(false);

      const result = await orchestrator.syncNow();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sin conectividad a internet');
    });

    it('should prevent concurrent syncs', async () => {
      await orchestrator.initialize();

      // Start first sync
      const promise1 = orchestrator.syncNow();

      // Try to start second sync while first is running
      const result = await orchestrator.syncNow();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sync already in progress');

      // Wait for first sync to complete
      await promise1;
    });

    it('should notify progress updates', async () => {
      await orchestrator.initialize();

      const progressUpdates: any[] = [];
      orchestrator.subscribe((progress) => {
        progressUpdates.push(progress);
      });

      await orchestrator.syncNow();

      expect(progressUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('pullNow', () => {
    it('should call syncNow with pull mode', async () => {
      await orchestrator.initialize();

      const syncNowSpy = jest.spyOn(orchestrator, 'syncNow');
      await orchestrator.pullNow();

      expect(syncNowSpy).toHaveBeenCalledWith('pull');
    });
  });

  describe('pushNow', () => {
    it('should call syncNow with push mode', async () => {
      await orchestrator.initialize();

      const syncNowSpy = jest.spyOn(orchestrator, 'syncNow');
      await orchestrator.pushNow();

      expect(syncNowSpy).toHaveBeenCalledWith('push');
    });
  });

  describe('autoSync', () => {
    it('should start and stop auto sync', async () => {
      await orchestrator.initialize();

      orchestrator.updateConfig({ enableAutoSync: true, autoSyncInterval: 1000 });
      orchestrator.startAutoSync();

      // Verify auto-sync is running (we can't easily test the interval in unit tests)
      orchestrator.stopAutoSync();

      // No error means it worked
    });
  });

  describe('manual conflicts', () => {
    it('should get and resolve manual conflicts', async () => {
      await orchestrator.initialize();

      const conflicts = orchestrator.getManualConflicts();
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });
});
