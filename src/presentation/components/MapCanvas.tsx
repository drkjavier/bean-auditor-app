import React from 'react';
import { Platform } from 'react-native';
import { logEvent } from '../../infrastructure/telemetry';

// Platform proxy: web -> MapCanvas.web.tsx, native -> MapCanvas.native.tsx (if available)
// This file exports the appropriate implementation based on Platform.OS.

let Impl: any;
if (Platform.OS === 'web') {
  // Web implementation is provided in MapCanvas.web.tsx
  // Use require to keep bundlers happy
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Impl = require('./MapCanvas.web').default;
} else {
  try {
    // Native implementation (may not exist until we add react-native-maps)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Impl = require('./MapCanvas.native').default;
  } catch (e) {
    // If native implementation fails to load (missing native lib or module),
    // fall back to a simple list UI but warn so developers can detect the
    // misconfiguration quickly in the Metro console / device logs.
    // Keep inline to avoid adding another module.
    // DEV-only warning to avoid leaking internal errors in production
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('MapCanvas.native failed to load, falling back to MapCanvas.fallback. Error:', e && e.message ? e.message : e);
    }
    try {
      // Send only a safe telemetry event (no raw error messages)
      logEvent('map_load_failed', { platform: Platform.OS });
    } catch (_) {}
    const Fallback = require('./MapCanvas.fallback').default; // will be created dynamically below
    // create a thin wrapper so we can pass the load error to the fallback for
    // improved developer guidance while keeping the original fallback API.
    // pass a generic mapLoadError to the fallback for developer guidance
    Impl = (props: any) => React.createElement(Fallback, { ...props, mapLoadError: __DEV__ ? (e && e.message ? e.message : String(e)) : null });
  }
}

export default function MapCanvas(props: any) {
  return <Impl {...props} />;
}
