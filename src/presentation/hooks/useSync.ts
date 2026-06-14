/**
 * useSync Hook - React hook for synchronization UI.
 *
 * Provides:
 * - Current sync status
 * - Trigger manual sync
 * - Start/stop auto-sync
 * - Last sync result
 *
 * Usage:
 * ```tsx
 * const { status, syncNow, isSyncing, lastResult } = useSync();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SyncStatus } from '../../domain/audit/AuditRecord';
import { syncService, SyncResult } from '../../infrastructure/sync/syncService';
import { getSyncStatus } from '../../data/tagService';

export type UseSyncReturn = {
  /** Current sync status (pending counts) */
  status: SyncStatus;

  /** Whether sync is currently in progress */
  isSyncing: boolean;

  /** Last sync result (null if never synced) */
  lastResult: SyncResult | null;

  /** Trigger a manual sync */
  syncNow: () => Promise<SyncResult>;

  /** Start auto-sync */
  startAutoSync: () => void;

  /** Stop auto-sync */
  stopAutoSync: () => void;

  /** Whether auto-sync is enabled */
  autoSyncEnabled: boolean;

  /** Refresh status from database */
  refreshStatus: () => Promise<void>;
};

export function useSync(): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>({
    tags_pending: 0,
    audits_pending: 0,
    total_pending: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const mountedRef = useRef(true);

  // Refresh status from database
  const refreshStatus = useCallback(async () => {
    try {
      const newStatus = await getSyncStatus();
      if (mountedRef.current) {
        setStatus(newStatus);
      }
    } catch (err) {
      console.error('[useSync] Failed to refresh status:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshStatus();
    return () => { mountedRef.current = false; };
  }, [refreshStatus]);

  // Subscribe to sync service updates
  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      if (mountedRef.current) {
        setStatus(newStatus);
      }
    });

    return unsubscribe;
  }, []);

  // Sync now
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return {
        success: false,
        tags_synced: 0,
        audits_synced: 0,
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    setIsSyncing(true);
    try {
      const result = await syncService.syncNow();
      if (mountedRef.current) {
        setLastResult(result);
        await refreshStatus();
      }
      return result;
    } finally {
      if (mountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [isSyncing, refreshStatus]);

  // Start auto-sync
  const startAutoSync = useCallback(() => {
    syncService.startAutoSync();
    setAutoSyncEnabled(true);
  }, []);

  // Stop auto-sync
  const stopAutoSync = useCallback(() => {
    syncService.stopAutoSync();
    setAutoSyncEnabled(false);
  }, []);

  return {
    status,
    isSyncing,
    lastResult,
    syncNow,
    startAutoSync,
    stopAutoSync,
    autoSyncEnabled,
    refreshStatus,
  };
}

export default useSync;
