/**
 * SettingsScreen — preferencias de la aplicación.
 *
 * Uses SettingsRow, Card and SectionHeader for structured layout.
 * Wrapped in ScrollView for small-screen safety.
 * Preserves existing test contract: 'Visible'/'Oculto' text for toggle.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores';
import { useSettingsStore } from '../../state/settingsStore';
import { logEvent } from '../../infrastructure/telemetry';
import { useTheme } from '../themes/ThemeContext';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import SettingsRow from '../components/SettingsRow';
import Button from '../components/Button';
import DatabaseDebugPanel from '../components/DatabaseDebugPanel';
import SyncStatusBadge from '../components/SyncStatusBadge';
import SessionSection from '../components/SessionSection';
import PlantingPatternVisualizer from '../components/PlantingPatternVisualizer';
import PlantationGrid from '../components/PlantationGrid';
import { centerTag, hectareMetrics, totalPlants } from '../../data/mocks/tagsMock';
import { getPlantationSummary } from '../../data/mocks/tagsMock';

export default function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const logout = useAuthStore(state => state.logout);
  const username = useAuthStore(state => state.username);
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const showUserLocation = useSettingsStore(state => state.showUserLocation);
  const setShowUserLocation = useSettingsStore(state => state.setShowUserLocation);
  const [debugInfo, setDebugInfo] = useState<string>('Cargando...');
  const [showPatternVisualizer, setShowPatternVisualizer] = useState(false);
  const [showPlantationGrid, setShowPlantationGrid] = useState(false);

  useEffect(() => {
    const tokenPreview = accessToken ? `${accessToken.substring(0, 20)}...` : 'null';
    const userRoles = user?.roles?.join(', ') || 'no roles';
    const isAdmin = user?.roles?.includes('admin') ?? false;
    setDebugInfo(`Token: ${tokenPreview} | Admin: ${isAdmin} | Roles: ${userRoles}`);
    console.log('[SettingsScreen] Token:', tokenPreview, 'IsAdmin:', isAdmin);
  }, [accessToken, user]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const handleToggleLocation = () => {
    const next = !showUserLocation;
    setShowUserLocation(next);
    try { logEvent('settings_toggle_showUserLocation', { enabled: next }); } catch { /* noop */ }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}
      accessibilityLabel="Pantalla Ajustes"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.textPrimary, ...typography.h2 }]}>Ajustes</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.body }]}>
        Preferencias de la aplicación
      </Text>

      {/* ── Account ────────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Cuenta" />
        <Card variant="outlined">
          <SettingsRow
            label="Email"
            trailing={<Text style={{ color: colors.textSecondary }}>{username || '—'}</Text>}
            showDivider={false}
          />
        </Card>
      </View>

      {/* ── Preferences ────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Preferencias" />
        <Card variant="outlined">
          <SettingsRow
            label="Mostrar mi ubicación en el mapa"
            trailing={
              <Pressable
                onPress={handleToggleLocation}
                accessibilityRole="button"
                accessibilityLabel={`Ubicación: ${showUserLocation ? 'Visible' : 'Oculto'}`}
                style={[
                  styles.togglePill,
                  { backgroundColor: showUserLocation ? colors.primary : colors.border },
                ]}
              >
                <Text style={[styles.toggleText, { color: showUserLocation ? colors.textButton : colors.textPrimary }]}>
                  {showUserLocation ? 'Visible' : 'Oculto'}
                </Text>
              </Pressable>
            }
            showDivider={false}
          />
        </Card>
      </View>

      {/* ── Synchronization ───────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Sincronización" subtitle="Gestiona la sincronización con el servidor" />
        <SyncStatusBadge detailed showAutoSync />
      </View>

      {/* ── Session & Security (Admin only) ─────────────────────────── */}
      {/* Debug info - always visible */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Debug Sesión" subtitle="Estado actual" />
        <Card variant="outlined">
          <Text style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
            {debugInfo}
          </Text>
        </Card>
      </View>
      {accessToken && <SessionSection token={accessToken} />}

      {/* ── Tools ─────────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader
          title="Herramientas"
          subtitle="Utilidades de planificación"
        />
        <Card variant="outlined">
          <SettingsRow
            label="Visualizador de patrones de siembra"
            onPress={() => setShowPatternVisualizer(v => !v)}
            trailing={
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {showPatternVisualizer ? 'Ocultar' : 'Mostrar'}
              </Text>
            }
            showDivider={false}
          />
        </Card>

        {showPatternVisualizer && <PlantingPatternVisualizer initialPlants={1650} />}

        <Card variant="outlined" style={{ marginTop: spacing.sm }}>
          <SettingsRow
            label="Plantación completa: 4 ha"
            onPress={() => setShowPlantationGrid(v => !v)}
            trailing={
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {showPlantationGrid ? 'Ocultar' : 'Mostrar'}
              </Text>
            }
            showDivider={false}
          />
          <Text
            style={[
              styles.summaryText,
              { color: colors.textCaption },
            ]}
          >
            {getPlantationSummary()}
          </Text>
        </Card>

        {showPlantationGrid && (
          <PlantationGrid
            data={{
              hectares: hectareMetrics.map(h => ({
                gridRow: h.gridRow,
                gridCol: h.gridCol,
                plantCount: h.plantCount,
              })),
              totalPlants,
              centerTagId: centerTag.unique_id,
              centerLat: centerTag.lat,
              centerLon: centerTag.lon,
              plantsPerHectare: 1700,
              patternType: 'mixed',
            }}
          />
        )}
      </View>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Acerca de" />
        <Card variant="outlined">
          <SettingsRow label="Versión" trailing={<Text style={{ color: colors.textSecondary }}>1.0.0</Text>} />
          <SettingsRow label="Plataforma" trailing={<Text style={{ color: colors.textSecondary }}>BeanAuditor</Text>} showDivider={false} />
        </Card>
      </View>

      {/* ── Database Debug (dev only) ────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Base de datos (Debug)" subtitle="Solo visible en desarrollo" />
        <DatabaseDebugPanel />
      </View>

      {/* ── Logout ─────────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.xl }}>
        <Button variant="tonal" onPress={handleLogout} accessibilityLabel="Cerrar sesión">
          Cerrar sesión
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {},
  subtitle: { marginTop: 4 },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 13,
  },
  summaryText: {
    fontSize: 11,
    paddingHorizontal: 4,
    paddingBottom: 8,
    lineHeight: 16,
  },
});
