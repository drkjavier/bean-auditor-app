/**
 * Sync Contracts - Defines the API contracts for pull and push synchronization.
 *
 * These types define the request/response structures for:
 * - Pull: Download data from server to local device
 * - Push: Upload local changes to server
 * - Health: Check server connectivity
 */

import { TagRecord, AuditRecord } from '../audit/AuditRecord';
import { Farm } from '../farm/Farm';
import { User } from '../user/User';

// ── Pull Contracts ─────────────────────────────────────────────────────────

/**
 * Response from GET /api/sync/pull
 * Contains all data needed for offline operation.
 */
export type PullResponse = {
  /** All tags from the server */
  tags: TagRecord[];

  /** All farms from the server */
  farms: Farm[];

  /** All users from the server */
  users: User[];

  /** Server timestamp for next pull (epoch ms) */
  serverTimestamp: number;

  /** Whether there are more records to fetch (pagination) */
  hasMore: boolean;

  /** Cursor for next page (if hasMore is true) */
  nextCursor?: string;
};

/**
 * Request for GET /api/sync/pull
 */
export type PullRequest = {
  /** Last sync timestamp (epoch ms). Server returns records updated after this. */
  lastSync?: number;

  /** Optional cursor for pagination */
  cursor?: string;

  /** Max records per page (default: 1000) */
  limit?: number;
};

// ── Push Contracts ─────────────────────────────────────────────────────────

/**
 * Request for POST /api/sync/push
 * Contains all local changes to upload to server.
 */
export type PushRequest = {
  /** Tags modified locally since last sync */
  tags: TagRecord[];

  /** Audit records created locally since last sync */
  audits: AuditRecord[];

  /** Client timestamp (epoch ms) */
  clientTimestamp: number;

  /** Client device identifier (for logging) */
  deviceId?: string;
};

/**
 * Response from POST /api/sync/push
 * Server processes records and returns acceptance/rejection.
 */
export type PushResponse = {
  /** Records accepted by server (synced successfully) */
  accepted: {
    tags: string[];      // UUIDs of accepted tags
    audits: string[];    // UUIDs of accepted audits
    farms: string[];     // UUIDs of accepted farms
    users: string[];     // UUIDs of accepted users
  };

  /** Records rejected due to conflicts */
  rejected: SyncConflict[];

  /** Server timestamp after processing (epoch ms) */
  serverTimestamp: number;

  /** Summary of what was processed */
  summary: {
    tagsAccepted: number;
    tagsRejected: number;
    auditsAccepted: number;
    auditsRejected: number;
  };
};

/**
 * Represents a conflict between local and server data.
 */
export type SyncConflict = {
  /** Record type */
  type: 'tag' | 'audit' | 'farm' | 'user';

  /** Record UUID */
  recordId: string;

  /** Why the record was rejected */
  reason: 'version_conflict' | 'timestamp_conflict' | 'validation_error' | 'not_found';

  /** Human-readable error message */
  message: string;

  /** Server version of the record (if available) */
  serverVersion?: TagRecord | AuditRecord | Farm | User;
};

// ── Health Check Contracts ─────────────────────────────────────────────────

/**
 * Response from GET /api/sync/health
 */
export type SyncHealthResponse = {
  /** Server status */
  status: 'ok' | 'degraded' | 'down';

  /** Server latency in milliseconds */
  latency: number;

  /** Server timestamp */
  timestamp: number;

  /** Pending sync items on server (if known) */
  pendingItems?: number;
};

// ── Sync Status ────────────────────────────────────────────────────────────

/**
 * Overall sync status for the application.
 */
export type SyncState = {
  /** Whether sync is currently in progress */
  isSyncing: boolean;

  /** Whether pull has been completed at least once */
  hasInitialized: boolean;

  /** Number of pending records to push */
  pendingPush: number;

  /** Number of records downloaded in last pull */
  lastPullCount: number;

  /** Last successful sync timestamp (epoch ms) */
  lastSyncTimestamp: number;

  /** Current sync errors (if any) */
  errors: string[];

  /** Whether auto-sync is enabled */
  autoSyncEnabled: boolean;

  /** Auto-sync interval in milliseconds */
  autoSyncInterval: number;
};
