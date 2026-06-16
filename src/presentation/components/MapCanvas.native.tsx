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
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MAPTILER_CONFIG, getMapLibreStyle } from '../../infrastructure/config/maptiler.config';
import type { Tag } from '../../data/mocks/tagsMock';
import type { AuditStatus } from '../../domain/audit/AuditRecord';
import * as locationService from '../../infrastructure/locationService';
import { RESULTS } from 'react-native-permissions';
import { NAV_BAR_HEIGHT } from '../themes/layout';

function getAuditStatusLabel(status: AuditStatus | null | undefined) {
  switch (status) {
    case 'audited':
      return 'Auditado';
    case 'not_audited':
      return 'No auditado';
    case 'pending':
      return 'Pendiente';
    default:
      return 'Sin auditar';
  }
}

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
  showUserLocation?: boolean;
};

export default function MapCanvas({ items, style, selectedId, onSelect, showUserLocation = false }: Props) {
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
  const [MapLibreModule, setMapLibreModule] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<any>(null);

  const selectedItem = selectedId ? items.find(item => item.unique_id === selectedId) ?? null : null;

  const legendItems = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      const label = getAuditStatusLabel(item.audit_status);
      if (!map.has(label)) {
        map.set(label, item.colorHex);
      }
    });
    return Array.from(map.entries()).map(([label, color]) => ({ label, color }));
  }, [items]);

  useEffect(() => {
    import('@maplibre/maplibre-react-native').then((module) => {
      setMapLibreModule(module);
    }).catch((error) => {
      console.error('Failed to load MapLibre React Native:', error);
    });
  }, []);

  // Get user location when showUserLocation is true
  useEffect(() => {
    if (!showUserLocation || !mapReady) return;

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
  }, [showUserLocation, mapReady]);

  const handleCenterOnMe = async () => {
    try {
      const status = await locationService.checkPermission();
      
      if (status === RESULTS.GRANTED) {
        locationService.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (mapRef.current) {
              mapRef.current.flyTo([longitude, latitude], 18, 1500);
            }
          },
          (error) => {
            console.error('Error al obtener ubicación:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación');
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else if (status === RESULTS.DENIED) {
        const requestStatus = await locationService.requestPermission();
        if (requestStatus === RESULTS.GRANTED) {
          handleCenterOnMe();
        } else {
          Alert.alert('Permiso denegado', 'Necesitamos permiso de ubicación');
        }
      } else {
        Alert.alert('Permiso requerido', 'Por favor, habilita el permiso de ubicación');
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      Alert.alert('Error', 'No se pudo verificar los permisos');
    }
  };

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
      <View style={[styles.wrapper, style, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const { MapView, ShapeSource, CircleLayer } = MapLibreModule;
  const mapStyle = getMapLibreStyle(mapType);

  return (
    <View style={[styles.wrapper, style]} accessibilityLabel="Mapa de auditorías">
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay puntos para mostrar</Text>
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            <View style={styles.actions}>
              {selectedItem ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Centrar selección"
                  onPress={handleCenterSelection}
                  style={[styles.mapToggleButton, styles.actionInlineButton]}
                >
                  <Text style={styles.mapToggleButtonText}>Centrar</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver todos"
                onPress={handleFitAll}
                style={[styles.mapToggleButton, styles.actionInlineButton]}
              >
                <Text style={styles.mapToggleButtonText}>Ver todos</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mi ubicación"
                onPress={handleCenterOnMe}
                style={[styles.mapToggleButton, styles.locationButton]}
              >
                <Text style={styles.mapToggleButtonText}>📍</Text>
              </Pressable>

              <View style={{ width: 6 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vista Street"
                accessibilityState={{ pressed: mapType === 'street' }}
                onPress={() => setMapType('street')}
                style={[styles.mapToggleButton, styles.mapTypeToggleButton, mapType === 'street' ? styles.mapToggleButtonActive : undefined]}
              >
                <Text style={[styles.mapToggleButtonText, mapType === 'street' ? styles.mapToggleButtonTextActive : undefined]}>Street</Text>
              </Pressable>

              <View style={{ width: 6 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vista Satellite"
                accessibilityState={{ pressed: mapType === 'satellite' }}
                onPress={() => setMapType('satellite')}
                style={[styles.mapToggleButton, styles.mapTypeToggleButton, mapType === 'satellite' ? styles.mapToggleButtonActive : undefined]}
              >
                <Text style={[styles.mapToggleButtonText, mapType === 'satellite' ? styles.mapToggleButtonTextActive : undefined]}>Satellite</Text>
              </Pressable>

              <View style={{ width: 6 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vista Hybrid"
                accessibilityState={{ pressed: mapType === 'hybrid' }}
                onPress={() => setMapType('hybrid')}
                style={[styles.mapToggleButton, styles.mapTypeToggleButton, mapType === 'hybrid' ? styles.mapToggleButtonActive : undefined]}
              >
                <Text style={[styles.mapToggleButtonText, mapType === 'hybrid' ? styles.mapToggleButtonTextActive : undefined]}>Hybrid</Text>
              </Pressable>
            </View>
            <Text style={styles.providerInfo} accessibilityLabel={`Zoom máximo disponible ${MAPTILER_CONFIG.maxZoom}`}>
              Máx. zoom: {MAPTILER_CONFIG.maxZoom}
            </Text>
          </View>

          <View style={[styles.mapContainer, style && { height: (style as any).height || 370 }]}>
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
                    },
                  })),
                }}
              >
                <CircleLayer
                  id="markers-circle"
                  style={{
                    circleRadius: [
                      'case',
                      ['boolean', ['get', 'isSelected'], false],
                      13,
                      10,
                    ],
                    circleColor: ['get', 'color'],
                    circleStrokeWidth: [
                      'case',
                      ['boolean', ['get', 'isSelected'], false],
                      4,
                      2,
                    ],
                    circleStrokeColor: '#ffffff',
                  }}
                />
              </ShapeSource>

              {/* User Location Marker */}
              {userLocation && (
                <ShapeSource
                  id="user-location"
                  shape={{
                    type: 'FeatureCollection',
                    features: [
                      {
                        type: 'Feature',
                        geometry: {
                          type: 'Point',
                          coordinates: [userLocation.lon, userLocation.lat],
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
                      circleColor: '#4285F4',
                      circleStrokeWidth: 3,
                      circleStrokeColor: '#ffffff',
                    }}
                  />
                </ShapeSource>
              )}
            </MapView>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    width: '100%',
    minWidth: 0,
  },
  mapContainer: {
    width: '100%',
    height: 490,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    color: '#475569',
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
  mapToggleButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#153a8a',
  },
  mapToggleButtonText: {
    color: '#1e40af',
    fontWeight: '700',
    fontSize: 12,
  },
  mapToggleButtonTextActive: {
    color: '#fff',
  },
  actionInlineButton: {
    marginRight: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  locationButton: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  providerInfo: {
    color: '#64748b',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  emptyState: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
});
