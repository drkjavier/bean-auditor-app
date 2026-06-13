/**
 * SettingsScreen — preferencias de la aplicación.
 *
 * Uses SettingsRow, Card and SectionHeader for structured layout.
 * Wrapped in ScrollView for small-screen safety.
 * Preserves existing test contract: 'Visible'/'Oculto' text for toggle.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores';
import { useSettingsStore } from '../../state/settingsStore';
import { logEvent } from '../../infrastructure/telemetry';
import { useTheme } from '../themes/ThemeContext';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import SettingsRow from '../components/SettingsRow';
import Button from '../components/Button';

export default function SettingsScreen() {
  const { colors, typography, spacing } = useTheme();
  const logout = useAuthStore(state => state.logout);
  const username = useAuthStore(state => state.username);
  const showUserLocation = useSettingsStore(state => state.showUserLocation);
  const setShowUserLocation = useSettingsStore(state => state.setShowUserLocation);

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

      {/* ── About ──────────────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Acerca de" />
        <Card variant="outlined">
          <SettingsRow label="Versión" trailing={<Text style={{ color: colors.textSecondary }}>1.0.0</Text>} />
          <SettingsRow label="Plataforma" trailing={<Text style={{ color: colors.textSecondary }}>BeanAuditor</Text>} showDivider={false} />
        </Card>
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
});
