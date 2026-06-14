/**
 * SyncApi Interface - Contract for server communication.
 *
 * This interface defines all operations for syncing data with the backend.
 * Implementations should handle:
 * - HTTP communication with proper auth headers
 * - Error handling and retries
 * - Timeout management
 * - Request/response transformation
 */

import { TagRecord, AuditRecord } from '../audit/AuditRecord';
import { Farm } from '../farm/Farm';
import { User } from '../user/User';
import {
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  SyncHealthResponse,
} from './SyncContracts';

export interface ISyncApi {
  // ── Pull Operations ────────────────────────────────────────────────────

  /**
   * Fetch data from server for offline operation.
   * Returns all records updated since lastSync timestamp.
   *
   * @param request - Pull parameters (lastSync, cursor, limit)
   * @returns PullResponse with tags, farms, users and pagination info
   * @throws ApiError if request fails
   */
  pull(request?: PullRequest): Promise<PullResponse>;

  // ── Push Operations ────────────────────────────────────────────────────

  /**
   * Send local changes to server.
   * Server validates and accepts/rejects each record.
   *
   * @param request - Local changes to upload
   * @returns PushResponse with accepted/rejected records
   * @throws ApiError if request fails
   */
  push(request: PushRequest): Promise<PushResponse>;

  // ── Health Check ───────────────────────────────────────────────────────

  /**
   * Check server health and connectivity.
   * Used before sync attempts to avoid unnecessary requests.
   *
   * @returns SyncHealthResponse with status and latency
   */
  healthCheck(): Promise<SyncHealthResponse>;

  // ── Connectivity ───────────────────────────────────────────────────────

  /**
   * Quick connectivity check (no auth required).
   * Returns true if device can reach the internet.
   *
   * @returns true if connected, false otherwise
   */
  checkConnectivity(): Promise<boolean>;
}

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
