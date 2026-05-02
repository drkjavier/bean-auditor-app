import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Tag } from '../../data/mocks/tagsMock';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: number | null;
  onSelect?: (item: Tag) => void;
};

function FocusController({
  selectedItem,
  bounds,
  fitAllSignal,
  centerSignal,
}: {
  selectedItem?: Tag | null;
  bounds?: L.LatLngBounds | null;
  fitAllSignal?: number;
  centerSignal?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedItem) {
      map.flyTo([selectedItem.lat, selectedItem.lon], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.75,
      });
    }
  }, [map, selectedItem]);

  // Allow explicit recenter requests even when the selectedItem reference
  // hasn't changed (e.g. user clicks "Centrar selección"). The parent will
  // increment `centerSignal` to trigger this effect.
  useEffect(() => {
    if (selectedItem && typeof centerSignal === 'number') {
      map.flyTo([selectedItem.lat, selectedItem.lon], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.75,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, centerSignal]);

  useEffect(() => {
    if (bounds && fitAllSignal) {
      map.fitBounds(bounds, { padding: [36, 36], animate: true, duration: 0.75 } as any);
    }
  }, [map, bounds, fitAllSignal]);

  return null;
}

function getBounds(items: Tag[]) {
  if (items.length === 0) return null;
  const latLngs = items.map(item => [item.lat, item.lon] as [number, number]);
  return L.latLngBounds(latLngs);
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();

  return L.divIcon({
    html: `
      <div style="
        background:#2563eb;
        color:white;
        width:40px;
        height:40px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        border:3px solid white;
        box-shadow:0 4px 12px rgba(15,23,42,0.2);
      ">${count}</div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [40, 40],
  });
}

export default function MapCanvas({ items, style, selectedId, onSelect }: Props) {
  const bounds = useMemo(() => getBounds(items), [items]);
  const center: [number, number] = items.length > 0 ? [items[0].lat, items[0].lon] : [37.77, -122.42];
  const selectedItem = selectedId ? items.find(item => item.id === selectedId) ?? null : null;
  const [fitAllSignal, setFitAllSignal] = React.useState(0);
  // signal used to request recentring on the already-selected item even when
  // `selectedItem` value doesn't change. Incrementing this value will trigger
  // FocusController to flyTo the currently selected item.
  const [centerSignal, setCenterSignal] = React.useState(0);
  const [mapType, setMapType] = React.useState<'street' | 'satellite'>('street');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  function showToast(message: string, ms = 3000) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    // @ts-ignore - window.setTimeout returns number in browser
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }

  const legendItems = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      if (!map.has(item.state ?? 'n/a')) {
        map.set(item.state ?? 'n/a', item.color);
      }
    });
    return Array.from(map.entries()).map(([state, color]) => ({ state, color }));
  }, [items]);

  const TILESETS: Record<string, { url: string; attribution: string }> = {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
    },
    satellite: {
      // Esri World Imagery (publicly accessible tileset — validar TOS en producción)
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    },
  };

  return (
    <View style={[styles.wrapper, style]} accessibilityLabel="Mapa de auditorías">
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay puntos para mostrar</Text>
        </View>
      ) : (
        <>
            <View style={styles.toolbar}>
              <View style={styles.legend}>
                {legendItems.map(item => (
                  <View key={item.state} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.state}</Text>
                </View>
              ))}
              </View>

              <View style={styles.actions}>
                {selectedItem ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Centrar selección"
                    onPress={() => setCenterSignal(v => v + 1)}
                    style={[styles.mapToggleButton, styles.actionInlineButton]}
                  >
                    <Text style={styles.mapToggleButtonText}>Centrar selección</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos"
                  onPress={() => setFitAllSignal(value => value + 1)}
                  style={[styles.mapToggleButton, styles.actionInlineButton]}
                >
                  <Text style={styles.mapToggleButtonText}>Ver todos</Text>
                </Pressable>

                {/* Toggle controls aligned to 'Ver todos' */}
                <View style={{ width: 6 }} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Vista Street"
                  accessibilityState={{ pressed: mapType === 'street' }}
                  onPress={() => setMapType('street')}
                  style={[styles.mapToggleButton, mapType === 'street' ? styles.mapToggleButtonActive : undefined]}
                >
                  <Text style={[styles.mapToggleButtonText, mapType === 'street' ? styles.mapToggleButtonTextActive : undefined]}>Street</Text>
                </Pressable>

                <View style={{ width: 6 }} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Vista Satellite"
                  accessibilityState={{ pressed: mapType === 'satellite' }}
                  onPress={() => setMapType('satellite')}
                  style={[styles.mapToggleButton, mapType === 'satellite' ? styles.mapToggleButtonActive : undefined]}
                >
                  <Text style={[styles.mapToggleButtonText, mapType === 'satellite' ? styles.mapToggleButtonTextActive : undefined]}>Satellite</Text>
                </Pressable>
              </View>
          </View>

            <MapContainer
              center={center}
              zoom={12}
              style={styles.map as any}
              bounds={bounds ?? undefined}
              scrollWheelZoom
            >
              <FocusController selectedItem={selectedItem} bounds={bounds} fitAllSignal={fitAllSignal} centerSignal={centerSignal} />
            <TileLayer
              attribution={TILESETS[mapType].attribution}
              url={TILESETS[mapType].url}
              eventHandlers={{
                tileerror: () => {
                  // fallback to street tiles if satellite fails
                  if (mapType === 'satellite') {
                    setMapType('street');
                    showToast('Vista satélite no disponible. Usando Street.');
                  }
                },
              }}
            />

            <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
              {items.map(item => (
                <CircleMarker
                  key={String(item.id)}
                  center={[item.lat, item.lon]}
                  radius={selectedItem?.id === item.id ? 11 : 8}
                  eventHandlers={onSelect ? { click: () => onSelect(item) } : undefined}
                  pathOptions={{
                    color: item.color,
                    fillColor: item.color,
                    fillOpacity: selectedItem?.id === item.id ? 1 : 0.85,
                    weight: selectedItem?.id === item.id ? 3 : 1,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '999px',
                            backgroundColor: item.color,
                            display: 'inline-block',
                            marginRight: 8,
                          }}
                        />
                        <strong style={{ color: '#0f172a', fontSize: 14 }}>{item.unique_id}</strong>
                      </div>

                      <div style={{ color: '#475569', fontSize: 12, marginBottom: 6 }}>
                        Estado: <strong style={{ color: '#0f172a' }}>{item.state ?? 'n/a'}</strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                        <div>
                          <div style={{ color: '#64748b' }}>ID</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.id}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b' }}>Color</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.color}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b' }}>Lat</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.lat.toFixed(4)}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b' }}>Lon</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.lon.toFixed(4)}</div>
                        </div>
                      </div>

                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>
                        Actualizado: {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
          {/* overlay removed - toggles moved inline into toolbar actions */}

          {toast ? (
            <View style={styles.toast} accessibilityLiveRegion="polite">
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
  },
  map: {
    width: '100%',
    height: 320,
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
    gap: 8,
  },
  actionButton: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1e40af',
  },
  toggleButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  toggleButtonLarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    // use cross-platform shadow props instead of boxShadow string
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  toggleButtonActiveLarge: {
    backgroundColor: '#2563eb',
    borderColor: '#1e40af',
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
  overlayControls: {
    position: 'absolute',
    // place overlay below the toolbar to avoid overlap/clipping
    top: 64,
    left: 12,
    right: 12,
    alignItems: 'flex-start',
    pointerEvents: 'box-none',
    zIndex: 1000,
  },
  overlayInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
