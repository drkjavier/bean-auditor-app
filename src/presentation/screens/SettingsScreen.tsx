import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export default function SettingsScreen() {
  const logout = useAuthStore(state => state.logout);

  return (
    <View style={styles.container} accessibilityLabel="Pantalla Ajustes">
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Preferencias de la aplicación</Text>

      <Pressable onPress={logout} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Cerrar sesión</Text>
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
