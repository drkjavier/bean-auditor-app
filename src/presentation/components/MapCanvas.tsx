import React, { useState, useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { logEvent } from '../../infrastructure/telemetry';

/**
 * Platform-aware MapCanvas loader.
 *
 * On web, Vite resolves `MapCanvas.web.tsx` automatically via extension
 * aliases, so this file is never loaded in the browser. On native (Metro),
 * this module dynamically loads the native implementation with a fallback.
 *
 * Uses dynamic require() inside functions (not at module level) so the code
 * path is only executed on native where Metro supports CommonJS.
 */

type ImplType = React.ComponentType<any> | null;
let cachedImpl: ImplType = null;

function loadImpl(): ImplType {
  if (cachedImpl) return cachedImpl;

  if (Platform.OS === 'web') {
    // Should never happen on web — Vite resolves MapCanvas.web.tsx first.
    // Return a placeholder to avoid crashing if somehow loaded.
    cachedImpl = () => (
      <View style={styles.placeholder}>
        <Text>Map unavailable on web (MapCanvas.tsx loaded unexpectedly)</Text>
      </View>
    );
    return cachedImpl;
  }

  // Native: try to load the native implementation
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./MapCanvas.native');
    cachedImpl = mod.default;
    return cachedImpl;
  } catch {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('MapCanvas.native failed to load, falling back to MapCanvas.fallback.');
    }
    try {
      logEvent('map_load_failed', { platform: Platform.OS });
    } catch {
      // ignore telemetry errors
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Fallback = require('./MapCanvas.fallback').default;
      cachedImpl = (props: any) =>
        React.createElement(Fallback, props);
      return cachedImpl;
    } catch {
      // Ultimate fallback: show error text
      cachedImpl = () => (
        <View style={styles.placeholder}>
          <Text>Map failed to load</Text>
        </View>
      );
      return cachedImpl;
    }
  }
}

export default function MapCanvas(props: any) {
  const [Impl, setImpl] = useState<ImplType>(null);

  useEffect(() => {
    setImpl(loadImpl());
  }, []);

  if (!Impl) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading map…</Text>
      </View>
    );
  }

  return <Impl {...props} />;
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  loadingText: { marginTop: 8, color: '#64748b' },
});
