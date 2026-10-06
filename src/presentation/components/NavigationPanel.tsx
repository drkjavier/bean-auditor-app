/**
 * @module presentation/components/NavigationPanel
 * 
 * Panel de información y control para el modo de navegación.
 * 
 * Muestra información del tag destino, distancia, y botones de acción.
 * 
 * @example
 * ```tsx
 * <NavigationPanel
 *   targetTag={nearestTag}
 *   distance={distanceToNearest}
 *   tagStatus={nearestTag?.audit_status}
 *   hasPosition={true}
 *   onAudit={handleAudit}
 *   onNext={handleNext}
 *   onClose={handleClose}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Tag } from '../../data/tagService';
import type { AuditStatus } from '../../domain/audit/AuditRecord';
import { formatDistance } from '../../domain/farm/geoUtils';
import { useTheme } from '../themes/ThemeContext';
import { getAuditStatusLabel, getStatusBadgeColors } from '../utils/auditStatus';
import MdiIcon from './MdiIcon';

/**
 * Props del componente NavigationPanel
 */
export type NavigationPanelProps = {
  /** Tag destino actual */
  targetTag: Tag | null;
  
  /** Distancia en metros */
  distance: number | null;
  
  /** Estado de auditoría del tag */
  tagStatus: AuditStatus | null;
  
  /** Si hay posición del usuario */
  hasPosition: boolean;
  
  /** Si se está buscando la posición GPS */
  isSearchingPosition?: boolean;
  
  /** Callback para auditar */
  onAudit: () => void;
  
  /** Callback para siguiente (skip) */
  onNext: () => void;
  
  /** Callback para cerrar navegación */
  onClose: () => void;
};

/**
 * Componente NavigationPanel
 */
export default function NavigationPanel({
  targetTag,
  distance,
  tagStatus,
  hasPosition,
  isSearchingPosition = false,
  onAudit,
  onNext,
  onClose,
}: NavigationPanelProps) {
  const { colors } = useTheme();
  const statusBadge = getStatusBadgeColors(tagStatus, colors);
  const statusLabel = getAuditStatusLabel(tagStatus);
  const formattedDistance = distance !== null ? formatDistance(distance) : '--';
  
  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      accessibilityLabel="Panel de navegación"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <MdiIcon name="compass-outline" size={20} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.primary }]}>NAVEGACIÓN ACTIVA</Text>
      </View>
      
      {/* Información del tag destino */}
      {targetTag ? (
        <View style={styles.targetInfo}>
          <View style={styles.targetRow}>
            <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Destino:</Text>
            <Text style={[styles.targetValue, { color: colors.textPrimary }]}>{targetTag.unique_id}</Text>
          </View>
          
          <View style={styles.targetRow}>
            <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Distancia:</Text>
            <Text style={[styles.targetValue, styles.distanceValue, { color: colors.primary }]}>
              {formattedDistance}
            </Text>
          </View>
          
          <View style={styles.targetRow}>
            <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Estado:</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.background }]}>
              <Text style={[styles.statusText, { color: statusBadge.text }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>
      ) : isSearchingPosition ? (
        <View style={styles.emptyState}>
          <MdiIcon name="crosshairs-gps" size={32} color={colors.info} />
          <Text style={[styles.searchingText, { color: colors.info }]}>Buscando señal GPS…</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Esperando señal para calcular tag más cercano</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MdiIcon name="check-circle-outline" size={32} color={colors.success} />
          <Text style={[styles.emptyText, { color: colors.success }]}>¡Todos auditados!</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>No hay más tags pendientes</Text>
        </View>
      )}
      
      {/* Botones de acción */}
      {targetTag && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, { backgroundColor: colors.success }]}
            onPress={onAudit}
            accessibilityRole="button"
            accessibilityLabel={`Auditar tag ${targetTag.unique_id}`}
          >
            <MdiIcon name="check-circle-outline" size={18} color={colors.textButton} />
            <Text style={[styles.buttonText, { color: colors.textButton }]}>Auditar</Text>
          </Pressable>
          
          <Pressable
            style={[styles.button, { backgroundColor: colors.actionSecondaryBg }]}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Saltar al siguiente tag"
          >
            <MdiIcon name="skip-next-outline" size={18} color={colors.onActionSecondary} />
            <Text style={[styles.buttonText, { color: colors.onActionSecondary }]}>Siguiente</Text>
          </Pressable>
          
          <Pressable
            style={[styles.button, { backgroundColor: colors.actionSecondaryBg }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar navegación"
          >
            <MdiIcon name="close" size={18} color={colors.onActionSecondary} />
            <Text style={[styles.buttonText, { color: colors.onActionSecondary }]}>Cerrar</Text>
          </Pressable>
        </View>
      )}
      
      {/* Sin posición */}
      {!hasPosition && targetTag && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warningTonal }]}>
          <MdiIcon name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>Buscando señal GPS…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  targetInfo: {
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetLabel: {
    fontSize: 13,
    width: 80,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  searchingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export type { NavigationPanelProps };
