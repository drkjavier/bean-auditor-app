/**
 * AlertCard — displays a security alert for the user.
 *
 * Shows alert type, message, severity, IP, user agent, and timestamp.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { SessionAlert } from '../../domain/session/SessionInfo';

type Props = {
  alert: SessionAlert;
  onPress?: (alertId: string) => void;
};

export default function AlertCard({ alert, onPress }: Props) {
  const { colors, typography } = useTheme();

  const severityColors: Record<string, string> = {
    low: '#3B82F6',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626',
  };

  const severityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  };

  const severityColor = severityColors[alert.severity] || colors.primary;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: severityColor,
          borderWidth: 1,
        },
      ]}
      onPress={() => onPress?.(alert.id)}
      accessibilityLabel={`Alerta ${severityLabels[alert.severity] || alert.severity}: ${alert.message}`}
      accessibilityRole="button"
    >
      {/* Header with type and severity badge */}
      <View style={styles.header}>
        <Text style={[styles.type, { color: colors.textPrimary, ...typography.body }]}>
          {formatType(alert.type)}
        </Text>
        <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
          <Text style={[styles.severityText, { color: '#FFFFFF' }]}>
            {severityLabels[alert.severity] || alert.severity}
          </Text>
        </View>
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {alert.message}
      </Text>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>IP:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{alert.ip_address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Agente:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
            {alert.user_agent}
          </Text>
        </View>
      </View>

      {/* Footer with timestamp */}
      <View style={styles.footer}>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatDate(alert.timestamp)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  details: {
    gap: 4,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    width: 60,
  },
  value: {
    fontSize: 11,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
