import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container} accessibilityLabel="Pantalla Inicio">
      <Text style={styles.title}>Inicio</Text>
      <Text style={styles.subtitle}>Resumen y accesos rápidos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 8, color: '#475569' },
});
