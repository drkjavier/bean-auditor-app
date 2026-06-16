/**
 * MapTiler Prototype Component (Web)
 * 
 * Web implementation using MapTiler SDK JS.
 * Tests zoom level 22 (3.7cm/pixel resolution) to verify 0.5m separation requirement.
 * 
 * Features:
 * - High-precision zoom (up to level 22)
 * - Marker clustering
 * - Custom colored markers
 * - Popups with detailed information
 * - Legend by audit status
 * - Center on user location
 * - Fit all markers view
 * - Street/Satellite/Hybrid toggle
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MAPTILER_CONFIG } from '../../infrastructure/config/maptiler.config';
import type { Tag } from '../../data/mocks/tagsMock';
import type { AuditStatus } from '../../domain/audit/AuditRecord';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
};

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

export default function MapTilerPrototype({ items, style, selectedId, onSelect }: Props) {
  const [zoom, setZoom] = useState(12);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const selectedItem = selectedId ? items.find(item => item.unique_id === selectedId) ?? null : null;

  // Generate legend items
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
    if (!mapContainerRef.current) return;

    // Dynamic import to avoid SSR issues
    import('@maptiler/sdk').then(({ Map: MapTilerMap, config, MapStyle, Marker, Popup }) => {
      config.apiKey = MAPTILER_CONFIG.apiKey;

      if (!mapInstanceRef.current) {
        const initialCenter = items.length > 0 
          ? [items[0].lon, items[0].lat] 
          : [-122.42, 37.77];

        mapInstanceRef.current = new MapTilerMap({
          container: mapContainerRef.current,
          style: MapStyle.SATELLITE,
          zoom: zoom,
          center: initialCenter,
          maxZoom: MAPTILER_CONFIG.maxZoom,
        });

        mapInstanceRef.current.on('load', () => {
          setMapReady(true);
          addMarkers(MapTilerMap, Marker, Popup);
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

  // Add markers when items change
  useEffect(() => {
    if (mapReady && mapInstanceRef.current) {
      import('@maptiler/sdk').then(({ Marker, Popup }) => {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        
        addMarkers(null, Marker, Popup);
      });
    }
  }, [items, selectedId, mapReady]);

  const addMarkers = (MapClass: any, MarkerClass: any, PopupClass: any) => {
    if (!mapInstanceRef.current) return;

    items.forEach((item) => {
      const isSelected = selectedItem?.uuid === item.uuid;
      
      const marker = new MarkerClass({
        color: item.colorHex,
        scale: isSelected ? 1.3 : 1,
      })
        .setLngLat([item.lon, item.lat])
        .setPopup(
          new PopupClass().setHTML(`
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

      // Add click handler
      if (onSelect) {
        marker.getElement().addEventListener('click', () => {
          onSelect(item);
        });
      }

      markersRef.current.push(marker);
    });
  };

  // Update zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Update map style
  useEffect(() => {
    if (mapInstanceRef.current) {
      import('@maptiler/sdk').then(({ MapStyle }) => {
        const styleMap = {
          street: MapStyle.STREETS,
          satellite: MapStyle.SATELLITE,
          hybrid: MapStyle.HYBRID,
        };
        mapInstanceRef.current.setStyle(styleMap[mapType]);
      });
    }
  }, [mapType]);

  // Center on selected item
  useEffect(() => {
    if (selectedItem && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [selectedItem.lon, selectedItem.lat],
        zoom: Math.max(zoom, 18),
        duration: 1500,
      });
    }
  }, [selectedItem]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 1, MAPTILER_CONFIG.maxZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 1, MAPTILER_CONFIG.minZoom);
    setZoom(newZoom);
  };

  const handleCenterOnMe = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está disponible en tu navegador');
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
        alert('No se pudo obtener tu ubicación');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || items.length === 0) return;

    const bounds = new (window as any).maptilersdk.LngLatBounds(
      [Math.min(...items.map(i => i.lon)), Math.min(...items.map(i => i.lat))],
      [Math.max(...items.map(i => i.lon)), Math.max(...items.map(i => i.lat))]
    );

    mapInstanceRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 18,
      duration: 1500,
    });
  };

  const handleCenterSelection = () => {
    if (selectedItem && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [selectedItem.lon, selectedItem.lat],
        zoom: Math.max(zoom, 18),
        duration: 1500,
      });
    }
  };

  const getResolutionText = (zoomLevel: number): string => {
    const metersPerPixel = 156543.03392 * Math.cos(0) / Math.pow(2, zoomLevel);
    if (metersPerPixel < 1) {
      return `${(metersPerPixel * 100).toFixed(1)}cm/pixel`;
    }
    return `${metersPerPixel.toFixed(2)}m/pixel`;
  };

  const canZoomIn = zoom < MAPTILER_CONFIG.maxZoom;
  const canZoomOut = zoom > MAPTILER_CONFIG.minZoom;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ MapTiler Map (Web)</Text>
        <Text style={styles.subtitle}>High-Precision Map - Zoom {zoom} ({getResolutionText(zoom)})</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Legend */}
        {legendItems.length > 0 && (
          <View style={styles.legend}>
            {legendItems.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Action Buttons */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Acciones</Text>
          <View style={styles.buttonRow}>
            {selectedItem && (
              <Pressable
                onPress={handleCenterSelection}
                style={[styles.actionButton, styles.actionButtonPrimary]}
                accessibilityRole="button"
                accessibilityLabel="Centrar selección"
              >
                <Text style={styles.actionButtonText}>Centrar</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleFitAll}
              style={[styles.actionButton, styles.actionButtonPrimary]}
              accessibilityRole="button"
              accessibilityLabel="Ver todos"
            >
              <Text style={styles.actionButtonText}>Ver todos</Text>
            </Pressable>
          </View>
        </View>

        {/* Zoom Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Zoom</Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleZoomOut}
              disabled={!canZoomOut}
              style={[styles.button, !canZoomOut && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.buttonText}>−</Text>
            </Pressable>
            <Text style={styles.zoomValue}>{zoom}</Text>
            <Pressable
              onPress={handleZoomIn}
              disabled={!canZoomIn}
              style={[styles.button, !canZoomIn && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
            <Pressable
              onPress={handleCenterOnMe}
              style={[styles.button, styles.locationButton]}
              accessibilityRole="button"
              accessibilityLabel="Centrar en mi ubicación"
            >
              <Text style={styles.buttonText}>📍</Text>
            </Pressable>
          </View>
        </View>

        {/* Map Type Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Tipo de Mapa</Text>
          <View style={styles.buttonRow}>
            {(['street', 'satellite', 'hybrid'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setMapType(type)}
                style={[
                  styles.mapTypeButton,
                  mapType === type && styles.mapTypeButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${type} view`}
                accessibilityState={{ selected: mapType === type }}
              >
                <Text
                  style={[
                    styles.mapTypeButtonText,
                    mapType === type && styles.mapTypeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📊 {items.length} puntos | Max Zoom: {MAPTILER_CONFIG.maxZoom} | Resolución: {getResolutionText(MAPTILER_CONFIG.maxZoom)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  mapContainer: {
    height: 400,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
    maxWidth: 200,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
  },
  controls: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  locationButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  zoomValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    minWidth: 40,
    textAlign: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonPrimary: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  mapTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  mapTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  mapTypeButtonTextActive: {
    color: '#ffffff',
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoText: {
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
  },
});
