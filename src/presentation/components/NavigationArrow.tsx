/**
 * @module presentation/components/NavigationArrow
 * 
 * Componente de flecha SVG direccional para navegación.
 * 
 * Muestra una flecha centrada en el mapa que rota según el bearing
 * al tag destino, con indicador de distancia y estado.
 * 
 * @example
 * ```tsx
 * <NavigationArrow
 *   bearing={45}
 *   distance={150}
 *   tagId="TAG-001"
 *   tagStatus="pending"
 *   visible={true}
 *   onPress={() => console.log('Arrow pressed')}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import type { AuditStatus } from '../../domain/audit/AuditRecord';
import { formatDistance, getBearingDescription } from '../../domain/farm/geoUtils';

/**
 * Props del componente NavigationArrow
 */
export type NavigationArrowProps = {
  /** Ángulo de rotación en grados (0-360, 0=Norte) */
  bearing: number;
  
  /** Distancia en metros */
  distance: number;
  
  /** ID del tag destino */
  tagId: string;
  
  /** Estado de auditoría del tag destino */
  tagStatus: AuditStatus | null;
  
  /** Si la flecha está visible */
  visible: boolean;
  
  /** Callback al presionar la flecha */
  onPress?: () => void;
};

/**
 * Obtiene el color según la distancia
 */
function getDistanceColor(meters: number): string {
  if (meters < 50) {
    return '#10b981'; // Verde - muy cerca
  }
  if (meters < 100) {
    return '#22c55e'; // Verde claro
  }
  if (meters < 500) {
    return '#3b82f6'; // Azul claro
  }
  return '#1e40af'; // Azul normal
}

/**
 * Obtiene el color de fondo del badge de estado
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
 * Componente NavigationArrow
 */
export default function NavigationArrow({
  bearing: bearingDegrees,
  distance: distanceMeters,
  tagId,
  tagStatus,
  visible,
  onPress,
}: NavigationArrowProps) {
  // Animación de rotación
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  // Animación de pulse para distancias cortas
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Animar rotación suave
    Animated.timing(rotationAnim, {
      toValue: bearingDegrees,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [bearingDegrees, rotationAnim]);
  
  useEffect(() => {
    // Animación de pulse cuando está muy cerca
    if (distanceMeters < 50 && visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [distanceMeters, visible, pulseAnim]);
  
  if (!visible) {
    return null;
  }
  
  const distanceColor = getDistanceColor(distanceMeters);
  const statusColor = getStatusColor(tagStatus);
  const statusLabel = getStatusLabel(tagStatus);
  const directionLabel = getBearingDescription(bearingDegrees);
  const formattedDistance = formatDistance(distanceMeters);
  
  // Label de accesibilidad
  const accessibilityLabel = `Navegación hacia ${tagId}, ${formattedDistance} metros, dirección ${directionLabel}`;
  
  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Presiona para ver detalles del tag destino"
    >
      {/* Flecha SVG */}
      <Animated.View
        style={[
          styles.arrowContainer,
          {
            transform: [
              { rotate: rotationAnim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })},
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <View style={[styles.arrow, { borderBottomColor: distanceColor }]}>
          <View style={[styles.arrowHead, { borderBottomColor: distanceColor }]} />
          <View style={[styles.arrowShaft, { backgroundColor: distanceColor }]} />
        </View>
      </Animated.View>
      
      {/* Badge de distancia */}
      <View style={[styles.distanceBadge, { backgroundColor: 'rgba(15, 23, 42, 0.85)' }]}>
        <Text style={styles.distanceText}>{formattedDistance}</Text>
      </View>
      
      {/* Badge de tag ID */}
      <View style={[styles.tagBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.tagText}>{tagId}</Text>
      </View>
      
      {/* Badge de estado */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 160,
  },
  arrowContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowShaft: {
    width: 8,
    height: 30,
    borderRadius: 4,
  },
  distanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  distanceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 2,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// Exportar tipo para uso externo
export type { NavigationArrowProps };
