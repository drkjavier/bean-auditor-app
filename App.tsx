import React from 'react';
import {StatusBar, StyleSheet, View, Platform} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/presentation/navigation/AppNavigator';

export default function App() {
  return (
    <View style={[styles.root, Platform.OS === 'web' ? styles.rootWeb : undefined]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  rootWeb: {
    minHeight: '100vh',
  },
});
