/**
 * Sync Store - Global state for synchronization.
 *
 * Manages:
 * - Current sync status (pending counts)
 * - Sync progress (isSyncing, progress message)
 * - Pull/Push results
 * - Auto-sync preference
 * - Connectivity status
 * - Manual conflicts
 *
 * Integrates with SyncOrchestrator for actual sync operations.
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { SyncStatus } from '../domain/audit/AuditRecord';
import { SyncOrchestrator, SyncResult, SyncProgress } from '../domain/sync/SyncOrchestrator';
import { ManualConflict } from '../domain/sync/ConflictResolver';
import { PullResult } from '../domain/sync/PullUseCase';
import { PushResult } from '../domain/sync/PushUseCase';
import * as syncRepo from '../data/sync';
import { syncApi } from '../infrastructure/api/syncApi';

// ── Types ──────────────────────────────────────────────────────────────────

type SyncState = {
  /** Current sync status (pending counts from DB) */
  status: SyncStatus;

  /** Whether sync is currently in progress */
  isSyncing: boolean;

  /** Current sync progress message */
  progressMessage: string | null;

  /** Current sync progress (0-100) */
  progressPercent: number | null;

  /** Last pull result (null if never pulled) */
  lastPullResult: PullResult | null;

  /** Last push result (null if never pushed) */
  lastPushResult: PushResult | null;

  /** Whether auto-sync is enabled */
  autoSyncEnabled: boolean;

  /** Whether initial status has been loaded */
  isInitialized: boolean;

  /** Whether pull has been completed at least once */
  hasInitialized: boolean;

  /** Seconds until next auto-sync (null if auto-sync disabled) */
  nextSyncIn: number | null;

  /** Timestamp of last sync completion (epoch ms) */
  lastSyncTimestamp: number | null;

  /** Whether device is connected to internet */
  isConnected: boolean;

  /** Pending manual conflicts */
  manualConflicts: ManualConflict[];

  /** Current sync errors */
  errors: string[];
};

type SyncActions = {
  /** Trigger a full sync (pull + push) */
  syncNow: () => Promise<SyncResult>;

  /** Pull only (download from server) */
  pullNow: () => Promise<SyncResult>;

  /** Push only (upload to server) */
  pushNow: () => Promise<SyncResult>;

  /** Start auto-sync */
  startAutoSync: () => void;

  /** Stop auto-sync */
  stopAutoSync: () => void;

  /** Refresh status from database */
  refreshStatus: () => Promise<void>;

  /** Initialize store (no orchestrator needed - creates internally) */
  initialize: () => () => void;

  /** Update connectivity status */
  setConnected: (connected: boolean) => void;

  /** Resolve a manual conflict */
  resolveConflict: (conflictId: string, choice: 'local' | 'server') => void;

  /** Clear errors */
  clearErrors: () => void;
};

// ── Initial State ──────────────────────────────────────────────────────────

const initialState: SyncState = {
  status: {
    tags_pending: 0,
    audits_pending: 0,
    total_pending: 0,
  },
  isSyncing: false,
  progressMessage: null,
  progressPercent: null,
  lastPullResult: null,
  lastPushResult: null,
  autoSyncEnabled: false,
  isInitialized: false,
  hasInitialized: false,
  nextSyncIn: null,
  lastSyncTimestamp: null,
  isConnected: true,
  manualConflicts: [],
  errors: [],
};

// ── Timer Management ───────────────────────────────────────────────────────

let countdownTimer: ReturnType<typeof setInterval> | null = null;
let orchestratorRef: SyncOrchestrator | null = null;

