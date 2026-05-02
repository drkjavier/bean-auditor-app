import React from 'react';
import { Platform } from 'react-native';

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
    // Fallback to the simple non-interactive list implementation contained in this file
    // Keep inline to avoid adding another module.
    const Fallback = require('./MapCanvas.fallback').default; // will be created dynamically below
    Impl = Fallback;
  }
}

export default function MapCanvas(props: any) {
  return <Impl {...props} />;
}
