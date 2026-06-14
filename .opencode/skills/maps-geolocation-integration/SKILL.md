---
name: maps-geolocation-integration
description: Integrates maps, geolocation, and location-based features with cross-platform support for React Native apps.
license: MIT
compatibility: opencode
---
# Integración de Mapas y Geolocalización

## Propósito
Instruir al agente en la implementación de features basadas en ubicación: mapas con `react-native-maps`, geolocation con `react-native-geolocation-service`, permisos de ubicación, y rendering de markers/clusters en React Native cross-platform.

## Cuándo usarlo
- Al implementar pantallas con mapas (Mostrar ubicaciones en un mapa).
- Cuando se necesita obtener la ubicación actual del usuario.
- Al configurar permisos de geolocalización para iOS (Info.plist) y Android (AndroidManifest).
- Cuando se implementan markers, clusters, o interacción con puntos en mapas.
- Al integrar mapas web con `react-leaflet` (para la versión Vite/web).
- Para resolver problemas de permisos oprecisión de ubicación.

## Cómo usarlo
1. Usar `react-native-maps` para mapas native (iOS/Android).
2. Para web, usar `react-leaflet` con Leaflet (ya integrado en el proyecto).
3. Para geolocalización, usar `react-native-geolocation-service` (más fiable que la API nativa).
4. Manejar permisos con `react-native-permissions` (ya en el proyecto).
5. Obtener permisos ANTES de solicitar ubicación; nunca asumir que ya están otorgados.
6. Para clusters en mapas, usar `react-native-maps-clustering` o similar.
7. Mantener la lógica de ubicación en `src/infrastructure/locationService.ts`.

## Ejemplos

### Caso 1: Obtener ubicación actual
```ts
// ✓ Correcto: con manejo de permisos y errores
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS } from 'react-native-permissions';

const getCurrentLocation = async (): Promise<Coords> => {
  const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  if (result !== 'granted') {
    const reqResult = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (reqResult !== 'granted') throw new Error('Location permission denied');
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
```

### Caso 2: Renderizar mapa con marker
```tsx
// ✓ Correcto: mapa con marker
import MapView, { Marker } from 'react-native-maps';

const MapScreen = () => {
  const [region, setRegion] = useState({
    latitude: -34.6037,
    longitude: -58.3816,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  return (
    <MapView style={styles.map} region={region}>
      <Marker coordinate={{ latitude: -34.6037, longitude: -58.3816 }} title="Ubicación" />
    </MapView>
  );
};
```

### Caso 3: Permisos Info.plist (iOS)
```xml
<!-- ✓ Correcto: clave requerida en Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>BeanAuditor necesita tu ubicación para mostrar puntos cercanos.</string>
```

## Integración con el agente
El agente @frontend-agent debe cargar este skill automáticamente cuando:
- La tarea involucre palabras como: "mapa", "ubicación", "geolocalización", "GPS", "marker", "coordenadas", "permisos de ubicación".
- Se implementen pantallas con mapas o tracking de ubicación.
- Se necesite configurar permisos de ubicación en iOS/Android.
- Se trabaje con datos de ubicación del usuario.