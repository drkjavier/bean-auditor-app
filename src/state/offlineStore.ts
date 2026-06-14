/**
 * Offline Store - Manages offline operation queue
 *
 * Tracks operations performed while offline:
 * - Audit records created
 * - Tags modified
 * - Any data changes
 *
 * These operations are queued and replayed when connectivity is restored.
 * Provides visibility into what will be synced next.
 */

import { create } from 'zustand';
import { TagRecord, AuditRecord } from '../domain/audit/AuditRecord';

// ── Types ──────────────────────────────────────────────────────────────────

export type OfflineOperation = {
  /** Unique operation ID */
  id: string;

  /** Operation type */
  type: 'create_audit' | 'update_tag' | 'create_tag' | 'update_farm' | 'update_user';

  /** Record data */
  data: any;

  /** When the operation was performed (epoch ms) */
  timestamp: number;

  /** Whether this operation has been synced */
  synced: boolean;

  /** Sync error message (if failed) */
  error?: string;
};

type OfflineState = {
  /** Queue of pending offline operations */
  operations: OfflineOperation[];

  /** Whether the queue is being processed */
  isProcessing: boolean;

  /** Last processing result */
  lastProcessResult: {
    success: number;
    failed: number;
    timestamp: number;
  } | null;
};

type OfflineActions = {
  /** Add an operation to the queue */
  addOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'synced'>) => void;

  /** Mark an operation as synced */
  markSynced: (id: string) => void;

  /** Mark an operation as failed */
  markFailed: (id: string, error: string) => void;

  /** Remove a synced operation from queue */
  removeSynced: (id: string) => void;

  /** Clear all synced operations */
  clearSynced: () => void;

  /** Get count of pending operations */
  getPendingCount: () => number;

  /** Get all pending operations */
  getPendingOperations: () => OfflineOperation[];

  /** Process operations (called by sync) */
  processOperations: () => Promise<{ success: number; failed: number }>;

  /** Reset store */
  reset: () => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────

let operationCounter = 0;

function generateOperationId(): string {
  operationCounter += 1;
  return `op_${Date.now()}_${operationCounter}`;
}

// ── Store ──────────────────────────────────────────────────────────────────

const initialState: OfflineState = {
  operations: [],
  isProcessing: false,
  lastProcessResult: null,
};

export const useOfflineStore = create<OfflineState & OfflineActions>((set, get) => ({
  ...initialState,

  addOperation: (operation) => {
    const newOp: OfflineOperation = {
      ...operation,
      id: generateOperationId(),
      timestamp: Date.now(),
      synced: false,
    };

    set((state) => ({
      operations: [...state.operations, newOp],
    }));
  },

  markSynced: (id) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, synced: true } : op
      ),
    }));
  },

  markFailed: (id, error) => {
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, error } : op
      ),
    }));
  },

  removeSynced: (id) => {
    set((state) => ({
      operations: state.operations.filter((op) => op.id !== id),
    }));
  },

  clearSynced: () => {
    set((state) => ({
      operations: state.operations.filter((op) => !op.synced),
    }));
  },

  getPendingCount: () => {
    return get().operations.filter((op) => !op.synced).length;
  },

  getPendingOperations: () => {
    return get().operations.filter((op) => !op.synced);
  },

  processOperations: async () => {
    const { operations, isProcessing } = get();

    if (isProcessing) {
      return { success: 0, failed: 0 };
    }

    const pendingOps = operations.filter((op) => !op.synced);
    if (pendingOps.length === 0) {
      return { success: 0, failed: 0 };
    }

    set({ isProcessing: true });

    let success = 0;
    let failed = 0;

    // Process operations sequentially
    for (const op of pendingOps) {
      try {
        // In a real implementation, this would call the appropriate repository
        // to persist the operation. For now, we just mark it as synced.
        // The actual sync happens in the SyncOrchestrator.

        // Mark as synced
        get().markSynced(op.id);
        success++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed';
        get().markFailed(op.id, message);
        failed++;
      }
    }

    const result = { success, failed, timestamp: Date.now() };
    set({ isProcessing: false, lastProcessResult: result });

    return { success, failed };
  },

  reset: () => {
    set({ ...initialState });
  },
}));

// ── Selectors ──────────────────────────────────────────────────────────────

export const useOfflinePendingCount = () =>
  useOfflineStore((state) => state.operations.filter((op) => !op.synced).length);

export const useOfflineOperations = () =>
  useOfflineStore((state) => state.operations);

export const useOfflineIsProcessing = () =>
  useOfflineStore((state) => state.isProcessing);

export const useOfflineLastResult = () =>
  useOfflineStore((state) => state.lastProcessResult);

export default useOfflineStore;
