/**
 * MapCanvas Component (Native)
 * 
 * Native implementation using MapLibre React Native.
 * Provides high-precision mapping with zoom up to level 22 (3.7cm/pixel).
 * 
 * Features:
 * - High-precision zoom (up to level 22)
 * - Custom colored markers
 * - Legend by audit status
 * - Center on user location
 * - Fit all markers view
 * - Street/Satellite/Hybrid toggle
 * - Marker selection with visual feedback
 * - Navigation mode with directional arrow overlay
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MAPTILER_CONFIG, getMapLibreStyle } from '../../infrastructure/config/maptiler.config';
import type { Tag } from '../../data/tagService';
import * as locationService from '../../infrastructure/locationService';
import { RESULTS } from 'react-native-permissions';
import NavigationArrow from './NavigationArrow';
import { useTheme } from '../themes/ThemeContext';
import {
  getNavigationZoom,
  getUserFollowZoom,
  shouldFollowUser,
} from '../../domain/farm/navigationCamera';

/**
 * Map-specific brand constant: white ring around data markers so they stay
 * readable on both light and dark map styles. Not a theme token on purpose.
 */
const MARKER_STROKE_COLOR = '#ffffff';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
  showUserLocation?: boolean;
  /** Modo navegación activo */
  isNavigationActive?: boolean;
  /** Tag destino de navegación */
  navigationTarget?: Tag | null;
  /** UUID del tag más cercano pendiente (para resaltarlo en el mapa) */
  nearestTagId?: string | null;
  /** Distancia al destino en metros */
  distanceToTarget?: number | null;
  /** Bearing al destino en grados */
  bearingToTarget?: number | null;
  /** Callback al presionar la flecha de navegación */
  onNavigationPress?: () => void;
  /** Live user position from navigationStore (Waze-like follow) */
  userPosition?: { lat: number; lon: number } | null;
};

