import { Platform } from 'react-native';
import { tagsMock, Tag } from './mocks/tagsMock';
import { AuditStatus, TagRecord, SyncStatus } from '../domain/audit/AuditRecord';

export type { Tag };

export type TagFilter = {
  color?: string;   // hex del color, ej: '#FF0000'
  audit_status?: AuditStatus;
  from?: string;    // ISO date — se asume 00:00:00 del día
  to?: string;      // ISO date — se asume 23:59:59 del día
};

export type FetchTagsOptions = { signal?: AbortSignal };

function simulateLatency(signal?: AbortSignal): Promise<void> {
  const delay = 120;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return new Promise<void>((resolve, reject) => {
    timeoutId = setTimeout(resolve, delay);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId as any);
        return reject(new DOMException('Aborted', 'AbortError'));
      }
      const onAbort = () => {
        if (timeoutId) clearTimeout(timeoutId as any);
        try {
          reject(new DOMException('Aborted', 'AbortError'));
        } catch {
          reject(new Error('Aborted'));
        }
      };
      try {
        if (typeof (signal as any).addEventListener === 'function') {
          (signal as any).addEventListener('abort', onAbort);
        } else if (typeof (signal as any).onabort === 'function' || typeof (signal as any).onabort === 'undefined') {
          (signal as any).onabort = onAbort;
        }
      } catch {
        // ignore
      }
    }
  });
}

function isWebOrTest(): boolean {
  return Platform.OS === 'web' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');
}

async function loadTagsFromNative(): Promise<Tag[]> {
  // Dynamic require keeps the .native module out of web bundles.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const seedTags = require('./tagSeed.native').default as typeof import('./tagSeed.native').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;

  await seedTags();
  return auditRepo.getTagsWithAuditStatus();
}

async function loadTagsFromWeb(): Promise<Tag[]> {
  return tagsMock.slice();
}

export async function fetchTags(filter?: TagFilter, options?: FetchTagsOptions): Promise<Tag[]> {
  await simulateLatency(options?.signal);

  const items = isWebOrTest() ? await loadTagsFromWeb() : await loadTagsFromNative();

  if (!filter) return items;

  const { color, audit_status, from, to } = filter;
  let result = items;

  if (color) {
    const colorNorm = color.trim().toLowerCase();
    result = result.filter(t => (t.colorHex ?? '').trim().toLowerCase() === colorNorm);
  }
  if (audit_status) {
    result = result.filter(t => t.audit_status === audit_status);
  }
  if (from) {
    const f = new Date(from);
    if (!isNaN(f.getTime())) result = result.filter(t => new Date(t.timestamp) >= f);
  }
  if (to) {
    const tt = new Date(to);
    if (!isNaN(tt.getTime())) result = result.filter(t => new Date(t.timestamp) <= tt);
  }

  return result;
}

/**
 * Persist an audit record for a tag.
 * On web this updates in-memory mocks; on native it writes to SQLite.
 */
export async function saveTagAudit(
  uuid_tag: string,
  status: AuditStatus,
  options: { username?: string; lat?: number | null; lon?: number | null; note?: string | null } = {},
): Promise<void> {
  if (isWebOrTest()) {
    // Web uses in-memory mocks; update the matching tag for immediate feedback.
    const tag = tagsMock.find(t => t.uuid === uuid_tag);
    if (tag) {
      tag.audit_status = status;
      tag.sync_pending = true;
    }
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuthStore } = require('../stores') as typeof import('../stores');

  const username = options.username ?? useAuthStore.getState().username ?? 'unknown';

  await auditRepo.saveAudit({
    uuid_tag,
    status,
    username,
    lat: options.lat ?? null,
    lon: options.lon ?? null,
    note: options.note ?? null,
  });
}

/**
 * Return audit counts from the data source.
 * On web returns counts from the in-memory mock.
 */
export async function getAuditCounts(): Promise<{
  audited: number;
  not_audited: number;
  pending: number;
  total: number;
}> {
  if (isWebOrTest()) {
    const total = tagsMock.length;
    const audited = tagsMock.filter(t => t.audit_status === 'audited').length;
    const not_audited = tagsMock.filter(t => t.audit_status === 'not_audited').length;
    const pending = tagsMock.filter(t => t.audit_status === 'pending').length;
    return { audited, not_audited, pending, total };
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  return auditRepo.countByStatus();
}

// ── Synchronization functions ────────────────────────────────────────────────

/**
 * Mark a tag as modified locally (sets sync_pending = 1).
 * Use when the user edits tag data on the device.
 */
export async function markTagAsModified(uuid: string): Promise<void> {
  if (isWebOrTest()) {
    const tag = tagsMock.find(t => t.uuid === uuid);
    if (tag) tag.sync_pending = true;
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  await auditRepo.markTagAsModified(uuid);
}

/**
 * Get all tags pending sync with the server.
 */
export async function getPendingSyncTags(): Promise<TagRecord[]> {
  if (isWebOrTest()) {
    return tagsMock.filter(t => t.sync_pending).map(t => ({
      ...t,
      created_at: Date.now(),
      updated_at: Date.now(),
      version: 1,
      updated_by: null,
      farm_id: null,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  return auditRepo.getPendingSyncTags();
}

/**
 * Mark a tag as synced with the server.
 */
export async function markTagAsSynced(uuid: string): Promise<void> {
  if (isWebOrTest()) {
    const tag = tagsMock.find(t => t.uuid === uuid);
    if (tag) tag.sync_pending = false;
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  await auditRepo.markTagAsSynced(uuid);
}

/**
 * Get all audit records pending sync with the server.
 */
export async function getPendingSyncAudits(): Promise<import('../domain/audit/AuditRecord').AuditRecord[]> {
  if (isWebOrTest()) {
    // In web/test, no real audit records exist
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  return auditRepo.getPendingSyncAudits();
}

/**
 * Mark audit records for a tag as synced.
 */
export async function markAuditAsSynced(uuid_tag: string, synced_id?: string): Promise<void> {
  if (isWebOrTest()) {
    // In web/test, no real audit records exist
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  await auditRepo.markAuditAsSynced(uuid_tag, synced_id);
}

/**
 * Get the current sync status: counts of pending records.
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  if (isWebOrTest()) {
    const tags_pending = tagsMock.filter(t => t.sync_pending).length;
    return { tags_pending, audits_pending: 0, total_pending: tags_pending };
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auditRepo = require('./audit/AuditRepository.native').default as typeof import('./audit/AuditRepository.native').default;
  return auditRepo.getSyncStatus();
}
