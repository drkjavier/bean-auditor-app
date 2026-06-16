/**
 * MapCanvas Component (Web)
 * 
 * Web implementation using MapTiler SDK JS.
 * Provides high-precision mapping with zoom up to level 22 (3.7cm/pixel).
 * 
 * Features:
 * - High-precision zoom (up to level 22)
 * - Custom colored markers
 * - Popups with detailed information
 * - Legend by audit status
 * - Center on user location
 * - Fit all markers view
 * - Street/Satellite/Hybrid toggle
 * - Marker selection with visual feedback
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MAPTILER_CONFIG } from '../../infrastructure/config/maptiler.config';
import type { Tag } from '../../data/mocks/tagsMock';
import type { AuditStatus } from '../../domain/audit/AuditRecord';
import { NAV_BAR_HEIGHT } from '../themes/layout';
import '@maptiler/sdk/dist/maptiler-sdk.css';

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
  const insetsBottom = typeof window !== 'undefined' 
    ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0') || 0 
    : 0;
  
  const [mapReady, setMapReady] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
  const [toast, setToast] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const toastTimer = useRef<number | null>(null);

  const selectedItem = selectedId ? items.find(item => item.unique_id === selectedId) ?? null : null;

  function showToast(message: string, ms = 3000) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }

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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    import('@maptiler/sdk').then(({ Map: MapTilerMap, config, MapStyle }) => {
      config.apiKey = MAPTILER_CONFIG.apiKey;

      if (!mapInstanceRef.current) {
        const initialCenter = items.length > 0 
          ? [items[0].lon, items[0].lat] 
          : [-122.42, 37.77];

        mapInstanceRef.current = new MapTilerMap({
          container: mapContainerRef.current,
          style: MapStyle.SATELLITE,
          zoom: 12,
          center: initialCenter,
          maxZoom: MAPTILER_CONFIG.maxZoom,
        });

        mapInstanceRef.current.on('load', () => {
          setMapReady(true);
        });
      }
    }).catch((error) => {
      console.error('Failed to load MapTiler SDK:', error);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add/update markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    import('@maptiler/sdk').then(({ Marker, Popup }) => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      items.forEach((item) => {
        const isSelected = selectedItem?.uuid === item.uuid;
        
        const marker = new Marker({
          color: item.colorHex,
          scale: isSelected ? 1.3 : 1,
        })
          .setLngLat([item.lon, item.lat])
          .setPopup(
            new Popup().setHTML(`
              <div style="max-width: 300px; font-family: system-ui, sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="width: 12px; height: 12px; border-radius: 999px; background-color: ${item.colorHex}; display: inline-block; margin-right: 8px;"></span>
                  <strong style="color: #0f172a; font-size: 14px;">${item.unique_id}</strong>
                </div>
                <div style="color: #475569; font-size: 12px; margin-bottom: 6px;">
                  Auditoría: <strong style="color: #0f172a;">${getAuditStatusLabel(item.audit_status)}</strong>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
                  <div>
                    <div style="color: #64748b;">UUID</div>
                    <div style="color: #0f172a; font-weight: 600;">${item.uuid}</div>
                  </div>
                  <div>
                    <div style="color: #64748b;">Color</div>
                    <div style="color: #0f172a; font-weight: 600;">${item.colorHex}</div>
                  </div>
                  <div>
                    <div style="color: #64748b;">Lat</div>
                    <div style="color: #0f172a; font-weight: 600;">${item.lat.toFixed(6)}</div>
                  </div>
                  <div>
                    <div style="color: #64748b;">Lon</div>
                    <div style="color: #0f172a; font-weight: 600;">${item.lon.toFixed(6)}</div>
                  </div>
                </div>
                <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
                  Actualizado: ${new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            `)
          )
          .addTo(mapInstanceRef.current);

        if (onSelect) {
          marker.getElement().addEventListener('click', () => {
            onSelect(item);
          });
        }

        markersRef.current.push(marker);
      });
    });
  }, [items, selectedId, mapReady]);

  // Update map style
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    import('@maptiler/sdk').then(({ MapStyle }) => {
      const styleMap = {
        street: MapStyle.STREETS,
        satellite: MapStyle.SATELLITE,
        hybrid: MapStyle.HYBRID,
      };
      mapInstanceRef.current.setStyle(styleMap[mapType]);
    });
  }, [mapType, mapReady]);

  // Center on selected item
  useEffect(() => {
    if (!selectedItem || !mapReady || !mapInstanceRef.current) return;

    mapInstanceRef.current.flyTo({
      center: [selectedItem.lon, selectedItem.lat],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 18),
      duration: 1500,
    });
  }, [selectedItem, mapReady]);

  // Get user location when showUserLocation is true
  useEffect(() => {
    if (!showUserLocation || !mapReady || !mapInstanceRef.current) return;

    if (!navigator.geolocation) {
      console.warn('Geolocation not available');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
      },
      (error) => {
        console.error('Error getting user location:', error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [showUserLocation, mapReady]);

  // Add/update user location marker
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !userLocation) return;

    import('@maptiler/sdk').then(({ Marker }) => {
      // Remove existing user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
      }

      // Add new user location marker
      const element = document.createElement('div');
      element.style.width = '20px';
      element.style.height = '20px';
      element.style.borderRadius = '50%';
      element.style.backgroundColor = '#4285F4';
      element.style.border = '3px solid white';
      element.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

      userLocationMarkerRef.current = new Marker({ element })
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(mapInstanceRef.current);
    });

    return () => {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
    };
  }, [userLocation, mapReady]);

  const handleCenterOnMe = () => {
    if (!navigator.geolocation) {
      showToast('La geolocalización no está disponible');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 1500,
          });
        }
      },
      (error) => {
        console.error('Error al obtener ubicación:', error);
        showToast('No se pudo obtener tu ubicación');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || items.length === 0) return;

    import('@maptiler/sdk').then(({ LngLatBounds }) => {
      const bounds = new LngLatBounds(
        [Math.min(...items.map(i => i.lon)), Math.min(...items.map(i => i.lat))],
        [Math.max(...items.map(i => i.lon)), Math.max(...items.map(i => i.lat))]
      );

      mapInstanceRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 18,
        duration: 1500,
      });
    });
  };

  const handleCenterSelection = () => {
    if (!selectedItem || !mapInstanceRef.current) return;

    mapInstanceRef.current.flyTo({
      center: [selectedItem.lon, selectedItem.lat],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 18),
      duration: 1500,
    });
  };

  return (
    <View style={[styles.wrapper, style && { borderRadius: (style as any).borderRadius }]} accessibilityLabel="Mapa de auditorías">
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

          <View style={[styles.mapContainer, style && { height: (style as any).height || 470 }]}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          </View>

          {toast ? (
            <View
              style={[styles.toast, { bottom: (insetsBottom || 0) + NAV_BAR_HEIGHT + 14, zIndex: 1200 }]}
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}
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
    height: 470,
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
  toast: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -150 } as any],
    bottom: 14,
    width: 300,
    backgroundColor: 'rgba(15,23,42,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
  },
  emptyState: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
  },
});
