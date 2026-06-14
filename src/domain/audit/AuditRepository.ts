import { AuditRecord, AuditStatus, CreateAuditRecord, TagRecord, SyncStatus } from './AuditRecord';

export interface AuditRepository {
  // ── Tags ────────────────────────────────────────────────────────────────
  /** Inserta o reemplaza un tag. */
  upsertTag: (tag: Omit<TagRecord, 'created_at' | 'updated_at' | 'sync_pending'>) => Promise<void>;

  /** Marca un tag como modificado localmente (sync_pending = 1). */
  markTagAsModified: (uuid: string) => Promise<void>;

  /** Devuelve todos los tags pendientes de sincronizar con el servidor. */
  getPendingSyncTags: () => Promise<TagRecord[]>;

  /** Marca un tag como sincronizado con el servidor. */
  markTagAsSynced: (uuid: string) => Promise<void>;

  // ── Auditorías ──────────────────────────────────────────────────────────
  /** Guarda un registro de auditoría (siempre sync_pending = 1). */
  saveAudit: (record: CreateAuditRecord) => Promise<AuditRecord>;

  /** Devuelve el estado actual de auditoría de un tag, o null si nunca se auditó. */
  getAuditStatus: (uuid_tag: string) => Promise<AuditStatus | null>;

  /** Devuelve el registro completo más reciente de un tag. */
  getLatestAudit: (uuid_tag: string) => Promise<AuditRecord | null>;

  /** Lista todos los tags con su último estado de auditoría. */
  getTagsWithAuditStatus: () => Promise<{
    uuid: string;
    colorHex: string;
    unique_id: string;
    lat: number;
    lon: number;
    timestamp: string;
    audit_status: AuditStatus | null;
    sync_pending: boolean;
  }[]>;

  /** Cuenta tags por estado de auditoría. */
  countByStatus: () => Promise<{
    audited: number;
    not_audited: number;
    pending: number;
    total: number;
  }>;

  /** Devuelve todos los registros de auditoría pendientes de sincronizar. */
  getPendingSyncAudits: () => Promise<AuditRecord[]>;

  /** Marca un registro de auditoría como sincronizado (o todos los de un tag). */
  markAuditAsSynced: (uuid_tag: string, synced_id?: string) => Promise<void>;

  // ── Sincronización global ───────────────────────────────────────────────
  /** Devuelve el conteo total de registros pendientes de sync. */
  getSyncStatus: () => Promise<SyncStatus>;
}

export type { AuditRecord, AuditStatus, CreateAuditRecord, TagRecord, SyncStatus };
