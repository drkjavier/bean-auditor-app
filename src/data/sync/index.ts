/**
 * Sync Repository - Barrel export
 *
 * Platform-specific implementations resolved at build time:
 * - Native: SQLite via react-native-quick-sqlite
 * - Web: localStorage
 */

export {
  getLastSyncTimestamp,
  setLastSyncTimestamp,
  upsertTags,
  upsertFarms,
  upsertUsers,
  getPendingSyncTags,
  getPendingSyncAudits,
  getPendingSyncFarms,
  getPendingSyncUsers,
  markTagAsSynced,
  markAuditAsSynced,
  markFarmAsSynced,
  markUserAsSynced,
  markTagAsModified,
  markAuditAsModified,
  getSyncStatus,
  getAllTags,
  getAllFarms,
  getAllUsers,
} from './SyncRepository.native';
