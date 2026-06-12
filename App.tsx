import React from 'react';
import { StatusBar, StyleSheet, View, Platform } from 'react-native';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/presentation/themes/ThemeContext';

function AppShell() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.surface }, Platform.OS === 'web' ? styles.rootWeb : undefined]}>
      <StatusBar barStyle={colors.textPrimary === '#0F1724' ? 'dark-content' : 'light-content'} />
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
