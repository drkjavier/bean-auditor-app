import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuthStore } from '../../stores';
import { useSettingsStore } from '../../state/settingsStore';
import { logEvent } from '../../infrastructure/telemetry';

export default function SettingsScreen() {
  const logout = useAuthStore(state => state.logout);
  const showUserLocation = useSettingsStore(state => state.showUserLocation);
  const setShowUserLocation = useSettingsStore(state => state.setShowUserLocation);

  return (
    <View style={styles.container} accessibilityLabel="Pantalla Ajustes">
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Preferencias de la aplicación</Text>

      <Pressable onPress={logout} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>

      <View style={{ height: 16 }} />
      <Text style={{ marginBottom: 8 }}>Mostrar mi ubicación en el mapa</Text>
      <Pressable
        onPress={() => { setShowUserLocation(!showUserLocation); try { logEvent('settings_toggle_showUserLocation', { enabled: !showUserLocation }); } catch(_) {} }}
        style={[styles.button, { backgroundColor: showUserLocation ? '#2563eb' : '#e2e8f0' }]}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: showUserLocation ? '#fff' : '#0f172a' }]}>{showUserLocation ? 'Visible' : 'Oculto'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 8, color: '#475569', marginBottom: 16 },
  button: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
