import { execute, queryRows } from '../sqlite/db.native';
import runMigrations from '../sqlite/migrations.native';
import {
  AuditRepository,
  AuditRecord,
  AuditStatus,
  CreateAuditRecord,
  TagRecord,
  SyncStatus,
} from '../../domain/audit/AuditRepository';

async function ensureMigrations() {
  await runMigrations();
}

function toBoolean(value: unknown): boolean {
  return value === 1 || value === true || value === '1';
}

function normalizeAuditRecord(row: Record<string, unknown>): AuditRecord {
  return {
    uuid_tag: String(row.uuid_tag),
    status: String(row.status) as AuditStatus,
    timestamp: Number(row.timestamp),
    username: String(row.username),
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lon: row.lon === null || row.lon === undefined ? null : Number(row.lon),
    note: row.note === null || row.note === undefined ? null : String(row.note),
    sync_pending: toBoolean(row.sync_pending),
  };
}

function normalizeTagRecord(row: Record<string, unknown>): TagRecord {
  return {
    uuid: String(row.uuid),
    colorHex: String(row.colorHex),
    unique_id: String(row.unique_id),
    lat: Number(row.lat),
    lon: Number(row.lon),
    timestamp: String(row.timestamp),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    sync_pending: toBoolean(row.sync_pending),
    version: Number(row.version) || 1,
    updated_by: row.updated_by ? String(row.updated_by) : null,
    farm_id: row.farm_id ? String(row.farm_id) : null,
  };
}

