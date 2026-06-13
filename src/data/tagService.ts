import { tagsMock, Tag } from './mocks/tagsMock';

export type { Tag };

export type TagFilter = {
  color?: string;   // hex del color, ej: '#FF0000'
  audited?: boolean;
  from?: string;    // ISO date — se asume 00:00:00 del día
  to?: string;      // ISO date — se asume 23:59:59 del día
};

// Simple in-memory service that returns a Promise to emulate async API
export type FetchTagsOptions = { signal?: AbortSignal };

export async function fetchTags(filter?: TagFilter, options?: FetchTagsOptions): Promise<Tag[]> {
  // Simulate latency with cancellable timeout
  const delay = 120;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const p = new Promise<void>((resolve, reject) => {
    timeoutId = setTimeout(resolve, delay);
    if (options?.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId as any);
        return reject(new DOMException('Aborted', 'AbortError'));
      }
      const onAbort = () => {
        if (timeoutId) clearTimeout(timeoutId as any);
        try {
          reject(new DOMException('Aborted', 'AbortError'));
        } catch {
          // node env may not have DOMException
          reject(new Error('Aborted'));
        }
      };
      // Some environments do not support addEventListener on signal
      try {
        if (typeof (options.signal as any).addEventListener === 'function') {
          (options.signal as any).addEventListener('abort', onAbort);
        } else if (typeof (options.signal as any).onabort === 'function' || typeof (options.signal as any).onabort === 'undefined') {
          // attach to onabort if available
          (options.signal as any).onabort = onAbort;
        }
      } catch {
        // ignore
      }
    }
  });
  await p;

  let items = tagsMock.slice();

  if (filter) {
    const { color, audited, from, to } = filter;

    if (color) {
      const colorNorm = color.trim().toLowerCase();
      // tagsMock uses `colorHex` for the color field. Guard against undefined
      // and normalize both sides before comparing to avoid runtime errors.
      items = items.filter(t => (t.colorHex ?? '').trim().toLowerCase() === colorNorm);
    }
    if (typeof audited === 'boolean') {
      items = items.filter(t => t.audited === audited);
    }
    if (from) {
      const f = new Date(from);
      if (!isNaN(f.getTime())) items = items.filter(t => new Date(t.timestamp) >= f);
    }
    if (to) {
      const tt = new Date(to);
      if (!isNaN(tt.getTime())) items = items.filter(t => new Date(t.timestamp) <= tt);
    }
  }

  return items;
}
