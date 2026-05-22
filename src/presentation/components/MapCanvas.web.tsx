import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Marker cluster CSS is required for proper cluster styling (react-leaflet-cluster v4+)
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import type { Tag } from '../../data/mocks/tagsMock';

// Maximum zoom allowed by the map UI. Note: tile providers may have a lower
// native max (configured per TileLayer via maxNativeZoom). Increase only if
// your tileserver supplies higher-resolution tiles.
const MAX_MAP_ZOOM = 21;

function getAuditStatusLabel(audited: boolean) {
  return audited ? 'Auditado' : 'Pendiente';
}

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
};

function FocusController({
  selectedItem,
  bounds,
  fitAllSignal,
  centerSignal,
  selectionZoom,
  fitAllMaxZoom,
}: {
  selectedItem?: Tag | null;
  bounds?: L.LatLngBounds | null;
  fitAllSignal?: number;
  centerSignal?: number;
  selectionZoom: number;
  fitAllMaxZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedItem) {
      map.flyTo([selectedItem.lat, selectedItem.lon], Math.max(map.getZoom(), selectionZoom), {
        animate: true,
        duration: 0.75,
      });
    }
  }, [map, selectedItem, selectionZoom]);

  // Allow explicit recenter requests even when the selectedItem reference
  // hasn't changed (e.g. user clicks "Centrar selección"). The parent will
  // increment `centerSignal` to trigger this effect.
  useEffect(() => {
    if (selectedItem && typeof centerSignal === 'number') {
      map.flyTo([selectedItem.lat, selectedItem.lon], Math.max(map.getZoom(), selectionZoom), {
        animate: true,
        duration: 0.75,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, centerSignal, selectionZoom]);

  useEffect(() => {
    if (bounds && fitAllSignal) {
      // Keep enough context, but allow zooming close enough to separate tags.
      map.fitBounds(bounds, { padding: [36, 36], animate: true, duration: 0.75, maxZoom: fitAllMaxZoom } as any);
    }
  }, [map, bounds, fitAllSignal, fitAllMaxZoom]);

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
  const selectedItem = selectedId ? items.find(item => item.unique_id === selectedId) ?? null : null;
  const [fitAllSignal, setFitAllSignal] = React.useState(0);
  // signal used to request recentring on the already-selected item even when
  // `selectedItem` value doesn't change. Incrementing this value will trigger
  // FocusController to flyTo the currently selected item.
  const [centerSignal, setCenterSignal] = React.useState(0);
  const [mapType, setMapType] = React.useState<'street' | 'satellite'>('street');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any>(null);

  function showToast(message: string, ms = 3000) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    // @ts-ignore - window.setTimeout returns number in browser
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }

  const legendItems = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      const label = getAuditStatusLabel(item.audited);
      if (!map.has(label)) {
        map.set(label, item.colorHex);
      }
    });
    return Array.from(map.entries()).map(([label, color]) => ({ label, color }));
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

  // Determine provider-native max zoom to avoid requesting tiles that the provider
  // does not serve (which causes 400 responses). For OSM street tiles we assume
  // native up to 19; for Esri satellite we allow up to 20.
  const providerNativeMax = mapType === 'street' ? 19 : 20;
  const mapMaxZoom = Math.min(MAX_MAP_ZOOM, providerNativeMax);
  const selectionZoom = Math.min(mapMaxZoom, providerNativeMax);
  const fitAllMaxZoom = Math.min(mapMaxZoom, 19);

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
                  <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.colorHex }]} />
                  <Text style={styles.legendText}>{item.label}</Text>
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
                    <Text style={styles.mapToggleButtonText}>Centrar</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver todos"
                  onPress={() => {
                    // trigger fit-all behaviour
                    setFitAllSignal(value => value + 1);

                    // Try to expand clusters gracefully using the cluster instance API.
                    // We attempt several approaches (spiderfy a visible cluster, call zoomToBounds
                    // on the cluster instance, or as a last resort call map.fitBounds).
                    setTimeout(() => {
                      try {
                        const grp = clusterRef.current;
                        const instance = grp?.leafletElement ?? grp?.instance ?? grp;

                        if (instance) {
                          // Try to spiderfy a visible cluster if present
                          try {
                            const fg = instance._featureGroup ?? instance._group ?? instance;
                            const layers = fg && typeof fg.getLayers === 'function' ? fg.getLayers() : [];
                            const clusterLayer = layers.find((l: any) => l && typeof l.getChildCount === 'function' && l.getChildCount() > 1);
                            if (clusterLayer && typeof clusterLayer.spiderfy === 'function') {
                              clusterLayer.spiderfy();
                              return;
                            }
                          } catch (e) {
                            // ignore and try other methods
                          }

                          if (typeof instance.zoomToBounds === 'function') {
                            try { instance.zoomToBounds(); return; } catch (e) {}
                          }

                          if (typeof instance.zoomToShowLayer === 'function') {
                            try {
                              const anyLayer = instance.getLayers?.()?.[0];
                              if (anyLayer) instance.zoomToShowLayer(anyLayer, () => {});
                              return;
                            } catch (e) {}
                          }
                        }

                        // fallback: use map.fitBounds
                          if (mapRef.current && bounds) {
                            try { mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: fitAllMaxZoom } as any); } catch (e) {}
                          }
                      } catch (e) {
                        // final fallback noop
                      }
                    }, 200);
                  }}
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
                  onPress={() => {
                    setMapType('street');
                    // notify user about native max zoom when switching provider
                    const nativeMax = 19;
                    showToast(`Tiles nativos disponibles hasta z=${nativeMax}. Zoom superior será reescalado.`, 4000);
                  }}
                  style={[styles.mapToggleButton, styles.mapTypeToggleButton, mapType === 'street' ? styles.mapToggleButtonActive : undefined]}
                >
                  <Text style={[styles.mapToggleButtonText, mapType === 'street' ? styles.mapToggleButtonTextActive : undefined]}>Street</Text>
                </Pressable>

                <View style={{ width: 6 }} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Vista Satellite"
                  accessibilityState={{ pressed: mapType === 'satellite' }}
                  onPress={() => {
                    setMapType('satellite');
                    // notify user about native max zoom when switching provider
                    const nativeMax = 20;
                    showToast(`Tiles nativos disponibles hasta z=${nativeMax}. Zoom superior será reescalado.`, 4000);
                  }}
                  style={[styles.mapToggleButton, styles.mapTypeToggleButton, mapType === 'satellite' ? styles.mapToggleButtonActive : undefined]}
                >
                  <Text style={[styles.mapToggleButtonText, mapType === 'satellite' ? styles.mapToggleButtonTextActive : undefined]}>Satellite</Text>
                </Pressable>
              </View>
              <Text style={styles.providerInfo} accessibilityLabel={`Zoom máximo disponible ${providerNativeMax}`}>Máx. zoom: {providerNativeMax}</Text>
          </View>

            <MapContainer
              center={center}
              zoom={12}
              style={styles.map as any}
              bounds={bounds ?? undefined}
              scrollWheelZoom
              whenCreated={m => (mapRef.current = m)}
              // Cap the map max zoom to the provider's native max to avoid 400 errors
              maxZoom={mapMaxZoom}
            >
              <FocusController selectedItem={selectedItem} bounds={bounds} fitAllSignal={fitAllSignal} centerSignal={centerSignal} selectionZoom={selectionZoom} fitAllMaxZoom={fitAllMaxZoom} />
            <TileLayer
              attribution={TILESETS[mapType].attribution}
              url={TILESETS[mapType].url}
              // Do not request tiles beyond providerNativeMax
              maxNativeZoom={providerNativeMax}
              maxZoom={mapMaxZoom}
              detectRetina={true}
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

            {/* Marker clustering options tuned for better UX when using "Ver todos" */}
            <MarkerClusterGroup
              ref={clusterRef}
              chunkedLoading
              iconCreateFunction={createClusterIcon}
              // UX tuning
              // - disable clustering at this zoom so high-zoom shows individuals
              // set to 19 so individual markers are visible at high zoom (1m separation)
              disableClusteringAtZoom={19}
              // - allow spiderfy when at max zoom
              spiderfyOnMaxZoom={true}
              // - do not rely on default zoomToBoundsOnClick; handle cluster clicks explicitly
              zoomToBoundsOnClick={false}
              // - reduce cluster radius so clusters split more eagerly
              maxClusterRadius={40}
              // - show cluster coverage only on hover (helps on desktop)
              showCoverageOnHover={false}
              // handle cluster clicks to provide a predictable expand behavior
              onClusterClick={(e: any) => {
                try {
                  const cluster = e?.layer ?? e?.target ?? null;
                  if (!cluster) return;

                  // Prefer cluster.zoomToBounds() if available (expands/zooms to children)
                  if (typeof cluster.zoomToBounds === 'function') {
                    try { cluster.zoomToBounds(); return; } catch (_) {}
                  }

                  // If we have a bounds, fit to it with a capped maxZoom
                  const bounds = typeof cluster.getBounds === 'function' ? cluster.getBounds() : null;
                  const map = mapRef.current;
                  if (bounds && map) {
                    const mapMax = typeof map.getMaxZoom === 'function' ? (map.getMaxZoom() as number) : fitAllMaxZoom;
                    const targetMax = Math.min(fitAllMaxZoom, isFinite(mapMax) ? mapMax : fitAllMaxZoom);
                    try {
                      map.fitBounds(bounds, { padding: [36, 36], maxZoom: targetMax } as any);
                      return;
                    } catch (_) {}
                  }

                  // As last resort spiderfy the cluster if possible
                  if (typeof cluster.spiderfy === 'function') {
                    try { cluster.spiderfy(); } catch (_) {}
                  }
                } catch (_) {}
              }}
            >
              {items.map(item => (
                <CircleMarker
                  key={item.uuid}
                  center={[item.lat, item.lon]}
                  radius={selectedItem?.uuid === item.uuid ? 11 : 8}
                  eventHandlers={onSelect ? { click: () => onSelect(item) } : undefined}
                  pathOptions={{
                    color: item.colorHex,
                    fillColor: item.colorHex,
                    fillOpacity: selectedItem?.uuid === item.uuid ? 1 : 0.85,
                    weight: selectedItem?.uuid === item.uuid ? 3 : 1,
                  }}
                >
                  <Popup>
                      <div style={{ maxWidth: 300, wordBreak: 'break-word', fontFamily: 'system-ui, sans-serif' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '999px',
                            backgroundColor: item.colorHex,
                            display: 'inline-block',
                            marginRight: 8,
                          }}
                        />
                        <strong style={{ color: '#0f172a', fontSize: 14 }}>{item.unique_id}</strong>
                      </div>

                      <div style={{ color: '#475569', fontSize: 12, marginBottom: 6 }}>
                        Auditoría: <strong style={{ color: '#0f172a' }}>{getAuditStatusLabel(item.audited)}</strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                        <div>
                          <div style={{ color: '#64748b' }}>UUID</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.uuid}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b' }}>Color</div>
                          <div style={{ color: '#0f172a', fontWeight: 600 }}>{item.colorHex}</div>
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
    // ensure the map wrapper is responsive and does not cause horizontal overflow
    width: '100%',
    minWidth: 0,
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
    alignItems: 'center',
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
    // Use CSS boxShadow on web to avoid deprecated shadow* warnings
    boxShadow: '0 6px 18px rgba(2,6,23,0.08)',
    elevation: 4,
  },
  providerInfo: {
    color: '#64748b',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 6,
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
