/**
 * Push Use Case - Send local changes to server
 *
 * This use case orchestrates the push process:
 * 1. Check connectivity
 * 2. Collect all pending records (tags, audits, farms, users)
 * 3. Send to server in batches
 * 4. Handle accepted/rejected responses
 * 5. Update local sync status
 *
 * Implements retry with exponential backoff for failed batches.
 */

import { ISyncApi } from './ISyncApi';
import { PushRequest, PushResponse, SyncConflict } from './SyncContracts';
import { TagRecord, AuditRecord } from '../audit/AuditRecord';
import * as syncRepo from '../../data/sync';

// ── Types ──────────────────────────────────────────────────────────────────

export type PushResult = {
  success: boolean;
  tagsAccepted: number;
  tagsRejected: number;
  auditsAccepted: number;
  auditsRejected: number;
  farmsAccepted: number;
  farmsRejected: number;
  usersAccepted: number;
  usersRejected: number;
  conflicts: SyncConflict[];
  errors: string[];
  timestamp: number;
};

export type PushProgress = {
  phase: 'collecting' | 'sending' | 'processing' | 'complete' | 'error';
  message: string;
  progress?: number; // 0-100
  batchSize?: number;
  currentBatch?: number;
  totalBatches?: number;
};

export type PushListener = (progress: PushProgress) => void;

// ── Configuration ──────────────────────────────────────────────────────────

const PUSH_CONFIG = {
  batchSize: 50,
  maxRetries: 3,
  retryBaseDelay: 1000,
};

// ── Push Use Case ──────────────────────────────────────────────────────────

export class PushUseCase {
  private api: ISyncApi;
  private listeners: Set<PushListener> = new Set();

  constructor(api: ISyncApi) {
    this.api = api;
  }

