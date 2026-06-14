/**
 * Tests for offlineStore
 *
 * Tests the offline operation queue functionality.
 */

import { useOfflineStore } from '../../src/state/offlineStore';

describe('offlineStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useOfflineStore.getState().reset();
  });

  describe('addOperation', () => {
    it('should add an operation to the queue', () => {
      const { addOperation } = useOfflineStore.getState();

      addOperation({
        type: 'create_audit',
        data: { uuid_tag: 'tag-1', status: 'audited' },
      });

      const { operations } = useOfflineStore.getState();
      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('create_audit');
      expect(operations[0].synced).toBe(false);
    });

    it('should generate unique operation IDs', () => {
      const { addOperation } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      addOperation({ type: 'update_tag', data: {} });

      const { operations } = useOfflineStore.getState();
      expect(operations[0].id).not.toBe(operations[1].id);
    });

    it('should set timestamp on creation', () => {
      const before = Date.now();
      const { addOperation } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });

      const { operations } = useOfflineStore.getState();
      expect(operations[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(operations[0].timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('markSynced', () => {
    it('should mark an operation as synced', () => {
      const { addOperation, markSynced } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      const { operations } = useOfflineStore.getState();
      const opId = operations[0].id;

      markSynced(opId);

      const { operations: updatedOps } = useOfflineStore.getState();
      expect(updatedOps[0].synced).toBe(true);
    });
  });

  describe('markFailed', () => {
    it('should mark an operation as failed with error', () => {
      const { addOperation, markFailed } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      const { operations } = useOfflineStore.getState();
      const opId = operations[0].id;

      markFailed(opId, 'Network error');

      const { operations: updatedOps } = useOfflineStore.getState();
      expect(updatedOps[0].error).toBe('Network error');
    });
  });

  describe('removeSynced', () => {
    it('should remove a synced operation from queue', () => {
      const { addOperation, markSynced, removeSynced } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      const { operations } = useOfflineStore.getState();
      const opId = operations[0].id;

      markSynced(opId);
      removeSynced(opId);

      const { operations: updatedOps } = useOfflineStore.getState();
      expect(updatedOps).toHaveLength(0);
    });
  });

  describe('clearSynced', () => {
    it('should clear all synced operations', () => {
      const { addOperation, markSynced, clearSynced } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      addOperation({ type: 'update_tag', data: {} });

      const { operations } = useOfflineStore.getState();
      markSynced(operations[0].id);

      clearSynced();

      const { operations: updatedOps } = useOfflineStore.getState();
      expect(updatedOps).toHaveLength(1);
      expect(updatedOps[0].synced).toBe(false);
    });
  });

  describe('getPendingCount', () => {
    it('should return count of pending operations', () => {
      const { addOperation, markSynced, getPendingCount } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      addOperation({ type: 'update_tag', data: {} });
      addOperation({ type: 'create_tag', data: {} });

      expect(getPendingCount()).toBe(3);

      const { operations } = useOfflineStore.getState();
      markSynced(operations[0].id);

      expect(getPendingCount()).toBe(2);
    });
  });

  describe('getPendingOperations', () => {
    it('should return only pending operations', () => {
      const { addOperation, markSynced, getPendingOperations } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      addOperation({ type: 'update_tag', data: {} });

      const { operations } = useOfflineStore.getState();
      markSynced(operations[0].id);

      const pending = getPendingOperations();
      expect(pending).toHaveLength(1);
      expect(pending[0].synced).toBe(false);
    });
  });

  describe('processOperations', () => {
    it('should process pending operations', async () => {
      const { addOperation, processOperations } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      addOperation({ type: 'update_tag', data: {} });

      const result = await processOperations();

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should not process if already processing', async () => {
      const { addOperation, processOperations } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });

      // Start processing
      const promise1 = processOperations();

      // Try to process again while first is running
      const result = await processOperations();

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);

      await promise1;
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const { addOperation, reset } = useOfflineStore.getState();

      addOperation({ type: 'create_audit', data: {} });
      addOperation({ type: 'update_tag', data: {} });

      reset();

      const state = useOfflineStore.getState();
      expect(state.operations).toHaveLength(0);
      expect(state.isProcessing).toBe(false);
      expect(state.lastProcessResult).toBeNull();
    });
  });
});
