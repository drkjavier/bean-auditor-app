/**
 * MapTiler Prototype Component (Proxy)
 * 
 * Platform-aware loader that selects the appropriate implementation:
 * - Web: MapTilerPrototype.web.tsx (MapTiler SDK JS)
 * - Native: MapTilerPrototype.native.tsx (MapLibre React Native)
 */

import React from 'react';
import { Platform } from 'react-native';
import type { Tag } from '../../data/mocks/tagsMock';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
};

let MapTilerPrototypeComponent: React.ComponentType<Props>;

if (Platform.OS === 'web') {
  // Web implementation using MapTiler SDK JS
  MapTilerPrototypeComponent = require('./MapTilerPrototype.web').default;
} else {
  // Native implementation using MapLibre React Native
  MapTilerPrototypeComponent = require('./MapTilerPrototype.native').default;
}

export default function MapTilerPrototype(props: Props) {
  return <MapTilerPrototypeComponent {...props} />;
}