export default function MapCanvas({
  items,
  style,
  selectedId,
  showUserLocation = false,
  isNavigationActive = false,
  navigationTarget = null,
  nearestTagId = null,
  distanceToTarget = null,
  bearingToTarget = null,
  onNavigationPress,
  userPosition = null,
}: Props) {
  const { colors } = useTheme();
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
  const [MapLibreModule, setMapLibreModule] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<any>(null);
  const lastFollowRef = useRef<{ at: number; pos: { lat: number; lon: number } | null }>({
    at: 0,
    pos: null,
  });
  const lastTargetUuidRef = useRef<string | null>(null);

  const selectedItem = selectedId ? items.find(item => item.unique_id === selectedId) ?? null : null;

  // In navigation mode use live store position; otherwise fall back to Settings one-shot.
  const displayUserLocation = isNavigationActive && userPosition ? userPosition : userLocation;
  const showUserMarker = isNavigationActive
    ? userPosition != null
    : showUserLocation && userLocation != null;

  useEffect(() => {
    import('@maplibre/maplibre-react-native').then((module) => {
      setMapLibreModule(module);
    }).catch((error) => {
      console.error('Failed to load MapLibre React Native:', error);
    });
  }, []);

  // Get user location when showUserLocation is true (non-navigation mode)
  useEffect(() => {
    if (isNavigationActive || !showUserLocation || !mapReady) return;

    const getUserLocation = async () => {
      try {
        const status = await locationService.checkPermission();

        if (status === RESULTS.GRANTED) {
          locationService.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ lat: latitude, lon: longitude });
            },
            (error) => {
              console.error('Error getting user location:', error);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else if (status === RESULTS.DENIED) {
          const requestStatus = await locationService.requestPermission();
          if (requestStatus === RESULTS.GRANTED) {
            getUserLocation();
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };

    getUserLocation();
  }, [showUserLocation, mapReady, isNavigationActive]);

  // Waze-like camera: follow user at max zoom; recenter only when destination tag changes
  useEffect(() => {
    if (!isNavigationActive || !mapReady || !mapRef.current) return;

    const targetZoom = getNavigationZoom(distanceToTarget);
    const userZoom = getUserFollowZoom(MAPTILER_CONFIG.maxZoom);
    const previousTargetUuid = lastTargetUuidRef.current;

    if (navigationTarget && navigationTarget.uuid !== previousTargetUuid) {
      lastTargetUuidRef.current = navigationTarget.uuid;

      // Destination changed mid-session → recenter on the new tag
      if (previousTargetUuid != null) {
        lastFollowRef.current = { at: Date.now(), pos: userPosition };
        mapRef.current.flyTo([navigationTarget.lon, navigationTarget.lat], targetZoom, 1200);
        return;
      }
      // First target of the session: prefer following the user if we have a position
    }

    if (!userPosition) return;

    const now = Date.now();
    const shouldFollow = shouldFollowUser({
      lastFollowAt: lastFollowRef.current.at || null,
      lastFollowPosition: lastFollowRef.current.pos,
      currentPosition: userPosition,
      now,
    });

    if (!shouldFollow) return;

    lastFollowRef.current = { at: now, pos: userPosition };
    // Center on user with maximum zoom (field detail)
    mapRef.current.flyTo([userPosition.lon, userPosition.lat], userZoom, 900);
  }, [isNavigationActive, mapReady, userPosition, navigationTarget, distanceToTarget]);

  // Reset target ref when navigation stops so the next session recenters
  useEffect(() => {
    if (!isNavigationActive) {
      lastTargetUuidRef.current = null;
      lastFollowRef.current = { at: 0, pos: null };
    }
  }, [isNavigationActive]);

  const handleFitAll = () => {
    if (!mapRef.current || items.length === 0) return;

    const minLat = Math.min(...items.map(i => i.lat));
    const maxLat = Math.max(...items.map(i => i.lat));
    const minLon = Math.min(...items.map(i => i.lon));
    const maxLon = Math.max(...items.map(i => i.lon));

    const bounds = [
      [minLon, minLat],
      [maxLon, maxLat],
    ];

    mapRef.current.fitBounds(bounds, bounds, 50, 1500);
  };

  const handleCenterSelection = () => {
    if (!selectedItem || !mapRef.current) return;

    mapRef.current.flyTo([selectedItem.lon, selectedItem.lat], 18, 1500);
  };

  if (!MapLibreModule) {
    return (
      <View style={[styles.wrapper, style, styles.loadingContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando mapa...</Text>
      </View>
    );
  }

  const { MapView, ShapeSource, CircleLayer } = MapLibreModule;
  const mapStyle = getMapLibreStyle(mapType);

  return (
    <View
      style={[styles.wrapper, style && { borderRadius: (style as any).borderRadius }, { borderColor: colors.border, backgroundColor: colors.card }]}
      accessibilityLabel="Mapa de auditorías"
    >
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay puntos para mostrar</Text>
        </View>
      ) : (
        <>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={styles.actions}>
              {selectedItem ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Centrar selección"
                  onPress={handleCenterSelection}
                  style={[styles.mapToggleButton, styles.actionInlineButton]}
                >
                  <Text style={[styles.mapToggleButtonText, { color: colors.primary }]}>Centrar</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver todos"
                onPress={handleFitAll}
                style={[styles.mapToggleButton, styles.actionInlineButton]}
              >
                <Text style={[styles.mapToggleButtonText, { color: colors.primary }]}>Ver todos</Text>
              </Pressable>

              <View style={{ width: 6 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vista Street"
                accessibilityState={{ pressed: mapType === 'street' }}
                onPress={() => setMapType('street')}
                style={[
                  styles.mapToggleButton,
                  styles.mapTypeToggleButton,
                  mapType === 'street'
                    ? [styles.mapToggleButtonActive, { backgroundColor: colors.primary, borderColor: colors.primaryVariant }]
                    : undefined,
                ]}
              >
                <Text style={[styles.mapToggleButtonText, { color: colors.primary }, mapType === 'street' ? { color: colors.textButton } : undefined]}>Street</Text>
              </Pressable>

              <View style={{ width: 6 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vista Satellite"
                accessibilityState={{ pressed: mapType === 'satellite' }}
                onPress={() => setMapType('satellite')}
                style={[
                  styles.mapToggleButton,
                  styles.mapTypeToggleButton,
                  mapType === 'satellite'
                    ? [styles.mapToggleButtonActive, { backgroundColor: colors.primary, borderColor: colors.primaryVariant }]
                    : undefined,
                ]}
              >
                <Text style={[styles.mapToggleButtonText, { color: colors.primary }, mapType === 'satellite' ? { color: colors.textButton } : undefined]}>Satellite</Text>
              </Pressable>

              <View style={{ width: 6 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vista Hybrid"
                accessibilityState={{ pressed: mapType === 'hybrid' }}
                onPress={() => setMapType('hybrid')}
                style={[
                  styles.mapToggleButton,
                  styles.mapTypeToggleButton,
                  mapType === 'hybrid'
                    ? [styles.mapToggleButtonActive, { backgroundColor: colors.primary, borderColor: colors.primaryVariant }]
                    : undefined,
                ]}
              >
                <Text style={[styles.mapToggleButtonText, { color: colors.primary }, mapType === 'hybrid' ? { color: colors.textButton } : undefined]}>Hybrid</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.mapContainer, style && { height: (style as any).height || 470 }]}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              mapStyle={mapStyle}
              zoomLevel={12}
              centerCoordinate={items.length > 0 ? [items[0].lon, items[0].lat] : [-122.42, 37.77]}
              maxZoomLevel={MAPTILER_CONFIG.maxZoom}
              minZoomLevel={MAPTILER_CONFIG.minZoom}
              onDidFinishLoadingMap={() => setMapReady(true)}
            >
              <ShapeSource
                id="markers"
                shape={{
                  type: 'FeatureCollection',
                  features: items.map((item) => ({
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [item.lon, item.lat],
                    },
                    properties: {
                      id: item.uuid,
                      color: item.colorHex,
                      isSelected: selectedItem?.uuid === item.uuid,
                      isNearest: nearestTagId === item.uuid,
                    },
                  })),
                }}
              >
                <CircleLayer
                  id="markers-circle"
                  style={{
                    circleRadius: [
                      'case',
                      ['boolean', ['get', 'isNearest'], false],
                      14,
                      ['boolean', ['get', 'isSelected'], false],
                      13,
                      10,
                    ],
                    circleColor: ['get', 'color'],
                    circleStrokeWidth: [
                      'case',
                      ['boolean', ['get', 'isNearest'], false],
                      5,
                      ['boolean', ['get', 'isSelected'], false],
                      4,
                      2,
                    ],
                    circleStrokeColor: [
                      'case',
                      ['boolean', ['get', 'isNearest'], false],
                      colors.warning,
                      MARKER_STROKE_COLOR,
                    ],
                  }}
                />
              </ShapeSource>

              {/* User Location Marker */}
              {showUserMarker && displayUserLocation && (
                <ShapeSource
                  id="user-location"
                  shape={{
                    type: 'FeatureCollection',
                    features: [
                      {
                        type: 'Feature',
                        geometry: {
                          type: 'Point',
                          coordinates: [displayUserLocation.lon, displayUserLocation.lat],
                        },
                        properties: {},
                      },
                    ],
                  }}
                >
                  <CircleLayer
                    id="user-location-circle"
                    style={{
                      circleRadius: 10,
                      circleColor: colors.primary,
                      circleStrokeWidth: 3,
                      circleStrokeColor: MARKER_STROKE_COLOR,
                    }}
                  />
                </ShapeSource>
              )}
            </MapView>

            {/* Navigation Arrow Overlay */}
            {isNavigationActive && navigationTarget && distanceToTarget !== null && bearingToTarget !== null && (
              <View style={styles.navigationOverlay} pointerEvents="box-none">
                <NavigationArrow
                  bearing={bearingToTarget}
                  distance={distanceToTarget}
                  tagId={navigationTarget.unique_id}
                  tagStatus={navigationTarget.audit_status}
                  visible={true}
                  onPress={onNavigationPress}
                />
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
    minWidth: 0,
  },
  mapContainer: {
    width: '100%',
    height: 470,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTypeToggleButton: {
    width: 76,
    flexShrink: 0,
  },
  mapToggleButtonActive: {},
  mapToggleButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  mapToggleButtonTextActive: {},
  actionInlineButton: {
    marginRight: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  locationButton: {},
  providerInfo: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  emptyState: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {},
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
