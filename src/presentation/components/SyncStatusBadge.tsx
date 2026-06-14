/**
 * SyncStatusBadge - Shows synchronization status.
 *
 * Displays:
 * - Pending count badge
 * - Sync button
 * - Auto-sync toggle with countdown
 * - Last sync result
 *
 * Usage:
 * ```tsx
 * <SyncStatusBadge />
 * ```
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';
import { useSyncStore, usePendingCount, useIsSyncing, useNextSyncIn } from '../../stores';

type Props = {
  /** Show detailed status (with counts) */
  detailed?: boolean;
  /** Show auto-sync toggle */
  showAutoSync?: boolean;
};

/**
 * Format seconds to human-readable countdown string.
 * Examples: "30s", "1m 30s", "2m 0s"
 */
function formatCountdown(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '';
  if (seconds === 0) return '0s';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export default function SyncStatusBadge({ detailed = false, showAutoSync = true }: Props) {
  const { colors, typography, radii } = useTheme();
  const totalPending = usePendingCount();
  const tagsPending = useSyncStore((s) => s.status.tags_pending);
  const auditsPending = useSyncStore((s) => s.status.audits_pending);
  const isSyncing = useIsSyncing();
  const lastPullResult = useSyncStore((s) => s.lastPullResult);
  const syncNow = useSyncStore((s) => s.syncNow);
  const startAutoSync = useSyncStore((s) => s.startAutoSync);
  const stopAutoSync = useSyncStore((s) => s.stopAutoSync);
  const autoSyncEnabled = useSyncStore((s) => s.autoSyncEnabled);
  const nextSyncIn = useNextSyncIn();

  const hasPending = totalPending > 0;
  const showSuccess = lastPullResult?.success && lastPullResult.tagsDownloaded > 0;
  const showCountdown = autoSyncEnabled && nextSyncIn !== null && !isSyncing;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radii.md }]}>
      {/* ── Sync Button ──────────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [
          styles.syncButton,
          {
            backgroundColor: hasPending ? colors.primary : colors.muted,
            borderRadius: radii.md,
          },
          pressed && styles.pressed,
        ]}
        onPress={syncNow}
        disabled={isSyncing || !hasPending}
        accessibilityRole="button"
        accessibilityLabel={isSyncing ? 'Sincronizando' : `Sincronizar ${totalPending} registros`}
      >
        <MdiIcon
          name={isSyncing ? 'sync' : 'cloud-upload-outline'}
          size={18}
          color={colors.textButton}
        />
        <Text style={[styles.syncText, { color: colors.textButton }]}>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </Text>
        {hasPending && !isSyncing && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={[styles.badgeText, { color: colors.textButton }]}>
              {totalPending}
            </Text>
          </View>
        )}
      </Pressable>

      {/* ── Countdown ────────────────────────────────────────────────────── */}
      {showCountdown && (
        <View style={[styles.countdownContainer, { backgroundColor: colors.primary + '14' }]}>
          <MdiIcon name="timer-outline" size={14} color={colors.primary} />
          <Text style={[styles.countdownText, { color: colors.primary, ...typography.caption }]}>
            {formatCountdown(nextSyncIn)}
          </Text>
        </View>
      )}

      {/* ── Detailed Status ──────────────────────────────────────────────── */}
      {detailed && (
        <View style={styles.details}>
          {tagsPending > 0 && (
            <View style={styles.detailRow}>
              <MdiIcon name="tag-outline" size={14} color={colors.textCaption} />
              <Text style={[styles.detailText, { color: colors.textCaption, ...typography.caption }]}>
                Tags: {tagsPending}
              </Text>
            </View>
          )}
          {auditsPending > 0 && (
            <View style={styles.detailRow}>
              <MdiIcon name="clipboard-check-outline" size={14} color={colors.textCaption} />
              <Text style={[styles.detailText, { color: colors.textCaption, ...typography.caption }]}>
                Auditorías: {auditsPending}
              </Text>
            </View>
          )}
          {showSuccess && lastPullResult && (
            <View style={styles.detailRow}>
              <MdiIcon name="check-circle-outline" size={14} color={colors.success} />
              <Text style={[styles.detailText, { color: colors.success, ...typography.caption }]}>
                Sincronizado: {lastPullResult.tagsDownloaded} registros
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Auto-sync Toggle ─────────────────────────────────────────────── */}
      {showAutoSync && (
        <Pressable
          style={({ pressed }) => [
            styles.autoSyncButton,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          onPress={autoSyncEnabled ? stopAutoSync : startAutoSync}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoSyncEnabled }}
          accessibilityLabel="Auto sincronización"
        >
          <MdiIcon
            name={autoSyncEnabled ? 'sync' : 'sync-off'}
            size={16}
            color={autoSyncEnabled ? colors.success : colors.muted}
          />
          <Text style={[styles.autoSyncText, { color: colors.textSecondary, ...typography.caption }]}>
            Auto
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  syncText: {
    fontWeight: '600',
    fontSize: 13,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  countdownText: {
    fontWeight: '600',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  details: {
    flexDirection: 'row',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {},
  autoSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  autoSyncText: {},
});
