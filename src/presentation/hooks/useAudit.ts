/**
 * useAudit Hook - React hook for audit operations.
 *
 * Provides:
 * - Save audit record
 * - Get audit status for a tag
 * - Get latest audit for a tag
 * - Audit counts by status
 * - Loading and error states
 *
 * Usage:
 * ```tsx
 * const { saveAudit, getAuditCounts } = useAudit();
 * const { saveAudit, isSaving } = useAudit();
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { AuditStatus } from '../../domain/audit/AuditRecord';
import { saveTagAudit, getAuditCounts } from '../../data/tagService';
import { useAuthStore } from '../../stores';

export type AuditCounts = {
  audited: number;
  not_audited: number;
  pending: number;
  total: number;
};

export type UseAuditReturn = {
  /** Save an audit record for a tag */
  saveAudit: (
    uuid_tag: string,
    status: AuditStatus,
    options?: {
      lat?: number | null;
      lon?: number | null;
      note?: string | null;
    }
  ) => Promise<void>;

  /** Get audit counts by status */
  getAuditCounts: () => Promise<AuditCounts>;

  /** Whether an audit save is in progress */
  isSaving: boolean;

  /** Last error message (null if no error) */
  error: string | null;

  /** Clear error */
  clearError: () => void;
};

export function useAudit(): UseAuditReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const saveAudit = useCallback(
    async (
      uuid_tag: string,
      status: AuditStatus,
      options: {
        lat?: number | null;
        lon?: number | null;
        note?: string | null;
      } = {}
    ) => {
      setIsSaving(true);
      setError(null);

      try {
        const username = useAuthStore.getState().username;
        await saveTagAudit(uuid_tag, status, {
          username,
          lat: options.lat ?? null,
          lon: options.lon ?? null,
          note: options.note ?? null,
        });
      } catch (err: any) {
        console.error('[useAudit] Failed to save audit:', err);
        if (mountedRef.current) {
          setError(err?.message || 'Failed to save audit');
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    []
  );

  const fetchAuditCounts = useCallback(async (): Promise<AuditCounts> => {
    try {
      return await getAuditCounts();
    } catch (err: any) {
      console.error('[useAudit] Failed to get audit counts:', err);
      if (mountedRef.current) {
        setError(err?.message || 'Failed to get audit counts');
      }
      return { audited: 0, not_audited: 0, pending: 0, total: 0 };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    saveAudit,
    getAuditCounts: fetchAuditCounts,
    isSaving,
    error,
    clearError,
  };
}

export default useAudit;
