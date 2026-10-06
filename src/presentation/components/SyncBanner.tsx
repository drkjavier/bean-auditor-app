/**
 * SyncBanner - Global sync status indicator
 *
 * Shows current sync status, pending items, and connectivity.
 * Appears at the top of the main screen.
 *
 * Features:
 * - Online/offline indicator
 * - Pending items count
 * - Sync progress
 * - Manual sync trigger
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSyncStore, usePendingCount, useIsSyncing, useIsConnected, useSyncProgress } from '../../state/syncStore';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';

type SyncBannerProps = {
  /** Show detailed progress (for initial sync) */
  showProgress?: boolean;
  /** Callback when sync is tapped */
  onPress?: () => void;
};

export function SyncBanner({ showProgress = false, onPress }: SyncBannerProps) {
  const { colors } = useTheme();
  const pendingCount = usePendingCount();
  const isSyncing = useIsSyncing();
  const isConnected = useIsConnected();
  const syncProgress = useSyncProgress();
  const syncNow = useSyncStore((state) => state.syncNow);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else if (!isSyncing && isConnected && pendingCount > 0) {
      syncNow();
    }
  }, [onPress, isSyncing, isConnected, pendingCount, syncNow]);

  // Don't show banner if everything is synced and online
  if (!isSyncing && isConnected && pendingCount === 0 && !showProgress) {
    return null;
  }

  /** Maps the current sync state to saturated + tonal theme tokens. */
  const getStatusTokens = () => {
    if (!isConnected) return { fg: colors.error, bg: colors.dangerTonal };
    if (isSyncing) return { fg: colors.info, bg: colors.infoTonal };
    if (pendingCount > 0) return { fg: colors.warning, bg: colors.warningTonal };
    return { fg: colors.success, bg: colors.successTonal };
  };

  const status = getStatusTokens();

  const getStatusIcon = () => {
    if (!isConnected) return 'wifi-off';
    if (isSyncing) return 'sync';
    if (pendingCount > 0) return 'cloud-upload';
    return 'cloud-check';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Sin conexión';
    if (isSyncing && syncProgress.message) return syncProgress.message;
    if (isSyncing) return 'Sincronizando...';
    if (pendingCount > 0) return `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`;
    return 'Sincronizado';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: status.bg, borderBottomColor: colors.border }]}
      onPress={handlePress}
      disabled={isSyncing}
      accessibilityRole="button"
      accessibilityLabel={`Estado de sincronización: ${getStatusText()}`}
      accessibilityHint={!isSyncing && pendingCount > 0 ? 'Toca para sincronizar ahora' : undefined}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={status.fg} style={styles.icon} />
        ) : (
          <MdiIcon name={getStatusIcon()} size={20} color={status.fg} style={styles.icon} />
        )}

        <Text style={[styles.text, { color: status.fg }]} numberOfLines={1}>
          {getStatusText()}
        </Text>

        {showProgress && syncProgress.percent !== null && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${syncProgress.percent}%`,
                    backgroundColor: status.fg,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: status.fg }]}>
              {Math.round(syncProgress.percent)}%
            </Text>
          </View>
        )}

        {!isSyncing && isConnected && pendingCount > 0 && (
          <MdiIcon name="refresh" size={16} color={status.fg} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  progressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    minWidth: 30,
  },
});

export default SyncBanner;
