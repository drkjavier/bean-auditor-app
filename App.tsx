import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, Platform } from 'react-native';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/presentation/themes/ThemeContext';
import { useSettingsStore } from './src/state/settingsStore';

function AppShell() {
  const { colors, isDark } = useTheme();

  // Hydrate app settings from SQLite (after legacy localStorage migration)
  useEffect(() => {
    useSettingsStore
      .getState()
      .hydrateSettings()
      .catch(err => {
        console.warn('[settings] Hydration failed at app start:', err);
      });
  }, []);
  return (
    <View style={[styles.root, { backgroundColor: colors.background }, Platform.OS === 'web' ? styles.rootWeb : undefined]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootWeb: {
    height: '100%',
  },
});
