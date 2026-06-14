/**
 * Tests for PushUseCase
 *
 * Tests the push (upload) functionality.
 */

import { PushUseCase } from '../../src/domain/sync/PushUseCase';
import { ISyncApi, ApiError } from '../../src/domain/sync/ISyncApi';
import { PushResponse } from '../../src/domain/sync/SyncContracts';
import { TagRecord, AuditRecord } from '../../src/domain/audit/AuditRecord';

// Mock the sync repository
jest.mock('../../src/data/sync', () => ({
  getPendingSyncTags: jest.fn().mockResolvedValue([]),
  getPendingSyncAudits: jest.fn().mockResolvedValue([]),
  getPendingSyncFarms: jest.fn().mockResolvedValue([]),
  getPendingSyncUsers: jest.fn().mockResolvedValue([]),
  markTagAsSynced: jest.fn().mockResolvedValue(undefined),
  markAuditAsSynced: jest.fn().mockResolvedValue(undefined),
  markFarmAsSynced: jest.fn().mockResolvedValue(undefined),
  markUserAsSynced: jest.fn().mockResolvedValue(undefined),
}));

describe('PushUseCase', () => {
  let pushUseCase: PushUseCase;
  let mockApi: jest.Mocked<ISyncApi>;

  const mockPendingTags: TagRecord[] = [
    {
      uuid: 'tag-1',
      colorHex: '#FF0000',
      unique_id: 'TAG-001',
      lat: 14.0,
      lon: -90.0,
      timestamp: '2024-01-01T00:00:00Z',
      created_at: 1704067200000,
      updated_at: 1704067200000,
      sync_pending: true,
      version: 1,
      updated_by: 'user1',
      farm_id: 'farm-1',
    },
  ];

  const mockPendingAudits: AuditRecord[] = [
    {
      uuid_tag: 'tag-1',
      status: 'audited',
      timestamp: 1704067200000,
      username: 'admin',
      lat: 14.0,
      lon: -90.0,
      note: null,
      sync_pending: true,
    },
  ];

  const mockPushResponse: PushResponse = {
    accepted: {
      tags: ['tag-1'],
      audits: ['tag-1'],
      farms: [],
      users: [],
    },
    rejected: [],
    serverTimestamp: 1704153600000,
    summary: {
      tagsAccepted: 1,
      tagsRejected: 0,
      auditsAccepted: 1,
      auditsRejected: 0,
    },
  };

  beforeEach(() => {
    mockApi = {
      pull: jest.fn(),
      push: jest.fn().mockResolvedValue(mockPushResponse),
      healthCheck: jest.fn(),
      checkConnectivity: jest.fn().mockResolvedValue(true),
    };

    pushUseCase = new PushUseCase(mockApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return success when no pending records', async () => {
      const result = await pushUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.tagsAccepted).toBe(0);
    });

    it('should return error when not connected', async () => {
      mockApi.checkConnectivity.mockResolvedValue(false);

      const result = await pushUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sin conectividad a internet');
    });

    it('should push pending tags successfully', async () => {
      const { getPendingSyncTags } = require('../../src/data/sync');
      getPendingSyncTags.mockResolvedValue(mockPendingTags);

      const result = await pushUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.tagsAccepted).toBe(1);
      expect(mockApi.push).toHaveBeenCalled();
    });

    it('should push pending audits successfully', async () => {
      const { getPendingSyncAudits } = require('../../src/data/sync');
      getPendingSyncAudits.mockResolvedValue(mockPendingAudits);

      const result = await pushUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.auditsAccepted).toBe(1);
    });

    it('should mark records as synced after successful push', async () => {
      const { getPendingSyncTags, markTagAsSynced } = require('../../src/data/sync');
      getPendingSyncTags.mockResolvedValue(mockPendingTags);

      await pushUseCase.execute();

      expect(markTagAsSynced).toHaveBeenCalledWith('tag-1');
    });

    it('should handle rejected records', async () => {
      const { getPendingSyncTags } = require('../../src/data/sync');
      getPendingSyncTags.mockResolvedValue(mockPendingTags);

      mockApi.push.mockResolvedValue({
        ...mockPushResponse,
        accepted: { ...mockPushResponse.accepted, tags: [] },
        rejected: [
          {
            type: 'tag',
            recordId: 'tag-1',
            reason: 'version_conflict',
            message: 'Version conflict',
          },
        ],
        summary: {
          ...mockPushResponse.summary,
          tagsAccepted: 0,
          tagsRejected: 1,
        },
      });

      const result = await pushUseCase.execute();

      expect(result.tagsRejected).toBe(1);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should notify progress updates', async () => {
      const { getPendingSyncTags } = require('../../src/data/sync');
      getPendingSyncTags.mockResolvedValue(mockPendingTags);

      const progressUpdates: any[] = [];
      pushUseCase.subscribe((progress) => {
        progressUpdates.push(progress);
      });

      await pushUseCase.execute();

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].phase).toBe('collecting');
    });

    it('should respect abort signal', async () => {
      const { getPendingSyncTags } = require('../../src/data/sync');
      getPendingSyncTags.mockResolvedValue(mockPendingTags);

      const controller = new AbortController();
      controller.abort();

      const result = await pushUseCase.execute({ signal: controller.signal });

      expect(result.success).toBe(false);
    });
  });
});