  /**
   * Execute push operation.
   *
   * @param options - Push options
   * @returns PushResult with acceptance/rejection counts
   */
  async execute(options?: {
    signal?: AbortSignal;
  }): Promise<PushResult> {
    const result: PushResult = {
      success: false,
      tagsAccepted: 0,
      tagsRejected: 0,
      auditsAccepted: 0,
      auditsRejected: 0,
      farmsAccepted: 0,
      farmsRejected: 0,
      usersAccepted: 0,
      usersRejected: 0,
      conflicts: [],
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Phase 1: Collecting
      this.notifyProgress({
        phase: 'collecting',
        message: 'Recopilando cambios pendientes...',
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

      // Collect all pending records
      const pendingTags = await syncRepo.getPendingSyncTags();
      const pendingAudits = await syncRepo.getPendingSyncAudits();
      const pendingFarms = await syncRepo.getPendingSyncFarms();
      const pendingUsers = await syncRepo.getPendingSyncUsers();

      const totalRecords = pendingTags.length + pendingAudits.length +
                           pendingFarms.length + pendingUsers.length;

      if (totalRecords === 0) {
        result.success = true;
        this.notifyProgress({
          phase: 'complete',
          message: 'No hay cambios pendientes para sincronizar',
          progress: 100,
        });
        return result;
      }

      // Phase 2: Sending
      this.notifyProgress({
        phase: 'sending',
        message: `Enviando ${totalRecords} registros al servidor...`,
        progress: 10,
      });

      // Process in batches
      const allTags = [...pendingTags];
      const allAudits = [...pendingAudits];
      const allFarms = [...pendingFarms];
      const allUsers = [...pendingUsers];

      // Batch tags
      const tagBatches = this.chunkArray(allTags, PUSH_CONFIG.batchSize);
      const auditBatches = this.chunkArray(allAudits, PUSH_CONFIG.batchSize);
      const farmBatches = this.chunkArray(allFarms, PUSH_CONFIG.batchSize);
      const userBatches = this.chunkArray(allUsers, PUSH_CONFIG.batchSize);

      const totalBatches = tagBatches.length + auditBatches.length +
                           farmBatches.length + userBatches.length;
      let currentBatch = 0;

      // Process tag batches
      for (const batch of tagBatches) {
        if (options?.signal?.aborted) {
          throw new Error('Push cancelled');
        }

        currentBatch++;
        this.notifyProgress({
          phase: 'sending',
          message: `Enviando tags (lote ${currentBatch}/${totalBatches})...`,
          progress: 10 + Math.floor((currentBatch / totalBatches) * 60),
          currentBatch,
          totalBatches,
        });

        const response = await this.sendBatchWithRetry(
          () => this.api.push({
            tags: batch,
            audits: [],
            clientTimestamp: Date.now(),
          }),
          options?.signal
        );

        // Process response
        if (response) {
          result.tagsAccepted += response.accepted.tags.length;
          result.tagsRejected += response.rejected.filter(r => r.type === 'tag').length;
          result.conflicts.push(...response.rejected);

          // Mark accepted tags as synced
          for (const uuid of response.accepted.tags) {
            await syncRepo.markTagAsSynced(uuid);
          }
        }
      }

      // Process audit batches
      for (const batch of auditBatches) {
        if (options?.signal?.aborted) {
          throw new Error('Push cancelled');
        }

        currentBatch++;
        this.notifyProgress({
          phase: 'sending',
          message: `Enviando auditorías (lote ${currentBatch}/${totalBatches})...`,
          progress: 10 + Math.floor((currentBatch / totalBatches) * 60),
          currentBatch,
          totalBatches,
        });

        const response = await this.sendBatchWithRetry(
          () => this.api.push({
            tags: [],
            audits: batch,
            clientTimestamp: Date.now(),
          }),
          options?.signal
        );

        if (response) {
          result.auditsAccepted += response.accepted.audits.length;
          result.auditsRejected += response.rejected.filter(r => r.type === 'audit').length;
          result.conflicts.push(...response.rejected);

          for (const uuid of response.accepted.audits) {
            await syncRepo.markAuditAsSynced(uuid);
          }
        }
      }

      // Process farm batches
      for (const batch of farmBatches) {
        if (options?.signal?.aborted) {
          throw new Error('Push cancelled');
        }

        currentBatch++;
        this.notifyProgress({
          phase: 'sending',
          message: `Enviando fincas (lote ${currentBatch}/${totalBatches})...`,
          progress: 10 + Math.floor((currentBatch / totalBatches) * 60),
          currentBatch,
          totalBatches,
        });

        const response = await this.sendBatchWithRetry(
          () => this.api.push({
            tags: [],
            audits: [],
            clientTimestamp: Date.now(),
          }),
          options?.signal
        );

        if (response) {
          result.farmsAccepted += response.accepted.farms.length;
          result.farmsRejected += response.rejected.filter(r => r.type === 'farm').length;
          result.conflicts.push(...response.rejected);

          for (const uuid of response.accepted.farms) {
            await syncRepo.markFarmAsSynced(uuid);
          }
        }
      }

      // Process user batches
      for (const batch of userBatches) {
        if (options?.signal?.aborted) {
          throw new Error('Push cancelled');
        }

        currentBatch++;
        this.notifyProgress({
          phase: 'sending',
          message: `Enviando usuarios (lote ${currentBatch}/${totalBatches})...`,
          progress: 10 + Math.floor((currentBatch / totalBatches) * 60),
          currentBatch,
          totalBatches,
        });

        const response = await this.sendBatchWithRetry(
          () => this.api.push({
            tags: [],
            audits: [],
            clientTimestamp: Date.now(),
          }),
          options?.signal
        );

        if (response) {
          result.usersAccepted += response.accepted.users.length;
          result.usersRejected += response.rejected.filter(r => r.type === 'user').length;
          result.conflicts.push(...response.rejected);

          for (const uuid of response.accepted.users) {
            await syncRepo.markUserAsSynced(uuid);
          }
        }
      }

      // Phase 3: Complete
      result.success = result.errors.length === 0;
      result.timestamp = Date.now();

      this.notifyProgress({
        phase: 'complete',
        message: `Sincronización completa: ${result.tagsAccepted + result.auditsAccepted + result.farmsAccepted + result.usersAccepted} aceptados`,
        progress: 100,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      result.errors.push(message);

      this.notifyProgress({
        phase: 'error',
        message: `Error en sincronización: ${message}`,
      });
    }

    return result;
  }

  /**
   * Subscribe to push progress updates.
   */
  subscribe(listener: PushListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private async sendBatchWithRetry(
    fn: () => Promise<PushResponse>,
    signal?: AbortSignal
  ): Promise<PushResponse | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= PUSH_CONFIG.maxRetries; attempt++) {
      if (signal?.aborted) {
        throw new Error('Push cancelled');
      }

      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < PUSH_CONFIG.maxRetries) {
          // Exponential backoff
          const delay = PUSH_CONFIG.retryBaseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    if (lastError) {
      console.error('[PushUseCase] Batch failed after retries:', lastError);
    }
    return null;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private notifyProgress(progress: PushProgress): void {
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

export function createPushUseCase(api: ISyncApi): PushUseCase {
  return new PushUseCase(api);
}
