// Temporary compatibility layer for transition from src/stores -> src/state
export { useAuthStore } from '../state/authStore';
export {
  useSyncStore,
  usePendingCount,
  useIsSyncing,
  useSyncProgress,
  useLastPullResult,
  useLastPushResult,
  useNextSyncIn,
  useIsConnected,
  useManualConflicts,
  useSyncErrors,
} from '../state/syncStore';
// NOTE: The concrete AuthRepository implementations live under src/data/auth/*
