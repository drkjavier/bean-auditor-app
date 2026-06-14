/**
 * Mock API for synchronization with backend.
 *
 * This mock simulates:
 * - Network latency (200-500ms)
 * - Random failures (10% chance)
 * - Server-side ID generation
 * - Conflict detection
 *
 * To replace with real implementation:
 * 1. Create a real SyncApi class implementing SyncApiInterface
 * 2. Replace the import in syncService.ts
 */

import { AuditRecord, TagRecord } from '../../domain/audit/AuditRecord';

export type SyncApiInterface = {
  /** Send tags to server. Returns server-assigned IDs. */
  syncTags: (tags: TagRecord[]) => Promise<{ uuid: string; server_id: string }[]>;

  /** Send audit records to server. Returns server-assigned IDs. */
  syncAudits: (audits: AuditRecord[]) => Promise<{ uuid_tag: string; server_id: string }[]>;

  /** Fetch latest tags from server (for pull sync). */
  fetchTagsFromServer: () => Promise<TagRecord[]>;

  /** Check if device has internet connectivity. */
  checkConnectivity: () => Promise<boolean>;
};

/** Simulate network latency */
function delay(min: number = 200, max: number = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Simulate random failure (5% chance, disabled in test) */
function maybeFail(): void {
  // Disable random failures in test environment for deterministic tests
  if (process.env.NODE_ENV === 'test') return;
  if (Math.random() < 0.05) {
    throw new Error('Network error: Connection timeout');
  }
}

/** Generate a fake server ID */
function generateServerId(): string {
  return `srv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Mock implementation of SyncApiInterface.
 * Simulates backend responses for development and testing.
 */
export const MockSyncApi: SyncApiInterface = {
  syncTags: async (tags: TagRecord[]) => {
    await delay();
    maybeFail();

    // Simulate server processing
    return tags.map(tag => ({
      uuid: tag.uuid,
      server_id: generateServerId(),
    }));
  },

  syncAudits: async (audits: AuditRecord[]) => {
    await delay();
    maybeFail();

    // Simulate server processing
    return audits.map(audit => ({
      uuid_tag: audit.uuid_tag,
      server_id: generateServerId(),
    }));
  },

  fetchTagsFromServer: async () => {
    await delay();
    maybeFail();

    // Return empty array (no new tags from server in mock)
    return [];
  },

  checkConnectivity: async () => {
    await delay(50, 100);
    // Simulate 90% connectivity
    return Math.random() < 0.9;
  },
};

export default MockSyncApi;
