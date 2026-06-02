import React from 'react';
import { View, Platform } from 'react-native';

const MAX_MAP_ZOOM = 21;

// Simple test component to render two markers ~1m apart for visual verification
// This component dynamically requires react-leaflet and only attempts to render
// on web. Dynamic require is used to avoid Jest attempting to statically parse
// ESM-only modules during tests.
export default function MapZoomTest() {
  // Only render on web
  if (Platform.OS !== 'web') return null;

  // base coords near project sample
  const baseLat = 14.283333;
  const baseLon = -91.366667;

  // offset ~1 meter in degrees (approx 1m ~= 1/111320 deg ≈ 8.983e-06; but we use a conservative offset)
  const offsetDeg = 0.000009; // ≈ 1m

  let MapContainer: any = null;
  let TileLayer: any = null;
  let CircleMarker: any = null;

  try {
    // dynamic require to avoid ESM parse errors in Jest
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rl = require('react-leaflet');
    MapContainer = rl.MapContainer;
    TileLayer = rl.TileLayer;
    CircleMarker = rl.CircleMarker;
  } catch (e) {
    // If react-leaflet cannot be loaded (tests or environment), render nothing
    return null;
  }

  return (
    <View style={{ height: 300 }}>
      <MapContainer center={[baseLat, baseLon]} zoom={18} style={{ height: '100%', width: '100%' }} maxZoom={MAX_MAP_ZOOM}>
        <TileLayer url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} maxNativeZoom={19} maxZoom={MAX_MAP_ZOOM} />
        <CircleMarker center={[baseLat, baseLon]} radius={8} pathOptions={{ color: '#ff0000', fillColor: '#ff0000' }} />
        <CircleMarker center={[baseLat + offsetDeg, baseLon]} radius={8} pathOptions={{ color: '#00ff00', fillColor: '#00ff00' }} />
      </MapContainer>
    </View>
  );
}
