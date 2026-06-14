/**
 * Pull Use Case - Download data from server for offline operation
 *
 * This use case orchestrates the pull process:
 * 1. Check connectivity
 * 2. Fetch data from server (with pagination support)
 * 3. Merge with local data (last-write-wins strategy)
 * 4. Update local database
 * 5. Update sync metadata
 *
 * Supports incremental pulls (only changed data since lastSync).
 */

import { ISyncApi } from './ISyncApi';
import { PullRequest, PullResponse, SyncConflict } from './SyncContracts';
import * as syncRepo from '../../data/sync';

// ── Types ──────────────────────────────────────────────────────────────────

export type PullResult = {
  success: boolean;
  tagsDownloaded: number;
  farmsDownloaded: number;
  usersDownloaded: number;
  conflicts: SyncConflict[];
  errors: string[];
  timestamp: number;
};

export type PullProgress = {
  phase: 'connecting' | 'fetching' | 'merging' | 'complete' | 'error';
  message: string;
  progress?: number; // 0-100
};

export type PullListener = (progress: PullProgress) => void;

// ── Pull Use Case ──────────────────────────────────────────────────────────

export class PullUseCase {
  private api: ISyncApi;
  private listeners: Set<PullListener> = new Set();

  constructor(api: ISyncApi) {
    this.api = api;
  }

  /**
   * Execute pull operation.
   *
   * @param options - Pull options
   * @returns PullResult with download counts and any conflicts
   */
  async execute(options?: {
    forceFullSync?: boolean;
    signal?: AbortSignal;
  }): Promise<PullResult> {
    const result: PullResult = {
      success: false,
      tagsDownloaded: 0,
      farmsDownloaded: 0,
      usersDownloaded: 0,
      conflicts: [],
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Phase 1: Connecting
      this.notifyProgress({
        phase: 'connecting',
        message: 'Conectando con el servidor...',
      });

      const isConnected = await this.api.checkConnectivity();
      if (!isConnected) {
        result.errors.push('Sin conectividad a internet');
        this.notifyProgress({
          phase: 'error',
          message: 'Sin conexión a internet',
        });
        return result;
      }

      // Phase 2: Fetching
      this.notifyProgress({
        phase: 'fetching',
        message: 'Descargando datos del servidor...',
        progress: 10,
      });

      // Get last sync timestamp for incremental pull
      let lastSync: number | undefined;
      if (!options?.forceFullSync) {
        lastSync = await syncRepo.getLastSyncTimestamp() ?? undefined;
      }

      // Fetch all pages
      let allTags: PullResponse['tags'] = [];
      let allFarms: PullResponse['farms'] = [];
      let allUsers: PullResponse['users'] = [];
      let cursor: string | undefined;
      let hasMore = true;
      let page = 0;

      while (hasMore) {
        if (options?.signal?.aborted) {
          throw new Error('Pull cancelled');
        }

        const request: PullRequest = {
          lastSync,
          cursor,
          limit: 1000,
        };

        const response = await this.api.pull(request);

        allTags = [...allTags, ...response.tags];
        allFarms = [...allFarms, ...response.farms];
        allUsers = [...allUsers, ...response.users];

        hasMore = response.hasMore;
        cursor = response.nextCursor;
        page++;

        this.notifyProgress({
          phase: 'fetching',
          message: `Descargando página ${page}...`,
          progress: Math.min(50, 10 + page * 10),
        });
      }

      // Phase 3: Merging
      this.notifyProgress({
        phase: 'merging',
        message: ' Fusionando datos con la base local...',
        progress: 60,
      });

      // Upsert all downloaded records
      result.tagsDownloaded = await syncRepo.upsertTags(allTags);
      result.farmsDownloaded = await syncRepo.upsertFarms(allFarms);
      result.usersDownloaded = await syncRepo.upsertUsers(allUsers);

      // Update sync timestamp
      const serverTimestamp = Date.now(); // In real API, use response.serverTimestamp
      await syncRepo.setLastSyncTimestamp(serverTimestamp);

      // Phase 4: Complete
      result.success = true;
      result.timestamp = serverTimestamp;

      this.notifyProgress({
        phase: 'complete',
        message: `Descarga completa: ${result.tagsDownloaded} tags, ${result.farmsDownloaded} fincas, ${result.usersDownloaded} usuarios`,
        progress: 100,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      result.errors.push(message);

      this.notifyProgress({
        phase: 'error',
        message: `Error en descarga: ${message}`,
      });
    }

    return result;
  }

  /**
   * Subscribe to pull progress updates.
   */
  subscribe(listener: PullListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyProgress(progress: PullProgress): void {
    this.listeners.forEach((listener) => {
      try {
        listener(progress);
      } catch {
        // Ignore listener errors
      }
    });
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createPullUseCase(api: ISyncApi): PullUseCase {
  return new PullUseCase(api);
}
