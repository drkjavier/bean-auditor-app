/**
 * Sync Orchestrator - Coordinate pull and push operations
 *
 * This is the main entry point for all sync operations.
 * It coordinates:
 * - Pull (download from server)
 * - Push (upload to server)
 * - Auto-sync scheduling
 * - Connectivity monitoring
 * - Conflict resolution
 *
 * Usage:
 *   const orchestrator = new SyncOrchestrator(api);
 *   await orchestrator.initialize();
 *   await orchestrator.syncNow(); // Pull + Push
 */

import { ISyncApi } from './ISyncApi';
import { PullUseCase, PullResult, PullProgress } from './PullUseCase';
import { PushUseCase, PushResult, PushProgress } from './PushUseCase';
import { ConflictResolver, ManualConflict } from './ConflictResolver';
import { SyncConflict, SyncState } from './SyncContracts';
import * as syncRepo from '../../data/sync';
import connectivityService from '../../infrastructure/connectivity';

// ── Types ──────────────────────────────────────────────────────────────────

export type SyncMode = 'pull' | 'push' | 'full';

export type SyncResult = {
  success: boolean;
  pull?: PullResult;
  push?: PushResult;
  conflicts: SyncConflict[];
  errors: string[];
  timestamp: number;
};

export type SyncProgress = {
  mode: SyncMode;
  phase: 'pull' | 'push' | 'complete' | 'error';
  message: string;
  progress?: number;
};

export type SyncListener = (progress: SyncProgress) => void;

// ── Configuration ──────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  autoSyncInterval: 30_000, // 30 seconds
  enableAutoSync: true,
  enableLogging: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
};

// ── Sync Orchestrator ──────────────────────────────────────────────────────

export class SyncOrchestrator {
  private api: ISyncApi;
  private pullUseCase: PullUseCase;
  private pushUseCase: PushUseCase;
  private conflictResolver: ConflictResolver;

  private config = { ...DEFAULT_CONFIG };
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor(api: ISyncApi) {
    this.api = api;
    this.pullUseCase = new PullUseCase(api);
    this.pushUseCase = new PushUseCase(api);
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Initialize the orchestrator.
   * Sets up connectivity monitoring and restores sync state.
   */
  async initialize(): Promise<void> {
    // Initialize connectivity service
    await connectivityService.initialize();

    // Subscribe to connectivity changes
    connectivityService.subscribe((isConnected: boolean) => {
      if (isConnected && this.config.enableAutoSync) {
        this.log('Connectivity restored, starting auto-sync');
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    });

    this.log('SyncOrchestrator initialized');
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.stopAutoSync();
    connectivityService.destroy();
    this.listeners.clear();
  }

  /**
   * Perform a full sync (pull + push).
   */
  async syncNow(mode: SyncMode = 'full'): Promise<SyncResult> {
    if (this.isSyncing) {
      this.log('Sync already in progress');
      return {
        success: false,
        conflicts: [],
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: false,
      conflicts: [],
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Check connectivity first
      const isConnected = await this.api.checkConnectivity();
      if (!isConnected) {
        result.errors.push('Sin conectividad a internet');
        return result;
      }

      // Pull phase
      if (mode === 'full' || mode === 'pull') {
        this.notifyProgress({
          mode,
          phase: 'pull',
          message: 'Descargando datos del servidor...',
        });

        result.pull = await this.pullUseCase.execute();

        if (!result.pull.success) {
          result.errors.push(...result.pull.errors);
        }

        result.conflicts.push(...result.pull.conflicts);
      }

      // Push phase
      if (mode === 'full' || mode === 'push') {
        this.notifyProgress({
          mode,
          phase: 'push',
          message: 'Enviando cambios al servidor...',
        });

        result.push = await this.pushUseCase.execute();

        if (!result.push.success) {
          result.errors.push(...result.push.errors);
        }

        result.conflicts.push(...result.push.conflicts);
      }

      // Complete
      result.success = result.errors.length === 0;

      this.notifyProgress({
        mode,
        phase: 'complete',
        message: result.success
          ? 'Sincronización completada exitosamente'
          : 'Sincronización completada con errores',
        progress: 100,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      result.errors.push(message);

      this.notifyProgress({
        mode,
        phase: 'error',
        message: `Error en sincronización: ${message}`,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Pull only (download from server).
   */
  async pullNow(): Promise<SyncResult> {
    return this.syncNow('pull');
  }

  /**
   * Push only (upload to server).
   */
  async pushNow(): Promise<SyncResult> {
    return this.syncNow('push');
  }

  /**
   * Start automatic sync.
   */
  startAutoSync(): void {
    if (this.autoSyncTimer) {
      this.log('Auto-sync already running');
      return;
    }

    if (!this.config.enableAutoSync) {
      this.log('Auto-sync disabled');
      return;
    }

    this.log(`Starting auto-sync every ${this.config.autoSyncInterval / 1000}s`);

    this.autoSyncTimer = setInterval(() => {
      this.syncNow().catch((err) => {
        this.log('Auto-sync error:', err);
      });
    }, this.config.autoSyncInterval);
  }

  /**
   * Stop automatic sync.
   */
  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
      this.log('Auto-sync stopped');
    }
  }

  /**
   * Get current sync state.
   */
  async getState(): Promise<SyncState> {
    const syncStatus = await syncRepo.getSyncStatus();
    const lastSyncTimestamp = await syncRepo.getLastSyncTimestamp();

    return {
      isSyncing: this.isSyncing,
      hasInitialized: lastSyncTimestamp !== null,
      pendingPush: syncStatus.total_pending,
      lastPullCount: 0, // Would need to track this
      lastSyncTimestamp: lastSyncTimestamp ?? 0,
      errors: [],
      autoSyncEnabled: this.config.enableAutoSync,
      autoSyncInterval: this.config.autoSyncInterval,
    };
  }

  /**
   * Get pending manual conflicts.
   */
  getManualConflicts(): ManualConflict[] {
    return this.conflictResolver.getManualConflicts();
  }

  /**
   * Resolve a manual conflict.
   */
  resolveManualConflict(
    conflictId: string,
    choice: 'local' | 'server'
  ): any {
    return this.conflictResolver.resolveManualConflict(conflictId, choice);
  }

  /**
   * Update configuration.
   */
  updateConfig(partial: Partial<typeof DEFAULT_CONFIG>): void {
    this.config = { ...this.config, ...partial };

    if (partial.enableAutoSync !== undefined) {
      if (partial.enableAutoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    this.log('Config updated:', partial);
  }

  /**
   * Subscribe to sync progress updates.
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private notifyProgress(progress: SyncProgress): void {
    this.listeners.forEach((listener) => {
      try {
        listener(progress);
      } catch {
        // Ignore listener errors
      }
    });
  }

  private log(...args: unknown[]): void {
    if (this.config.enableLogging) {
      console.log('[SyncOrchestrator]', ...args);
    }
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createSyncOrchestrator(api: ISyncApi): SyncOrchestrator {
  return new SyncOrchestrator(api);
}
