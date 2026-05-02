import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AuditScreen() {
  return (
    <View style={styles.container} accessibilityLabel="Pantalla Auditoría">
      <Text style={styles.title}>Auditoría</Text>
      <Text style={styles.subtitle}>Lista de auditorías y detalles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 8, color: '#475569' },
});
