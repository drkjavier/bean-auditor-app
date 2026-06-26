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
import type { Tag } from '../../data/mocks/tagsMock';
import type { AuditStatus } from '../../domain/audit/AuditRecord';
import { formatDistance } from '../../domain/farm/geoUtils';
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
  
  /** Callback para auditar */
  onAudit: () => void;
  
  /** Callback para siguiente (skip) */
  onNext: () => void;
  
  /** Callback para cerrar navegación */
  onClose: () => void;
};

/**
 * Obtiene el color del estado
 */
function getStatusColor(status: AuditStatus | null): string {
  switch (status) {
    case 'audited':
      return '#10b981';
    case 'not_audited':
      return '#ef4444';
    case 'pending':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
}

/**
 * Obtiene la etiqueta del estado
 */
function getStatusLabel(status: AuditStatus | null): string {
  switch (status) {
    case 'audited':
      return 'Auditado';
    case 'not_audited':
      return 'No auditado';
    case 'pending':
      return 'Pendiente';
    default:
      return 'Sin auditar';
  }
}

/**
 * Componente NavigationPanel
 */
export default function NavigationPanel({
  targetTag,
  distance,
  tagStatus,
  hasPosition,
  onAudit,
  onNext,
  onClose,
}: NavigationPanelProps) {
  const statusColor = getStatusColor(tagStatus);
  const statusLabel = getStatusLabel(tagStatus);
  const formattedDistance = distance !== null ? formatDistance(distance) : '--';
  
  return (
    <View style={styles.container} accessibilityLabel="Panel de navegación">
      {/* Header */}
      <View style={styles.header}>
        <MdiIcon name="compass-outline" size={20} color="#1e40af" />
        <Text style={styles.headerText}>NAVEGACIÓN ACTIVA</Text>
      </View>
      
      {/* Información del tag destino */}
      {targetTag ? (
        <View style={styles.targetInfo}>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Destino:</Text>
            <Text style={styles.targetValue}>{targetTag.unique_id}</Text>
          </View>
          
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Distancia:</Text>
            <Text style={[styles.targetValue, styles.distanceValue]}>
              {formattedDistance}
            </Text>
          </View>
          
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Estado:</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
          
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Coordenadas:</Text>
            <Text style={styles.coordinates}>
              {targetTag.lat.toFixed(6)}, {targetTag.lon.toFixed(6)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MdiIcon name="check-circle-outline" size={32} color="#10b981" />
          <Text style={styles.emptyText}>¡Todos auditados!</Text>
          <Text style={styles.emptySubtext}>No hay más tags pendientes</Text>
        </View>
      )}
      
      {/* Botones de acción */}
      {targetTag && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.auditButton]}
            onPress={onAudit}
            accessibilityRole="button"
            accessibilityLabel={`Auditar tag ${targetTag.unique_id}`}
          >
            <MdiIcon name="check-circle-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Auditar</Text>
          </Pressable>
          
          <Pressable
            style={[styles.button, styles.nextButton]}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Saltar al siguiente tag"
          >
            <MdiIcon name="skip-next-outline" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Siguiente</Text>
          </Pressable>
          
          <Pressable
            style={[styles.button, styles.closeButton]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar navegación"
          >
            <MdiIcon name="close" size={18} color="#ffffff" />
            <Text style={styles.buttonText}>Cerrar</Text>
          </Pressable>
        </View>
      )}
      
      {/* Sin posición */}
      {!hasPosition && targetTag && (
        <View style={styles.warningBanner}>
          <MdiIcon name="alert-circle-outline" size={16} color="#f59e0b" />
          <Text style={styles.warningText}>Buscando señal GPS...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
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
    color: '#64748b',
    width: 80,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  coordinates: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
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
  auditButton: {
    backgroundColor: '#10b981',
  },
  nextButton: {
    backgroundColor: '#3b82f6',
  },
  closeButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
});

export type { NavigationPanelProps };
