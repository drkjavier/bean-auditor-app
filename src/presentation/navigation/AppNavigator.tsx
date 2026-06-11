import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import { useAuthStore } from '../../stores';

/** Maximum time (ms) to wait for restoreSession before showing login. */
const RESTORE_TIMEOUT_MS = 5_000;

/**
 * Lightweight navigator for web/native without react-navigation to avoid
 * dependency pre-bundling issues on Vite development server.
 *
 * On mount it attempts to restore the previous session. If the restore
 * takes longer than {@link RESTORE_TIMEOUT_MS} or throws, the login
 * screen is shown so the user is never stuck on a loading spinner.
 */
export default function AppNavigator() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const isRestoring = useAuthStore(state => state.isRestoring);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const store = useAuthStore.getState();
      // Safety net: if restoreSession hasn't finished after the timeout,
      // force isRestoring to false so the login screen is shown.
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          useAuthStore.setState({ isRestoring: false });
        }
      }, RESTORE_TIMEOUT_MS);

      try {
        await store.restoreSession();
      } catch (err) {
        // restoreSession already sets state on failure, but ensure
        // any unexpected error is logged and state is reset.
        // eslint-disable-next-line no-console
        console.warn('restoreSession failed in AppNavigator', err?.message || err);
        if (!cancelled) {
          useAuthStore.setState({ isRestoring: false });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRestoring) {
    return (
      <View style={styles.center} accessibilityLabel="Restaurando sesión" accessibilityRole="text">
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Restaurando sesión...</Text>
      </View>
    );
  }

  return <View style={styles.root}>{isLoggedIn ? <MainScreen /> : <LoginScreen />}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { marginTop: 12, color: '#475569' },
});
