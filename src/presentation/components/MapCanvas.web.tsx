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
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('street');
  const [toast, setToast] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(12);
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
  // NOTE: The map container div is always rendered (even when items is empty)
  // so mapContainerRef.current should always be available when this effect runs.
  // The initMap function also checks for null as a safety net.
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    // Wait for container to have non-zero dimensions before initializing.
    // react-native-web may not apply layout immediately on first paint.
    const initMap = () => {
      const container = mapContainerRef.current;
      if (!container || cancelled) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Retry after a frame if dimensions are not ready yet
        requestAnimationFrame(initMap);
        return;
      }

      import('@maptiler/sdk').then(({ Map: MapTilerMap, config, MapStyle }) => {
        if (cancelled) return;

        // Validate API key before attempting to create the map
        if (!MAPTILER_CONFIG.apiKey || MAPTILER_CONFIG.apiKey === 'YOUR_MAPTILER_API_KEY_HERE') {
          setMapLoadError('API key de MapTiler no configurada. Verifica las variables de entorno.');
          return;
        }

        config.apiKey = MAPTILER_CONFIG.apiKey;

        if (!mapInstanceRef.current) {
          const initialCenter = items.length > 0
            ? [items[0].lon, items[0].lat]
            : [-122.42, 37.77];

          try {
            mapInstanceRef.current = new MapTilerMap({
              container: container,
              style: MapStyle.STREETS,
              zoom: 12,
              center: initialCenter,
              maxZoom: MAPTILER_CONFIG.maxZoom,
            });

            mapInstanceRef.current.on('load', () => {
              if (!cancelled) {
                setMapReady(true);
                setCurrentZoom(mapInstanceRef.current.getZoom());
              }
            });

            // Track zoom changes
            mapInstanceRef.current.on('zoom', () => {
              if (!cancelled && mapInstanceRef.current) {
                setCurrentZoom(mapInstanceRef.current.getZoom());
              }
            });

            mapInstanceRef.current.on('zoomend', () => {
              if (!cancelled && mapInstanceRef.current) {
                setCurrentZoom(mapInstanceRef.current.getZoom());
              }
            });

            // Listen for style errors (tiles failing to load)
            mapInstanceRef.current.on('error', (e: any) => {
              console.warn('[MapCanvas] Map error:', e?.error?.message || e);
            });

            // Observe container resizes so the canvas can adjust via map.resize()
            if (typeof ResizeObserver !== 'undefined') {
              resizeObserver = new ResizeObserver(() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.resize();
                }
              });
              resizeObserver.observe(container);
            }
          } catch (initError) {
            console.error('[MapCanvas] Map initialization failed:', initError);
            setMapLoadError('Error al inicializar el mapa. Verifica la API key y la conexión.');
          }
        }
      }).catch((error) => {
        if (!cancelled) {
          console.error('[MapCanvas] Failed to load MapTiler SDK:', error);
          setMapLoadError('No se pudo cargar el SDK de MapTiler. Verifica la instalación de @maptiler/sdk.');
        }
      });
    };

    // Defer initialization to ensure react-native-web layout is applied
    const rafId = requestAnimationFrame(() => {
      setTimeout(initMap, 100);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
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

  // When items load for the first time and no selection exists, center on data
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || items.length === 0) return;
    if (selectedId) return; // already handled by selection effect

    import('@maptiler/sdk').then(({ LngLatBounds }) => {
      const bounds = new LngLatBounds(
        [Math.min(...items.map(i => i.lon)), Math.min(...items.map(i => i.lat))],
        [Math.max(...items.map(i => i.lon)), Math.max(...items.map(i => i.lat))]
      );
      mapInstanceRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16,
        duration: 1000,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, mapReady]);

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

  // Compute the map container height from style prop or default
  const mapHeight = (style as any)?.height || 470;

  return (
    <View style={[styles.wrapper, style && { borderRadius: (style as any).borderRadius }]} accessibilityLabel="Mapa de auditorías">
      {mapLoadError ? (
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar el mapa</Text>
          <Text style={styles.errorMessage}>{mapLoadError}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar carga del mapa"
            onPress={() => {
              setMapLoadError(null);
              setMapReady(false);
              // Force re-initialization by triggering a re-render
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Toolbar: only shown when there are items to interact with */}
          {items.length > 0 && (
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
          )}

          {/*
            CRITICAL: The map container div is ALWAYS rendered, even when items is empty.
            This ensures the useEffect initialization finds the ref in the DOM on mount.
            Previously, the div was conditionally rendered (only when items.length > 0),
            causing a race condition where the init effect ran before the div existed.
          */}
          <View style={styles.mapArea}>
            {/*
              CRITICAL: Use a plain <div> for the map container instead of <View>.
              react-native-web's <View> applies overflow:hidden and flexbox styles
              that can clip or collapse the WebGL canvas created by MapLibre GL.
              A native <div> with explicit CSS ensures the map canvas renders correctly.
            */}
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: `${mapHeight}px`,
                position: 'relative',
                backgroundColor: '#e2e8f0',
              }}
            />

            {/* Loading overlay: shown while the map tiles are loading */}
            {!mapReady && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="small" color="#1e40af" />
                <Text style={styles.loadingText}>Cargando mapa…</Text>
              </View>
            )}

            {/* Empty state overlay: shown when map is ready but no items to display */}
            {items.length === 0 && mapReady && (
              <View style={styles.emptyStateOverlay} pointerEvents="none">
                <Text style={styles.emptyText}>No hay puntos para mostrar</Text>
              </View>
            )}

            {/* Zoom indicator */}
            {mapReady && (
              <View style={styles.zoomIndicator} pointerEvents="none">
                <Text style={styles.zoomText} accessibilityLabel={`Zoom nivel ${currentZoom.toFixed(1)}`}>
                  {currentZoom.toFixed(1)}×
                </Text>
              </View>
            )}
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    width: '100%',
    minWidth: 0,
    // NOTE: overflow is intentionally NOT set to 'hidden' here.
    // overflow:'hidden' clips the WebGL canvas created by MapLibre GL,
    // causing the map tiles to be invisible even though the container
    // has the correct dimensions.
  },
  mapArea: {
    position: 'relative',
    // This wrapper positions the map container and overlays relative to each other.
    // The map container div is a child with explicit height, and overlays are
    // positioned absolutely within this area.
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 10,
  },
  loadingText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyStateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    zIndex: 10,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
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
  errorState: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
  },
  zoomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});