function clearCountdownTimer(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function getOrchestrator(): SyncOrchestrator {
  if (!orchestratorRef) {
    orchestratorRef = new SyncOrchestrator(syncApi);
  }
  return orchestratorRef;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useSyncStore = create<SyncState & SyncActions>((set, get) => ({
  ...initialState,

  syncNow: async (): Promise<SyncResult> => {
    const { isSyncing, isConnected } = get();

    // Prevent concurrent syncs
    if (isSyncing) {
      return {
        success: false,
        conflicts: [],
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    // Check connectivity
    if (!isConnected) {
      return {
        success: false,
        conflicts: [],
        errors: ['Sin conectividad a internet'],
        timestamp: Date.now(),
      };
    }

    const orchestrator = getOrchestrator();
    set({ isSyncing: true, errors: [] });

    try {
      const result = await orchestrator.syncNow('full');
      const now = Date.now();

      set({
        lastPullResult: result.pull ?? null,
        lastPushResult: result.push ?? null,
        lastSyncTimestamp: now,
        hasInitialized: true,
        manualConflicts: result.conflicts.filter(
          (c): c is any => 'localVersion' in c
        ),
      });

      // Refresh status after sync
      await get().refreshStatus();

      // Reset countdown if auto-sync is enabled
      const { autoSyncEnabled } = get();
      if (autoSyncEnabled) {
        const state = await orchestrator.getState();
        const intervalSec = Math.ceil(state.autoSyncInterval / 1000);
        set({ nextSyncIn: intervalSec });
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      set({ errors: [message] });
      return {
        success: false,
        conflicts: [],
        errors: [message],
        timestamp: Date.now(),
      };
    } finally {
      set({ isSyncing: false, progressMessage: null, progressPercent: null });
    }
  },

  pullNow: async (): Promise<SyncResult> => {
    const { isSyncing, isConnected } = get();

    if (isSyncing || !isConnected) {
      return {
        success: false,
        conflicts: [],
        errors: ['Cannot pull now'],
        timestamp: Date.now(),
      };
    }

    const orchestrator = getOrchestrator();
    set({ isSyncing: true, errors: [] });

    try {
      const result = await orchestrator.pullNow();
      set({
        lastPullResult: result.pull ?? null,
        lastSyncTimestamp: Date.now(),
        hasInitialized: true,
      });
      await get().refreshStatus();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      set({ errors: [message] });
      return {
        success: false,
        conflicts: [],
        errors: [message],
        timestamp: Date.now(),
      };
    } finally {
      set({ isSyncing: false, progressMessage: null, progressPercent: null });
    }
  },

  pushNow: async (): Promise<SyncResult> => {
    const { isSyncing, isConnected } = get();

    if (isSyncing || !isConnected) {
      return {
        success: false,
        conflicts: [],
        errors: ['Cannot push now'],
        timestamp: Date.now(),
      };
    }

    const orchestrator = getOrchestrator();
    set({ isSyncing: true, errors: [] });

    try {
      const result = await orchestrator.pushNow();
      set({
        lastPushResult: result.push ?? null,
        lastSyncTimestamp: Date.now(),
      });
      await get().refreshStatus();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      set({ errors: [message] });
      return {
        success: false,
        conflicts: [],
        errors: [message],
        timestamp: Date.now(),
      };
    } finally {
      set({ isSyncing: false, progressMessage: null, progressPercent: null });
    }
  },

  startAutoSync: () => {
    const orchestrator = getOrchestrator();
    orchestrator.startAutoSync();
    set({ autoSyncEnabled: true });

    // Get interval from orchestrator state
    orchestrator.getState().then((state) => {
      const intervalSec = Math.ceil(state.autoSyncInterval / 1000);
      set({ nextSyncIn: intervalSec });

      // Start countdown timer
      clearCountdownTimer();
      countdownTimer = setInterval(() => {
        const { nextSyncIn, isSyncing } = get();
        if (isSyncing) return;

        if (nextSyncIn === null || nextSyncIn <= 0) {
          set({ nextSyncIn: intervalSec });
        } else {
          set({ nextSyncIn: nextSyncIn - 1 });
        }
      }, 1000);
    });
  },

  stopAutoSync: () => {
    if (orchestratorRef) {
      orchestratorRef.stopAutoSync();
    }
    clearCountdownTimer();
    set({ autoSyncEnabled: false, nextSyncIn: null });
  },

  refreshStatus: async () => {
    try {
      const newStatus = await syncRepo.getSyncStatus();
      set({ status: newStatus });
    } catch (err) {
      console.error('[syncStore] Failed to refresh status:', err);
    }
  },

  initialize: () => {
    const { isInitialized } = get();
    if (isInitialized) return () => {};

    const orchestrator = getOrchestrator();

    // Load initial status
    get().refreshStatus();

    // Subscribe to orchestrator progress updates
    const unsubscribe = orchestrator.subscribe((progress: SyncProgress) => {
      set({
        progressMessage: progress.message,
        progressPercent: progress.progress ?? null,
      });
    });

    // Get initial state
    orchestrator.getState().then((state) => {
      set({
        hasInitialized: state.hasInitialized,
        lastSyncTimestamp: state.lastSyncTimestamp || null,
        autoSyncEnabled: state.autoSyncEnabled,
      });
    });

    set({ isInitialized: true });

    return () => {
      unsubscribe();
      clearCountdownTimer();
      set({ isInitialized: false, nextSyncIn: null });
    };
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  resolveConflict: (conflictId: string, choice: 'local' | 'server') => {
    const orchestrator = getOrchestrator();
    orchestrator.resolveManualConflict(conflictId, choice);
    set((state) => ({
      manualConflicts: state.manualConflicts.filter((c) => c.id !== conflictId),
    }));
  },

  clearErrors: () => {
    set({ errors: [] });
  },
}));

// ── Selectors ──────────────────────────────────────────────────────────────

export const usePendingCount = () => useSyncStore((state) => state.status.total_pending);
export const useIsSyncing = () => useSyncStore((state) => state.isSyncing);
export const useSyncProgress = () => useSyncStore(useShallow((state) => ({
  message: state.progressMessage,
  percent: state.progressPercent,
})));
export const useLastPullResult = () => useSyncStore((state) => state.lastPullResult);
export const useLastPushResult = () => useSyncStore((state) => state.lastPushResult);
export const useNextSyncIn = () => useSyncStore((state) => state.nextSyncIn);
export const useIsConnected = () => useSyncStore((state) => state.isConnected);
export const useManualConflicts = () => useSyncStore((state) => state.manualConflicts);
export const useSyncErrors = () => useSyncStore((state) => state.errors);

export default useSyncStore;
