import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import { useAuthStore } from '../../stores';

// Lightweight navigator for web/native without react-navigation to avoid
// dependency pre-bundling issues on Vite development server.
export default function AppNavigator() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const isRestoring = useAuthStore(state => state.isRestoring);

  useEffect(() => {
    // Attempt to restore session once on mount. Use getState to avoid
    // selecting function references in the render selector. Await the
    // promise explicitly to avoid an unobserved promise that might trigger
    // worker/runner warnings in some environments.
    const run = async () => {
      try {
        await useAuthStore.getState().restoreSession();
      } catch (err) {
        // swallow errors here; restoreSession already sets state on failure
        // but ensure any unexpected errors are logged for debugging.
        // eslint-disable-next-line no-console
        console.warn('restoreSession failed in AppNavigator', err?.message || err);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRestoring) {
    return (
      <View style={styles.center} accessibilityLabel="Restaurando sesión" accessibilityRole="status">
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Restaurando sesión...</Text>
      </View>
    );
  }

  return <View style={{ flex: 1 }}>{isLoggedIn ? <MainScreen /> : <LoginScreen />}</View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { marginTop: 12, color: '#475569' },
});
