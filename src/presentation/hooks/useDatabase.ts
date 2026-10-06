/**
 * useDatabase Hook - React hook for database initialization and status.
 *
 * Provides:
 * - Database initialization status
 * - Manual migration trigger
 * - Database health check
 *
 * Usage:
 * ```tsx
 * const { isReady, error, initialize } = useDatabase();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import runMigrations from '../../data/sqlite/migrations.native';

export type UseDatabaseReturn = {
  /** Whether database is ready (migrations completed) */
  isReady: boolean;

  /** Whether initialization is in progress */
  isInitializing: boolean;

  /** Error message if initialization failed */
  error: string | null;

  /** Manually trigger database initialization */
  initialize: () => Promise<void>;
};

export function useDatabase(): UseDatabaseReturn {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (isInitializing || isReady) return;

    setIsInitializing(true);
    setError(null);

    try {
      await runMigrations();
      setIsReady(true);
    } catch (err: any) {
      console.error('[useDatabase] Initialization failed:', err);
      setError(err?.message || 'Database initialization failed');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isReady]);

  // Auto-initialize on mount (native and web: the sql.js shim executes the
  // same migrations against the WASM database)
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isReady,
    isInitializing,
    error,
    initialize,
  };
}

export default useDatabase;