export const AuditRepositoryImpl: AuditRepository = {
  // ── Tags ────────────────────────────────────────────────────────────────

  upsertTag: async (tag) => {
    await ensureMigrations();
    const now = Date.now();

    execute(
      `INSERT INTO tags (uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(uuid) DO UPDATE SET
         colorHex = excluded.colorHex,
         unique_id = excluded.unique_id,
         lat = excluded.lat,
         lon = excluded.lon,
         timestamp = excluded.timestamp,
         updated_at = excluded.updated_at;`,
      [tag.uuid, tag.colorHex, tag.unique_id, tag.lat, tag.lon, tag.timestamp, now, now],
    );
  },

  markTagAsModified: async (uuid: string) => {
    await ensureMigrations();
    const now = Date.now();

    execute(
      `UPDATE tags SET sync_pending = 1, updated_at = ? WHERE uuid = ?;`,
      [now, uuid],
    );
  },

  getPendingSyncTags: async () => {
    await ensureMigrations();

    const rows = queryRows(
      `SELECT uuid, colorHex, unique_id, lat, lon, timestamp, created_at, updated_at, sync_pending
       FROM tags
       WHERE sync_pending = 1
       ORDER BY updated_at ASC;`,
      [],
    );

    return rows.map(normalizeTagRecord);
  },

  markTagAsSynced: async (uuid: string) => {
    await ensureMigrations();

    execute(
      `UPDATE tags SET sync_pending = 0 WHERE uuid = ?;`,
      [uuid],
    );
  },

  // ── Auditorías ──────────────────────────────────────────────────────────

  saveAudit: async (record: CreateAuditRecord): Promise<AuditRecord> => {
    await ensureMigrations();

    const fullRecord: AuditRecord = {
      uuid_tag: record.uuid_tag,
      status: record.status,
      timestamp: record.timestamp ?? Date.now(),
      username: record.username,
      lat: record.lat ?? null,
      lon: record.lon ?? null,
      note: record.note ?? null,
      sync_pending: true, // Siempre sync_pending = 1 al crear
    };

    execute(
      `INSERT INTO audit_records
        (uuid_tag, status, timestamp, username, lat, lon, note, sync_pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        fullRecord.uuid_tag,
        fullRecord.status,
        fullRecord.timestamp,
        fullRecord.username,
        fullRecord.lat,
        fullRecord.lon,
        fullRecord.note,
        1, // Siempre sync_pending = 1
      ],
    );

    return fullRecord;
  },

  getAuditStatus: async (uuid_tag: string): Promise<AuditStatus | null> => {
    await ensureMigrations();

    const rows = queryRows(
      `SELECT status FROM audit_records
       WHERE uuid_tag = ?
       ORDER BY timestamp DESC, id DESC
       LIMIT 1;`,
      [uuid_tag],
    );

    if (rows.length === 0) return null;
    return String(rows[0].status) as AuditStatus;
  },

  getLatestAudit: async (uuid_tag: string): Promise<AuditRecord | null> => {
    await ensureMigrations();

    const rows = queryRows(
      `SELECT uuid_tag, status, timestamp, username, lat, lon, note, sync_pending
       FROM audit_records
       WHERE uuid_tag = ?
       ORDER BY timestamp DESC, id DESC
       LIMIT 1;`,
      [uuid_tag],
    );

    if (rows.length === 0) return null;
    return normalizeAuditRecord(rows[0]);
  },

  getTagsWithAuditStatus: async () => {
    await ensureMigrations();

    const rows = queryRows(
      `SELECT
         t.uuid,
         t.colorHex,
         t.unique_id,
         t.lat,
         t.lon,
         t.timestamp,
         a.status AS audit_status,
         COALESCE(a.sync_pending, 0) AS sync_pending
       FROM tags t
       LEFT JOIN (
         SELECT uuid_tag, status, sync_pending
         FROM audit_records ar1
         WHERE id = (
           SELECT id FROM audit_records ar2
           WHERE ar2.uuid_tag = ar1.uuid_tag
           ORDER BY timestamp DESC, id DESC
           LIMIT 1
         )
       ) a ON a.uuid_tag = t.uuid
       ORDER BY t.unique_id ASC;`,
      [],
    );

    return rows.map(row => ({
      uuid: String(row.uuid),
      colorHex: String(row.colorHex),
      unique_id: String(row.unique_id),
      lat: Number(row.lat),
      lon: Number(row.lon),
      timestamp: String(row.timestamp),
      audit_status: row.audit_status ? (String(row.audit_status) as AuditStatus) : null,
      sync_pending: toBoolean(row.sync_pending),
    }));
  },

  countByStatus: async () => {
    await ensureMigrations();

    const rows = queryRows(
      `WITH latest AS (
         SELECT uuid_tag, status
         FROM audit_records ar1
         WHERE id = (
           SELECT id FROM audit_records ar2
           WHERE ar2.uuid_tag = ar1.uuid_tag
           ORDER BY timestamp DESC, id DESC
           LIMIT 1
         )
       )
       SELECT
         (SELECT COUNT(*) FROM tags) AS total,
         (SELECT COUNT(*) FROM latest WHERE status = 'audited') AS audited,
         (SELECT COUNT(*) FROM latest WHERE status = 'not_audited') AS not_audited,
         (SELECT COUNT(*) FROM latest WHERE status = 'pending') AS pending;`,
      [],
    );

    if (rows.length === 0) {
      return { audited: 0, not_audited: 0, pending: 0, total: 0 };
    }

    const row = rows[0];
    return {
      audited: Number(row.audited || 0),
      not_audited: Number(row.not_audited || 0),
      pending: Number(row.pending || 0),
      total: Number(row.total || 0),
    };
  },

  getPendingSyncAudits: async () => {
    await ensureMigrations();

    const rows = queryRows(
      `SELECT uuid_tag, status, timestamp, username, lat, lon, note, sync_pending
       FROM audit_records
       WHERE sync_pending = 1
       ORDER BY timestamp ASC;`,
      [],
    );

    return rows.map(normalizeAuditRecord);
  },

  markAuditAsSynced: async (uuid_tag: string, synced_id?: string) => {
    await ensureMigrations();

    // Marcar TODOS los registros pendientes de este tag como sincronizados
    // Esto corrige el bug anterior donde solo se actualizaba un registro
    if (synced_id) {
      execute(
        `UPDATE audit_records SET sync_pending = 0 WHERE uuid_tag = ? AND sync_pending = 1;`,
        [uuid_tag],
      );
    } else {
      execute(
        `UPDATE audit_records SET sync_pending = 0 WHERE uuid_tag = ? AND sync_pending = 1;`,
        [uuid_tag],
      );
    }
  },

  // ── Sincronización global ───────────────────────────────────────────────

  getSyncStatus: async (): Promise<SyncStatus> => {
    await ensureMigrations();

    const rows = queryRows(
      `SELECT
         (SELECT COUNT(*) FROM tags WHERE sync_pending = 1) AS tags_pending,
         (SELECT COUNT(*) FROM audit_records WHERE sync_pending = 1) AS audits_pending;`,
      [],
    );

    if (rows.length === 0) {
      return { tags_pending: 0, audits_pending: 0, total_pending: 0 };
    }

    const row = rows[0];
    const tags_pending = Number(row.tags_pending || 0);
    const audits_pending = Number(row.audits_pending || 0);

    return {
      tags_pending,
      audits_pending,
      total_pending: tags_pending + audits_pending,
    };
  },
};

export default AuditRepositoryImpl;
