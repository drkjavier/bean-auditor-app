/**
 * Sync Domain - Barrel export
 *
 * All sync-related types, interfaces, and use cases.
 */

// Types
export type {
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  SyncConflict,
  SyncHealthResponse,
  SyncState,
} from './SyncContracts';

// Interfaces
export type { ISyncApi } from './ISyncApi';
export { ApiError } from './ISyncApi';

// Use Cases
export { PullUseCase, createPullUseCase } from './PullUseCase';
export type { PullResult, PullProgress, PullListener } from './PullUseCase';

export { PushUseCase, createPushUseCase } from './PushUseCase';
export type { PushResult, PushProgress, PushListener } from './PushUseCase';

// Conflict Resolution
export { ConflictResolver, conflictResolver } from './ConflictResolver';
export type { ConflictType, ConflictResolution, ManualConflict, SyncRecord } from './ConflictResolver';

// Orchestrator
export { SyncOrchestrator, createSyncOrchestrator } from './SyncOrchestrator';
export type { SyncMode, SyncResult, SyncProgress, SyncListener } from './SyncOrchestrator';
