/**
 * Sync Module - Export all synchronization-related code.
 *
 * Usage:
 * ```tsx
 * import { syncService, useSync, MockSyncApi } from '../infrastructure/sync';
 * ```
 */

// API Implementation (mock for now)
export { MockSyncApi } from './mockSyncApi';
export type { SyncApiInterface } from './mockSyncApi';

// Sync Service
export { syncService } from './syncService';
export type { SyncResult, SyncListener } from './syncService';
