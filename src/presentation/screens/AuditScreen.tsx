import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { fetchTags, Tag } from '../../data/tagService';
import MapCanvas from '../components/MapCanvas';
import { useAuthStore } from '../../stores/authStore';

const FILTER_DEBOUNCE_MS = 350;

export default function AuditScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const listRef = useRef<FlatList<Tag>>(null);
  const hasLoadedInitially = useRef(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Tag[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setAutoRefreshing(true);
    try {
      const res = await fetchTags({ q: query || undefined, state: stateFilter, from: from || undefined, to: to || undefined });
      setItems(res);
      setSelectedId(prev => (res.some(item => item.id === prev) ? prev : res[0]?.id ?? null));
    } finally {
      setLoading(false);
      setAutoRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    hasLoadedInitially.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedInitially.current) return;

    const handle = setTimeout(() => {
      load(true);
    }, FILTER_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query, stateFilter, from, to]);

  const filtered = useMemo(() => items, [items]);
  const selectedItem = useMemo(
    () => filtered.find(item => item.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  useEffect(() => {
    if (!selectedId || filtered.length === 0) return;

    const index = filtered.findIndex(item => item.id === selectedId);
    if (index < 0) return;
    // wrap scroll in a microtask so tests can await it with act
    const handle = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch {
        // ignore if list not ready yet
      }
    }, 0);

    return () => clearTimeout(handle);
  }, [selectedId, filtered]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityLabel="Pantalla Auditoría">
      <Text style={styles.title}>Auditoría</Text>
      <Text style={styles.helper}>Mapa OpenStreetMap con marcadores por color.</Text>
      <Text style={styles.helperSecondary}>
        {autoRefreshing ? 'Actualizando filtros…' : 'Los filtros se aplican automáticamente.'}
      </Text>

      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por unique_id"
          value={query}
          onChangeText={t => setQuery(t)}
          accessibilityLabel="Buscar auditoría"
        />

        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Desde (YYYY-MM-DD)" value={from} onChangeText={setFrom} />
          <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Hasta (YYYY-MM-DD)" value={to} onChangeText={setTo} />
        </View>

        <View style={styles.row}>
          <Pressable style={[styles.filterBtn, stateFilter === undefined ? styles.filterActive : null]} onPress={() => setStateFilter(undefined)}>
            <Text>Todos</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, stateFilter === 'open' ? styles.filterActive : null]} onPress={() => setStateFilter('open')}>
            <Text>Open</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, stateFilter === 'closed' ? styles.filterActive : null]} onPress={() => setStateFilter('closed')}>
            <Text>Closed</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, stateFilter === 'pending' ? styles.filterActive : null]} onPress={() => setStateFilter('pending')}>
            <Text>Pending</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => load()} style={styles.searchBtn} accessibilityRole="button">
          <Text style={styles.searchBtnText}>{loading ? 'Cargando...' : 'Aplicar'}</Text>
        </Pressable>
      </View>

      <MapCanvas items={filtered} style={styles.map} selectedId={selectedId} onSelect={item => setSelectedId(item.id)} />

      {selectedItem ? (
        <View style={styles.detailCard} accessibilityLabel="Detalle del tag seleccionado">
          <View style={styles.detailHeader}>
            <View style={[styles.detailSwatch, { backgroundColor: selectedItem.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>{selectedItem.unique_id}</Text>
              <Text style={styles.detailSubtitle}>Estado: {selectedItem.state ?? 'n/a'}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>ID</Text>
              <Text style={styles.detailValue}>{selectedItem.id}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{selectedItem.color}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Latitud</Text>
              <Text style={styles.detailValue}>{selectedItem.lat.toFixed(4)}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Longitud</Text>
              <Text style={styles.detailValue}>{selectedItem.lon.toFixed(4)}</Text>
            </View>
          </View>

          <Text style={styles.detailTimestamp}>
            Actualizado: {new Date(selectedItem.timestamp).toLocaleString()}
          </Text>
        </View>
      ) : null}

      <View style={styles.listContainer}>
        <Text style={styles.subtitle}>Resultados: {filtered.length}</Text>
        <FlatList
          ref={listRef}
          data={filtered}
          keyExtractor={i => String(i.id)}
          getItemLayout={(_, index) => ({ length: 49, offset: 49 * index, index })}
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({ offset: Math.max(0, index * 49), animated: true });
          }}
          renderItem={({ item }) => (
            <Pressable style={[styles.item, selectedId === item.id ? styles.itemSelected : null]} onPress={() => setSelectedId(item.id)}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.unique_id}</Text>
                <Text style={styles.itemMeta}>{item.state}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  helper: { color: '#475569', marginBottom: 8 },
  helperSecondary: { color: '#64748b', marginBottom: 12, fontSize: 12 },
  controls: { marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff' },
  row: { flexDirection: 'row', marginBottom: 8 },
  filterBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  filterActive: { backgroundColor: '#e6f0ff' },
  searchBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  map: { marginTop: 4 },
  detailCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  detailTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0f172a',
  },
  detailSubtitle: {
    color: '#64748b',
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  detailCell: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  detailValue: {
    color: '#0f172a',
    fontWeight: '600',
  },
  detailTimestamp: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
  },
  listContainer: { height: 220, marginTop: 8 },
  subtitle: { marginBottom: 8, color: '#475569' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemSelected: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  itemTitle: { fontWeight: '700' },
  itemMeta: { color: '#6b7280', fontSize: 12 },
});
