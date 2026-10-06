/**
 * @module presentation/utils/auditStatus
 *
 * Shared audit-status label and badge-color helpers.
 *
 * Business rule (confirmed with product): `audit_status === null` is the same
 * concept as `pending` and must be displayed as "Pendiente" everywhere.
 */
import type { AuditStatus } from '../../domain/audit/AuditRecord';
import type { useTheme } from '../themes/ThemeContext';

type ThemeColors = ReturnType<typeof useTheme>['colors'];

export type StatusBadgeColors = { background: string; text: string };

/**
 * User-facing label for an audit status.
 * `null`/`undefined` fall back to "Pendiente" (same concept as `pending`).
 */
export function getAuditStatusLabel(status: AuditStatus | null | undefined): string {
  switch (status) {
    case 'audited':
      return 'Auditado';
    case 'not_audited':
      return 'No auditado';
    case 'pending':
    default:
      return 'Pendiente';
  }
}

/**
 * Tonal background + saturated text colors for an audit-status badge.
 * `null`/`undefined` use the pending (warning) mapping.
 */
export function getStatusBadgeColors(
  status: AuditStatus | null | undefined,
  colors: ThemeColors,
): StatusBadgeColors {
  switch (status) {
    case 'audited':
      return { background: colors.successTonal, text: colors.success };
    case 'not_audited':
      return { background: colors.dangerTonal, text: colors.error };
    case 'pending':
    default:
      return { background: colors.warningTonal, text: colors.warning };
  }
}
