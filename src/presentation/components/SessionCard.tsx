/**
 * SessionCard — displays information about an active user session.
 *
 * Shows session ID, IP address, user agent, creation and expiration times.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { SessionInfo } from '../../domain/session/SessionInfo';

type Props = {
  session: SessionInfo;
};

export default function SessionCard({ session }: Props) {
  const { colors, typography } = useTheme();

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

  // Check if session is expired
  const isExpired = new Date(session.expires_at) < new Date();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isExpired ? '#EF4444' : colors.primary,
          borderWidth: 1,
        },
      ]}
      accessibilityLabel={`Sesión ${session.session_id.substring(0, 8)}...`}
    >
      {/* Header with session ID */}
      <View style={styles.header}>
        <Text style={[styles.sessionId, { color: colors.textPrimary, ...typography.body }]}>
          {session.session_id.substring(0, 8)}...
        </Text>
        {isExpired && (
          <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
              Expirada
            </Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>IP:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{session.ip_address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Creada:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {formatDate(session.created_at)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Expira:</Text>
          <Text style={[styles.value, { color: isExpired ? '#EF4444' : colors.textPrimary }]}>
            {formatDate(session.expires_at)}
          </Text>
        </View>
      </View>

      {/* User Agent (truncated) */}
      <Text
        style={[styles.userAgent, { color: colors.textSecondary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {session.user_agent}
      </Text>
    </View>
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
  sessionId: {
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    width: 100,
  },
  value: {
    fontSize: 12,
    flex: 1,
  },
  userAgent: {
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
