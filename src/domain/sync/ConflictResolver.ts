/**
 * Conflict Resolver - Handle sync conflicts between local and server data
 *
 * Strategy: Last-write-wins (timestamp-based)
 *
 * When a conflict occurs:
 * 1. Compare timestamps of local and server versions
 * 2. The record with the more recent timestamp wins
 * 3. If timestamps are equal, server version wins (server is source of truth)
 *
 * This resolver also provides manual resolution for critical conflicts.
 */

import { TagRecord } from '../audit/AuditRecord';
import { Farm } from '../farm/Farm';
import { User } from '../user/User';
import { SyncConflict } from './SyncContracts';

// ── Types ──────────────────────────────────────────────────────────────────

export type ConflictType = 'tag' | 'audit' | 'farm' | 'user';

/** Record types that have updated_at for conflict resolution */
export type SyncRecord = TagRecord | Farm | User;

export type ConflictResolution = {
  /** The winning record (local or server) */
  winner: 'local' | 'server';

  /** The resolved record to keep */
  record: SyncRecord;

  /** Reason for the resolution */
  reason: 'timestamp_local_newer' | 'timestamp_server_newer' | 'server_wins_tie' | 'manual';
};

export type ManualConflict = {
  /** Unique conflict ID */
  id: string;

  /** Record type */
  type: ConflictType;

  /** Record UUID */
  recordId: string;

  /** Local version of the record */
  localVersion: SyncRecord;

  /** Server version of the record */
  serverVersion: SyncRecord;

  /** Conflict description */
  description: string;
};

// ── Conflict Resolver ──────────────────────────────────────────────────────

export class ConflictResolver {
  private manualConflicts: ManualConflict[] = [];

  /**
   * Resolve a conflict between local and server versions of a record.
   *
   * @param local - Local version of the record
   * @param server - Server version of the record
   * @param type - Record type
   * @returns ConflictResolution with winner and resolved record
   */
  resolve(
    local: SyncRecord,
    server: SyncRecord,
    type: ConflictType
  ): ConflictResolution {
    // Compare timestamps
    const localTimestamp = this.getTimestamp(local);
    const serverTimestamp = this.getTimestamp(server);

    if (localTimestamp > serverTimestamp) {
      return {
        winner: 'local',
        record: local,
        reason: 'timestamp_local_newer',
      };
    }

    if (serverTimestamp > localTimestamp) {
      return {
        winner: 'server',
        record: server,
        reason: 'timestamp_server_newer',
      };
    }

    // Timestamps are equal - server wins as source of truth
    return {
      winner: 'server',
      record: server,
      reason: 'server_wins_tie',
    };
  }

  /**
   * Resolve conflicts for a batch of records.
   *
   * @param localRecords - Map of local records (keyed by UUID)
   * @param serverRecords - Array of server records
   * @param type - Record type
   * @returns Array of resolved records and any conflicts requiring manual resolution
   */
  resolveBatch<T extends SyncRecord>(
    localRecords: Map<string, T>,
    serverRecords: T[],
    type: ConflictType
  ): {
    resolved: T[];
    manualConflicts: ManualConflict[];
  } {
    const resolved: T[] = [];
    const manualConflicts: ManualConflict[] = [];

    for (const serverRecord of serverRecords) {
      const recordId = this.getRecordId(serverRecord);
      const localRecord = localRecords.get(recordId);

      if (!localRecord) {
        // No local version - use server version
        resolved.push(serverRecord);
        continue;
      }

      // Check for conflicts
      const hasConflict = this.hasConflict(localRecord, serverRecord);

      if (hasConflict) {
        // For auto-resolution, use last-write-wins
        const resolution = this.resolve(localRecord, serverRecord, type);

        if (resolution.reason === 'manual') {
          // Requires manual resolution
          manualConflicts.push({
            id: `${type}_${recordId}_${Date.now()}`,
            type,
            recordId,
            localVersion: localRecord,
            serverVersion: serverRecord,
            description: this.getConflictDescription(localRecord, serverRecord, type),
          });
        } else {
          resolved.push(resolution.record as T);
        }
      } else {
        // No conflict - use server version (it's the source of truth)
        resolved.push(serverRecord);
      }
    }

    return { resolved, manualConflicts };
  }

  /**
   * Add a conflict that requires manual resolution.
   */
  addManualConflict(conflict: ManualConflict): void {
    this.manualConflicts.push(conflict);
  }

  /**
   * Resolve a manual conflict by choosing local or server version.
   */
  resolveManualConflict(
    conflictId: string,
    choice: 'local' | 'server'
  ): SyncRecord | null {
    const conflict = this.manualConflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    // Remove from pending conflicts
    this.manualConflicts = this.manualConflicts.filter(c => c.id !== conflictId);

    // Return chosen version
    return choice === 'local' ? conflict.localVersion : conflict.serverVersion;
  }

  /**
   * Get all pending manual conflicts.
   */
  getManualConflicts(): ManualConflict[] {
    return [...this.manualConflicts];
  }

  /**
   * Clear all pending manual conflicts.
   */
  clearManualConflicts(): void {
    this.manualConflicts = [];
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private getTimestamp(record: SyncRecord): number {
    return record.updated_at;
  }

  private hasConflict(local: SyncRecord, server: SyncRecord): boolean {
    // Simple heuristic: if both have been modified, there's a potential conflict
    // In a real app, you might compare specific fields
    return this.getTimestamp(local) !== this.getTimestamp(server);
  }

  private getRecordId(record: SyncRecord): string {
    if ('uuid' in record) return record.uuid;
    if ('id' in record) return record.id;
    return '';
  }

  private getConflictDescription(
    local: SyncRecord,
    server: SyncRecord,
    type: ConflictType
  ): string {
    const localTime = new Date(this.getTimestamp(local)).toLocaleString();
    const serverTime = new Date(this.getTimestamp(server)).toLocaleString();

    const localId = ('unique_id' in local) ? local.unique_id : ('id' in local) ? local.id : 'unknown';

    return `Conflicto en ${type} "${localId}": ` +
           `versión local (${localTime}) vs versión servidor (${serverTime})`;
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────

export const conflictResolver = new ConflictResolver();
export default conflictResolver;
