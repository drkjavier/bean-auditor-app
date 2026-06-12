import React from 'react';
import { View } from 'react-native';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';

const MAX_MAP_ZOOM = 21;

// Simple test component to render two markers ~1m apart for visual verification.
// Uses static ESM imports for Vite/web compatibility.
export default function MapZoomTest() {
  // base coords near project sample
  const baseLat = 14.283333;
  const baseLon = -91.366667;

  // offset ~1 meter in degrees (approx 1m ~= 1/111320 deg ≈ 8.983e-06; but we use a conservative offset)
  const offsetDeg = 0.000009; // ≈ 1m

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
