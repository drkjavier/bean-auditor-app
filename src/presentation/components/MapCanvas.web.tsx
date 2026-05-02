import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const legendItems = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(item => {
      if (!map.has(item.state ?? 'n/a')) {
        map.set(item.state ?? 'n/a', item.color);
      }
    });
    return Array.from(map.entries()).map(([state, color]) => ({ state, color }));
  }, [items]);

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
                <Text
                  style={styles.actionButton}
                  onPress={() => {
                    // trigger internal centering when user explicitly requests it
                    // do not rely on re-setting selection in the parent since it
                    // may already be the same value and won't cause a re-render
                    setCenterSignal(v => v + 1);
                  }}
                >
                  Centrar selección
                </Text>
              ) : null}
              <Text style={styles.actionButton} onPress={() => setFitAllSignal(value => value + 1)}>
                Ver todos
              </Text>
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
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  emptyState: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
  },
});
