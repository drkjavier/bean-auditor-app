/**
 * Sync Service - Orchestrates synchronization with backend.
 *
 * This service:
 * 1. Reads pending records from local SQLite
 * 2. Sends them to the server via SyncApi
 * 3. Marks them as synced on success
 * 4. Handles failures gracefully
 *
 * To switch from mock to real API:
 * 1. Replace MockSyncApi with your real implementation
 * 2. Or create a factory that selects the right API based on environment
 */

import { SyncStatus } from '../../domain/audit/AuditRecord';
import { MockSyncApi, SyncApiInterface } from './mockSyncApi';
import {
  getPendingSyncTags,
  getPendingSyncAudits,
  markTagAsSynced,
  markAuditAsSynced,
  getSyncStatus,
} from '../../data/tagService';

// ── Configuration ────────────────────────────────────────────────────────────

const SYNC_CONFIG = {
  /** Max retries per sync attempt */
  maxRetries: 3,

  /** Delay between retries (ms) */
  retryDelay: 1000,

  /** Batch size for sync (max records per request) */
  batchSize: 50,

  /** Auto-sync interval (ms) - 0 = disabled */
  autoSyncInterval: 30_000, // 30 seconds

  /** Enable console logging */
  enableLogging: true,
};

// ── Types ────────────────────────────────────────────────────────────────────

export type SyncResult = {
  success: boolean;
  tags_synced: number;
  audits_synced: number;
  errors: string[];
  timestamp: number;
};

export type SyncListener = (status: SyncStatus) => void;

// ── Service ──────────────────────────────────────────────────────────────────

class SyncService {
  private api: SyncApiInterface;
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(api: SyncApiInterface = MockSyncApi) {
    this.api = api;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Perform a full sync cycle:
   * 1. Check connectivity
   * 2. Send pending tags
   * 3. Send pending audits
   * 4. Mark as synced
   */
  async syncNow(): Promise<SyncResult> {
    if (this.isSyncing) {
      this.log('Sync already in progress, skipping...');
      return {
        success: false,
        tags_synced: 0,
        audits_synced: 0,
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    this.log('Starting sync...');

    const result: SyncResult = {
      success: true,
      tags_synced: 0,
      audits_synced: 0,
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // 1. Check connectivity
      const isConnected = await this.api.checkConnectivity();
      if (!isConnected) {
        this.log('No connectivity, aborting sync');
        result.success = false;
        result.errors.push('No network connectivity');
        return result;
      }

      // 2. Sync tags
      const tagsResult = await this.syncTags();
      result.tags_synced = tagsResult.synced;
      result.errors.push(...tagsResult.errors);

      // 3. Sync audits
      const auditsResult = await this.syncAudits();
      result.audits_synced = auditsResult.synced;
      result.errors.push(...auditsResult.errors);

      // 4. Update status
      result.success = result.errors.length === 0;
      this.log(`Sync complete: ${result.tags_synced} tags, ${result.audits_synced} audits`);

    } catch (err) {
      this.log('Sync failed:', err);
      result.success = false;
      result.errors.push(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
      // Fire-and-forget async notification
      this.notifyListeners().catch(err => {
        this.log('Failed to notify listeners:', err);
      });
    }

    return result;
  }

  /**
   * Start automatic sync at configured interval.
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      this.log('Auto-sync already running');
      return;
    }

    if (SYNC_CONFIG.autoSyncInterval <= 0) {
      this.log('Auto-sync disabled');
      return;
    }

    this.log(`Starting auto-sync every ${SYNC_CONFIG.autoSyncInterval / 1000}s`);

    this.syncTimer = setInterval(() => {
      this.syncNow().catch(err => {
        this.log('Auto-sync error:', err);
      });
    }, SYNC_CONFIG.autoSyncInterval);
  }

  /**
   * Stop automatic sync.
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      this.log('Auto-sync stopped');
    }
  }

  /**
   * Subscribe to sync status changes.
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if sync is currently in progress.
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get current sync configuration.
   */
  getConfig() {
    return { ...SYNC_CONFIG };
  }

  /**
   * Get auto-sync interval in milliseconds.
   */
  getAutoSyncInterval(): number {
    return SYNC_CONFIG.autoSyncInterval;
  }

  /**
   * Update sync configuration.
   */
  updateConfig(partial: Partial<typeof SYNC_CONFIG>): void {
    Object.assign(SYNC_CONFIG, partial);
    this.log('Config updated:', partial);
  }

  /**
   * Replace the API implementation (for switching mock → real).
   */
  setApi(api: SyncApiInterface): void {
    this.api = api;
    this.log('API implementation replaced');
  }

  // ── Private Methods ─────────────────────────────────────────────────────

  private async syncTags(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const pendingTags = await getPendingSyncTags();

      if (pendingTags.length === 0) {
        this.log('No pending tags to sync');
        return { synced: 0, errors: [] };
      }

      this.log(`Syncing ${pendingTags.length} tags...`);

      // Process in batches
      for (let i = 0; i < pendingTags.length; i += SYNC_CONFIG.batchSize) {
        const batch = pendingTags.slice(i, i + SYNC_CONFIG.batchSize);

        const result = await this.retry(() => this.api.syncTags(batch));

        // Mark each tag as synced
        for (const item of result) {
          await markTagAsSynced(item.uuid);
          synced++;
        }
      }

      this.log(`Tags synced: ${synced}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Tags sync failed: ${msg}`);
      this.log('Tags sync error:', err);
    }

    return { synced, errors };
  }

  private async syncAudits(): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const pendingAudits = await getPendingSyncAudits();

      if (pendingAudits.length === 0) {
        this.log('No pending audits to sync');
        return { synced: 0, errors: [] };
      }

      this.log(`Syncing ${pendingAudits.length} audits...`);

      // Process in batches
      for (let i = 0; i < pendingAudits.length; i += SYNC_CONFIG.batchSize) {
        const batch = pendingAudits.slice(i, i + SYNC_CONFIG.batchSize);

        const result = await this.retry(() => this.api.syncAudits(batch));

        // Mark each audit as synced
        for (const item of result) {
          await markAuditAsSynced(item.uuid_tag, item.server_id);
          synced++;
        }
      }

      this.log(`Audits synced: ${synced}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Audits sync failed: ${msg}`);
      this.log('Audits sync error:', err);
    }

    return { synced, errors };
  }

  private async retry<T>(fn: () => Promise<T>, retries: number = SYNC_CONFIG.maxRetries): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.log(`Attempt ${attempt}/${retries} failed:`, lastError.message);

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  private async notifyListeners(): Promise<void> {
    try {
      // Get real sync status from database
      const status = await getSyncStatus();

      this.listeners.forEach(listener => {
        try {
          listener(status);
        } catch {
          // Ignore listener errors
        }
      });
    } catch (err) {
      this.log('Failed to notify listeners:', err);
    }
  }

  private log(...args: unknown[]): void {
    if (SYNC_CONFIG.enableLogging) {
      console.log('[SyncService]', ...args);
    }
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────

export const syncService = new SyncService();
export default syncService;
