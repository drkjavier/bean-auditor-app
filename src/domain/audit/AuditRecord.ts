export type AuditStatus = 'audited' | 'not_audited' | 'pending';

export type AuditRecord = {
  uuid_tag: string;
  status: AuditStatus;
  timestamp: number; // epoch ms
  username: string;
  lat: number | null;
  lon: number | null;
  note: string | null;
  sync_pending: boolean;
};

export type CreateAuditRecord = Omit<AuditRecord, 'timestamp' | 'sync_pending'> & {
  timestamp?: number;
  sync_pending?: boolean;
};

export type TagRecord = {
  uuid: string;
  colorHex: string;
  unique_id: string;
  lat: number;
  lon: number;
  timestamp: string;
  created_at: number;
  updated_at: number;
  sync_pending: boolean;

  /** Server-assigned version for conflict resolution */
  version: number;

  /** Who last modified this record */
  updated_by: string | null;

  /** Farm UUID this tag belongs to */
  farm_id: string | null;
};

export type SyncStatus = {
  tags_pending: number;
  audits_pending: number;
  total_pending: number;
};
