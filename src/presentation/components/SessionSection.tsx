/**
 * SessionSection — displays active sessions and security alerts.
 *
 * This section is only visible to admin users.
 * Shows loading, error, and empty states.
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { useSessionStore } from '../../state/sessionStore';
import { useAuthStore } from '../../state/authStore';
import Card from './Card';
import SectionHeader from './SectionHeader';
import SessionCard from './SessionCard';
import AlertCard from './AlertCard';

type Props = {
  /** Bearer token for API authentication */
  token: string;
};

export default function SessionSection({ token }: Props) {
  const { colors, typography, spacing } = useTheme();
  const user = useAuthStore(state => state.user);

  const {
    sessions,
    alerts,
    isLoadingSessions,
    isLoadingAlerts,
    error,
    isInitialized,
    fetchAll,
  } = useSessionStore();

  // Fetch data on mount
  useEffect(() => {
    if (!isInitialized && token) {
      fetchAll(token);
    }
  }, [isInitialized, token, fetchAll]);

  // Check if user is admin
  const isAdmin = user?.roles?.includes('admin') ?? false;

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  const isLoading = isLoadingSessions || isLoadingAlerts;

  return (
    <View style={{ marginTop: spacing.lg }}>
      <SectionHeader
        title="Sesión y Seguridad"
        subtitle={`${sessions.length} sesiones activas · ${alerts.length} alertas`}
      />

      {/* Loading State */}
      {isLoading && sessions.length === 0 && alerts.length === 0 && (
        <Card variant="outlined">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando información de sesión...
            </Text>
          </View>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card variant="outlined">
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#EF4444' }]}>
              {error}
            </Text>
          </View>
        </Card>
      )}

      {/* Sessions */}
      {!isLoading && sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, ...typography.body }]}>
            Sesiones Activas
          </Text>
          {sessions.map(session => (
            <SessionCard key={session.session_id} session={session} />
          ))}
        </View>
      )}

      {/* Empty Sessions */}
      {!isLoading && sessions.length === 0 && !error && (
        <Card variant="outlined">
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay sesiones activas
          </Text>
        </Card>
      )}

      {/* Alerts */}
      {!isLoading && alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, ...typography.body }]}>
            Alertas de Seguridad
          </Text>
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
            />
          ))}
        </View>
      )}

      {/* Empty Alerts */}
      {!isLoading && alerts.length === 0 && !error && (
        <Card variant="outlined">
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay alertas de seguridad
          </Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    padding: 12,
  },
});
