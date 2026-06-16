/**
 * MapTiler Prototype Component (Proxy)
 * 
 * Platform-aware loader that selects the appropriate implementation:
 * - Web: MapTilerPrototype.web.tsx (MapTiler SDK JS)
 * - Native: MapTilerPrototype.native.tsx (MapLibre React Native)
 */

import { Platform } from 'react-native';

let MapTilerPrototype: any;

if (Platform.OS === 'web') {
  // Web implementation using MapTiler SDK JS
  MapTilerPrototype = require('./MapTilerPrototype.web').default;
} else {
  // Native implementation using MapLibre React Native
  MapTilerPrototype = require('./MapTilerPrototype.native').default;
}

export default MapTilerPrototype;
