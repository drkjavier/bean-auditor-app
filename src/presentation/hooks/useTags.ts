/**
 * useTags Hook - React hook for tags data from SQLite.
 *
 * Provides:
 * - Tags list with audit status
 * - Loading and error states
 * - Filter support (color, audit_status, date range)
 * - Refresh capability
 *
 * Usage:
 * ```tsx
 * const { tags, isLoading, error, refresh } = useTags();
 * const { tags } = useTags({ color: '#FF0000', audit_status: 'audited' });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTags, TagFilter, Tag } from '../../data/tagService';

export type UseTagsOptions = TagFilter & {
  /** Whether to auto-fetch on mount (default: true) */
  autoFetch?: boolean;
};

export type UseTagsReturn = {
  /** Tags list */
  tags: Tag[];

  /** Whether data is being loaded */
  isLoading: boolean;

  /** Error message (null if no error) */
  error: string | null;

  /** Refresh tags from database */
  refresh: () => Promise<void>;

  /** Current filter */
  filter: TagFilter | undefined;
};

export function useTags(options: UseTagsOptions = {}): UseTagsReturn {
  const { autoFetch = true, ...filter } = options;
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTagsData = useCallback(async () => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const filterObj: TagFilter | undefined =
        Object.keys(filter).length > 0 ? filter : undefined;
      const data = await fetchTags(filterObj, { signal: controller.signal });
      if (mountedRef.current) {
        setTags(data);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('[useTags] Failed to fetch tags:', err);
      if (mountedRef.current) {
        setError(err?.message || 'Failed to load tags');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [JSON.stringify(filter)]);

  // Auto-fetch on mount and when filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchTagsData();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [autoFetch, fetchTagsData]);

  return {
    tags,
    isLoading,
    error,
    refresh: fetchTagsData,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  };
}

export default useTags;
