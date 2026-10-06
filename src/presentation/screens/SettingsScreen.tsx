/**
 * SettingsScreen — preferencias de la aplicación.
 *
 * Uses SettingsRow, Card and SectionHeader for structured layout.
 * Wrapped in ScrollView for small-screen safety.
 * Preserves existing test contract: 'Visible'/'Oculto' text for toggle.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, TextInput } from 'react-native';
import { useAuthStore } from '../../stores';
import {
  useSettingsStore,
  DEFAULT_ARRIVAL_RADIUS_METERS,
} from '../../state/settingsStore';
import { logEvent } from '../../infrastructure/telemetry';
import { useTheme } from '../themes/ThemeContext';
import type { ThemeMode } from '../../domain/constants/themeMode';
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
  const arrivalRadiusMeters = useSettingsStore(state => state.arrivalRadiusMeters);
  const arrivalRadiusConfigured = useSettingsStore(state => state.arrivalRadiusConfigured);
  const setArrivalRadius = useSettingsStore(state => state.setArrivalRadius);
  const themeMode = useSettingsStore(state => state.themeMode);
  const setThemeMode = useSettingsStore(state => state.setThemeMode);
  const [debugInfo, setDebugInfo] = useState<string>('Cargando...');
  const [showPatternVisualizer, setShowPatternVisualizer] = useState(false);
  const [showPlantationGrid, setShowPlantationGrid] = useState(false);
  const [radiusDraft, setRadiusDraft] = useState(
    arrivalRadiusMeters != null ? String(arrivalRadiusMeters) : String(DEFAULT_ARRIVAL_RADIUS_METERS),
  );
  const [radiusError, setRadiusError] = useState<string | null>(null);
  const [radiusSaved, setRadiusSaved] = useState(false);
  const radiusAutosaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from SQLite when the screen mounts (web reload, tab switch).
  useEffect(() => {
    let mounted = true;
    useSettingsStore
      .getState()
      .hydrateSettings()
      .then(() => {
        if (!mounted) return;
        const meters = useSettingsStore.getState().arrivalRadiusMeters;
        if (meters != null && Number.isFinite(meters) && meters > 0) {
          setRadiusDraft(String(meters));
          setRadiusSaved(true);
        }
      })
      .catch(() => {
        // Hydration errors are already logged by the store/repo
      });
    return () => {
      mounted = false;
      if (radiusAutosaveRef.current) {
        clearTimeout(radiusAutosaveRef.current);
      }
    };
  }, []);

  // Auto-save when the draft becomes valid so navigation never re-prompts
  // even if the user forgets to press "Guardar".
  useEffect(() => {
    if (radiusAutosaveRef.current) {
      clearTimeout(radiusAutosaveRef.current);
    }
    const trimmed = radiusDraft.trim().replace(',', '.');
    const parsed = Number(trimmed);
    if (!trimmed || !Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    radiusAutosaveRef.current = setTimeout(() => {
      setArrivalRadius(parsed);
      setRadiusError(null);
      setRadiusSaved(true);
    }, 350);
    return () => {
      if (radiusAutosaveRef.current) {
        clearTimeout(radiusAutosaveRef.current);
      }
    };
  }, [radiusDraft, setArrivalRadius]);

  useEffect(() => {
    // Debug panel: never expose token material (not even a fragment).
    const tokenState = accessToken ? 'present' : 'missing';
    const userRoles = user?.roles?.join(', ') || 'no roles';
    const isAdmin = user?.roles?.includes('admin') ?? false;
    setDebugInfo(`Token: ${tokenState} | Admin: ${isAdmin} | Roles: ${userRoles}`);
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

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    try { logEvent('settings_set_theme_mode', { mode }); } catch { /* noop */ }
  };

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: 'Claro' },
    { key: 'dark', label: 'Oscuro' },
    { key: 'system', label: 'Sistema' },
  ];

  const handleSaveArrivalRadius = () => {
    const trimmed = radiusDraft.trim().replace(',', '.');
    const parsed = Number(trimmed);
    if (!trimmed || !Number.isFinite(parsed) || parsed <= 0) {
      setRadiusError('Ingresa un radio válido en metros (mayor a 0).');
      setRadiusSaved(false);
      return;
    }
    setRadiusError(null);
    setArrivalRadius(parsed);
    setRadiusDraft(String(parsed));
    setRadiusSaved(true);
    try {
      logEvent('settings_set_arrival_radius', { meters: parsed });
    } catch {
      /* noop */
    }
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
            showDivider
          />
          <SettingsRow
            label="Tema de la aplicación"
            trailing={
              <View style={styles.themeRow}>
                {themeOptions.map(option => {
                  const isActive = themeMode === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => handleThemeChange(option.key)}
                      accessibilityRole="button"
                      accessibilityLabel={`Tema: ${option.label}${isActive ? ' (activo)' : ''}`}
                      accessibilityState={{ selected: isActive }}
                      style={[
                        styles.themePill,
                        {
                          backgroundColor: isActive ? colors.primary : colors.actionSecondaryBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          { color: isActive ? colors.textButton : colors.onActionSecondary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            }
            showDivider={false}
          />
          <SettingsRow
            label="Radio de llegada (m)"
            trailing={
              <Text
                style={{
                  color: arrivalRadiusConfigured && arrivalRadiusMeters != null
                    ? colors.success
                    : colors.textCaption,
                  fontWeight: '700',
                  fontSize: 13,
                }}
                accessibilityRole="status"
              >
                {arrivalRadiusConfigured && arrivalRadiusMeters != null
                  ? `${arrivalRadiusMeters} m ✓`
                  : 'Sin configurar'}
              </Text>
            }
            showDivider
          />
          <View style={{ paddingBottom: 4 }}>
            <Text
              style={{
                color: colors.textCaption,
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              Distancia GPS para detectar que llegaste al tag en modo navegación. Se guarda automáticamente al escribir un valor válido.
            </Text>
            <View style={styles.radiusRow}>
              <TextInput
                style={[
                  styles.radiusInput,
                  {
                    borderColor: radiusError
                      ? colors.error
                      : arrivalRadiusConfigured && arrivalRadiusMeters != null
                        ? colors.success
                        : colors.border,
                    color: colors.textPrimary,
                    backgroundColor: colors.background,
                  },
                ]}
                value={radiusDraft}
                onChangeText={next => {
                  setRadiusDraft(next);
                  setRadiusError(null);
                  setRadiusSaved(false);
                }}
                onBlur={handleSaveArrivalRadius}
                keyboardType="decimal-pad"
                placeholder="Ej: 10"
                accessibilityLabel="Radio de llegada en metros"
                accessibilityHint="Valor numérico mayor a cero. Se guarda automáticamente."
              />
              <Pressable
                onPress={handleSaveArrivalRadius}
                accessibilityRole="button"
                accessibilityLabel="Guardar radio de llegada"
                style={[styles.radiusSaveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.radiusSaveText, { color: colors.textButton }]}>Guardar</Text>
              </Pressable>
            </View>
            {radiusSaved && arrivalRadiusConfigured && arrivalRadiusMeters != null ? (
              <Text
                style={{ color: colors.success, fontSize: 12, marginTop: 6, fontWeight: '600' }}
                accessibilityRole="status"
              >
                Guardado: {arrivalRadiusMeters} m — la navegación no volverá a pedirlo.
              </Text>
            ) : null}
            {radiusError ? (
              <Text style={{ color: colors.error, fontSize: 12, marginTop: 6 }} accessibilityRole="alert">
                {radiusError}
              </Text>
            ) : null}
          </View>
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
          <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>
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
              plantsPerHectare: 50,
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
  themeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  summaryText: {
    fontSize: 11,
    paddingHorizontal: 4,
    paddingBottom: 8,
    lineHeight: 16,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  radiusSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  radiusSaveText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
