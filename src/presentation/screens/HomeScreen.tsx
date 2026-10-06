/**
 * HomeScreen — resumen y accesos rápidos.
 *
 * Shows a welcome message, summary cards and quick-action buttons.
 * Layout adapts responsively via useWindowDimensions (Context7 pattern).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import MdiIcon from '../components/MdiIcon';
import SyncStatusBadge from '../components/SyncStatusBadge';
import { getAuditCounts } from '../../data/tagService';
import { useAuthStore, useSyncStore } from '../../stores';

type Props = {
  onNavigate?: (route: string) => void;
};

export default function HomeScreen({ onNavigate }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const username = useAuthStore(state => state.username);
  const initializeSync = useSyncStore(state => state.initialize);
  const [counts, setCounts] = useState({ audited: 0, not_audited: 0, pending: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    getAuditCounts().then(data => {
      if (!cancelled) setCounts(data);
    }).catch(err => {
      if (process.env.NODE_ENV !== 'production') console.error('HomeScreen: failed to load audit counts', err);
    });
    return () => { cancelled = true; };
  }, []);

  // Initialize sync store and subscribe to updates
  useEffect(() => {
    const unsubscribe = initializeSync();
    return unsubscribe;
  }, [initializeSync]);

  const quickActions = [
    { key: 'audit', icon: 'clipboard-text-search-outline', label: 'Auditoría', bg: colors.primary, fg: colors.textButton },
    { key: 'settings', icon: 'cog-outline', label: 'Ajustes', bg: colors.actionSecondaryBg, fg: colors.onActionSecondary },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}
      accessibilityLabel="Pantalla Inicio"
    >
      {/* ── Welcome ────────────────────────────────────────────────────── */}
      <Text style={[styles.welcome, { color: colors.textPrimary, ...typography.h2 }]}>
        {username ? `Hola, ${username}` : 'Bienvenido'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.body }]}>
        Resumen y accesos rápidos
      </Text>

      {/* ── Summary card ───────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Resumen" />
        <Card variant="elevated" accessibilityLabel="Resumen de actividad">
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MdiIcon name="clipboard-check-outline" size={24} color={colors.success} />
              <Text style={[styles.summaryValue, { color: colors.textPrimary, ...typography.data }]}>{counts.audited}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textCaption, ...typography.caption }]}>Auditados</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <MdiIcon name="clipboard-clock-outline" size={24} color={colors.warning} />
              <Text style={[styles.summaryValue, { color: colors.textPrimary, ...typography.data }]}>{counts.pending}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textCaption, ...typography.caption }]}>Pendientes</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <MdiIcon name="tag-outline" size={24} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.textPrimary, ...typography.data }]}>{counts.total}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textCaption, ...typography.caption }]}>Total tags</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* ── Sync Status ─────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Sincronización" subtitle="Estado de sincronización con el servidor" />
        <SyncStatusBadge detailed showAutoSync />
      </View>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Accesos rápidos" />
        <View style={styles.actionsGrid}>
          {quickActions.map(action => (
            <Pressable
              key={action.key}
              onPress={() => onNavigate?.(action.key)}
              accessibilityRole="button"
              accessibilityLabel={`Ir a ${action.label}`}
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: action.bg,
                  borderRadius: radii.lg,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <MdiIcon name={action.icon} size={28} color={action.fg} />
              <Text style={[styles.actionLabel, { color: action.fg, ...typography.body }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  welcome: {},
  subtitle: { marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  summaryLabel: {
    marginTop: 2,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    minWidth: 140,
    // boxShadow is supported natively by RN 0.76+ and by react-native-web.
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionLabel: {
    fontWeight: '600',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});
