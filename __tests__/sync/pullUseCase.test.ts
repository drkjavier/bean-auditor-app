/**
 * Tests for PullUseCase
 *
 * Tests the pull (download) functionality.
 */

import { PullUseCase } from '../../src/domain/sync/PullUseCase';
import { ISyncApi, ApiError } from '../../src/domain/sync/ISyncApi';
import { PullResponse } from '../../src/domain/sync/SyncContracts';

// Mock the sync repository
jest.mock('../../src/data/sync', () => ({
  getLastSyncTimestamp: jest.fn().mockResolvedValue(null),
  setLastSyncTimestamp: jest.fn().mockResolvedValue(undefined),
  upsertTags: jest.fn().mockResolvedValue(10),
  upsertFarms: jest.fn().mockResolvedValue(5),
  upsertUsers: jest.fn().mockResolvedValue(3),
}));

describe('PullUseCase', () => {
  let pullUseCase: PullUseCase;
  let mockApi: jest.Mocked<ISyncApi>;

  const mockPullResponse: PullResponse = {
    tags: [
      {
        uuid: 'tag-1',
        colorHex: '#FF0000',
        unique_id: 'TAG-001',
        lat: 14.0,
        lon: -90.0,
        timestamp: '2024-01-01T00:00:00Z',
        created_at: 1704067200000,
        updated_at: 1704067200000,
        sync_pending: false,
        version: 1,
        updated_by: null,
        farm_id: 'farm-1',
      },
    ],
    farms: [
      {
        id: 'farm-1',
        name: 'Finca El Paraíso',
        location: 'Tiquisate, Guatemala',
        lat: 14.0,
        lon: -90.0,
        owner: 'Juan Pérez',
        area_hectares: 50,
        status: 'active',
        version: 1,
        created_at: 1704067200000,
        updated_at: 1704067200000,
        sync_pending: false,
      },
    ],
    users: [
      {
        id: 'user-1',
        username: 'admin',
        display_name: 'Administrador',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true,
        version: 1,
        created_at: 1704067200000,
        updated_at: 1704067200000,
        sync_pending: false,
      },
    ],
    serverTimestamp: 1704153600000,
    hasMore: false,
  };

  beforeEach(() => {
    mockApi = {
      pull: jest.fn().mockResolvedValue(mockPullResponse),
      push: jest.fn(),
      healthCheck: jest.fn(),
      checkConnectivity: jest.fn().mockResolvedValue(true),
    };

    pullUseCase = new PullUseCase(mockApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully pull data from server', async () => {
      const result = await pullUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.tagsDownloaded).toBe(10);
      expect(result.farmsDownloaded).toBe(5);
      expect(result.usersDownloaded).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when not connected', async () => {
      mockApi.checkConnectivity.mockResolvedValue(false);

      const result = await pullUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sin conectividad a internet');
    });

    it('should handle API errors gracefully', async () => {
      mockApi.pull.mockRejectedValue(new ApiError('Server error', 500, '/api/sync/pull', true));

      const result = await pullUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should call API with lastSync for incremental pull', async () => {
      const { getLastSyncTimestamp } = require('../../src/data/sync');
      getLastSyncTimestamp.mockResolvedValue(1704067200000);

      await pullUseCase.execute();

      expect(mockApi.pull).toHaveBeenCalledWith(
        expect.objectContaining({
          lastSync: 1704067200000,
        })
      );
    });

    it('should handle pagination (hasMore)', async () => {
      const page1: PullResponse = {
        ...mockPullResponse,
        hasMore: true,
        nextCursor: 'cursor-1',
      };

      const page2: PullResponse = {
        ...mockPullResponse,
        tags: [
          {
            ...mockPullResponse.tags[0],
            uuid: 'tag-2',
            unique_id: 'TAG-002',
          },
        ],
        hasMore: false,
      };

      mockApi.pull
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const result = await pullUseCase.execute();

      expect(result.success).toBe(true);
      expect(mockApi.pull).toHaveBeenCalledTimes(2);
    });

    it('should notify progress updates', async () => {
      const progressUpdates: any[] = [];
      pullUseCase.subscribe((progress) => {
        progressUpdates.push(progress);
      });

      await pullUseCase.execute();

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].phase).toBe('connecting');
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe('complete');
    });

    it('should respect abort signal', async () => {
      const controller = new AbortController();
      controller.abort(); // Abort immediately

      const result = await pullUseCase.execute({ signal: controller.signal });

      expect(result.success).toBe(false);
    });
  });
});
