import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal } from 'react-native';
import { fetchTags, Tag } from '../../data/tagService';
import { createAndRegisterAbortController, unregisterAbortController, abortAllControllers } from '../../infrastructure/api/abortManager';
import MapCanvas from '../components/MapCanvas';
import { useSettingsStore } from '../../state/settingsStore';
import ColorCombobox from '../components/ColorCombobox';
import DatePickerInput from '../components/DatePickerInput';
import TouchableLongPress from '../components/TouchableLongPress';
import { useAuthStore } from '../../stores';
import { useBottomBarOffset } from '../components/BottomNavBar';

const FILTER_DEBOUNCE_MS = 350;

function getAuditStatusLabel(audited: boolean) {
  return audited ? 'Auditado' : 'Pendiente';
}

export default function AuditScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const listRef = useRef<FlatList<Tag>>(null);
  const hasLoadedInitially = useRef(false);
  const latestRequestId = useRef(0);
  const isMounted = useRef(true);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppliedFilterKey = useRef('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Tag[]>([]);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markTargetId, setMarkTargetId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | undefined>(undefined);
  const [auditedFilter, setAuditedFilter] = useState<boolean | undefined>(undefined);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const bottomBarOffset = useBottomBarOffset();
  const showUserLocation = useSettingsStore(state => state.showUserLocation);

  const filters = useMemo(
    () => ({
      color: colorFilter,
      audited: auditedFilter,
      from: from || undefined,
      to: to || undefined,
    }),
    [colorFilter, auditedFilter, from, to],
  );
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const dateRangeError = useMemo(() => {
    if (!from || !to) return null;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return 'Selecciona un rango de fechas válido.';
    }

    if (fromDate > toDate) {
      return 'La fecha desde no puede ser mayor que la fecha hasta.';
    }

    return null;
  }, [from, to]);

  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];

    if (colorFilter) parts.push(`Color ${colorFilter}`);
    if (typeof auditedFilter === 'boolean') parts.push(getAuditStatusLabel(auditedFilter));
    if (from) parts.push(`Desde ${new Date(from).toLocaleDateString()}`);
    if (to) parts.push(`Hasta ${new Date(to).toLocaleDateString()}`);

    return parts.length > 0 ? parts.join(' · ') : 'Sin filtros activos';
  }, [colorFilter, auditedFilter, from, to]);

  const load = useCallback(async (silent = false, nextFilters = filters, nextFiltersKey = filtersKey) => {
    if (dateRangeError) {
      if (isMounted.current) {
        setAutoRefreshing(false);
        setLoading(false);
      }
      return;
    }

    const requestId = ++latestRequestId.current;

    if (!silent && isMounted.current) setLoading(true);
    if (silent && isMounted.current) setAutoRefreshing(true);

    // Create an AbortController for this request so it can be cancelled
    const ctrl: any = createAndRegisterAbortController();
    try {
      const res = await fetchTags(nextFilters, { signal: ctrl.signal });

      if (!isMounted.current || requestId !== latestRequestId.current) {
        return;
      }

      lastAppliedFilterKey.current = nextFiltersKey;
      setItems(res);
      setSelectedId(prev => (res.some(item => item.unique_id === prev) ? prev : res[0]?.unique_id ?? null));
    } catch (err: any) {
      if (err && (err.name === 'AbortError' || err.message === 'Aborted')) {
        // request was aborted — ignore
        return;
      }
      throw err;
    } finally {
      try { unregisterAbortController(ctrl); } catch (_) {}
      if (isMounted.current && requestId === latestRequestId.current) {
        setLoading(false);
        setAutoRefreshing(false);
      }
    }
  }, [dateRangeError, filters, filtersKey]);

  useEffect(() => {
    lastAppliedFilterKey.current = filtersKey;
    load(false, filters, filtersKey);
    hasLoadedInitially.current = true;
  }, [filters, filtersKey, load]);

  useEffect(() => () => {
    isMounted.current = false;
    latestRequestId.current += 1;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // abort in-flight requests started by this screen
    try {
      abortAllControllers();
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!hasLoadedInitially.current) return;
    if (dateRangeError) return;
    if (filtersKey === lastAppliedFilterKey.current) return;

    debounceTimeoutRef.current = setTimeout(() => {
      load(true, filters, filtersKey);
    }, FILTER_DEBOUNCE_MS);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [dateRangeError, filters, filtersKey, load]);

  const filtered = useMemo(() => items, [items]);
  const selectedItem = useMemo(
    () => filtered.find(item => item.unique_id === selectedId) ?? null,
    [filtered, selectedId],
  );

  useEffect(() => {
    if (!selectedId || filtered.length === 0) return;

    const index = filtered.findIndex(item => item.unique_id === selectedId);
    if (index < 0) return;
    // wrap scroll in a microtask so tests can await it with act
    scrollTimeoutRef.current = setTimeout(() => {
      try {
        // Ensure item is scrolled into view above the bottom navigation.
        // The viewOffset accounts for the fixed BottomNavBar managed by MainScreen.
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5, viewOffset: bottomBarOffset + 12 });
      } catch {
        // ignore if list not ready yet
      }
    }, 0);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [selectedId, filtered, bottomBarOffset]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityLabel="Pantalla Auditoría">
      <Text style={styles.title}>Auditoría</Text>
      <Text style={styles.helper}>Mapa OpenStreetMap con marcadores por color.</Text>
      <Text style={styles.helperSecondary}>
        {autoRefreshing ? 'Actualizando filtros…' : 'Los filtros se aplican automáticamente. También puedes recargar manualmente.'}
      </Text>

      <View style={styles.controls}>
        <ColorCombobox value={colorFilter} onChange={setColorFilter} placeholder="Filtrar por color" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <DatePickerInput value={from} onChange={setFrom} label="Desde" mode="from" />
          </View>
          <View style={[styles.halfField, styles.halfFieldOffset]}>
            <DatePickerInput value={to} onChange={setTo} label="Hasta" mode="to" />
          </View>
        </View>

        <Text style={styles.filterLabel}>Auditoría</Text>
        <View style={[styles.row, styles.filterRow]}>
          <Pressable style={[styles.filterBtn, auditedFilter === undefined ? styles.filterActive : null]} onPress={() => setAuditedFilter(undefined)} accessibilityRole="button" accessibilityState={{ selected: auditedFilter === undefined }}>
            <Text>Todos</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, auditedFilter === true ? styles.filterActive : null]} onPress={() => setAuditedFilter(true)} accessibilityRole="button" accessibilityState={{ selected: auditedFilter === true }}>
            <Text>Auditados</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, auditedFilter === false ? styles.filterActive : null]} onPress={() => setAuditedFilter(false)} accessibilityRole="button" accessibilityState={{ selected: auditedFilter === false }}>
            <Text>Pendientes</Text>
          </Pressable>
        </View>

        <Text style={styles.filterSummary} accessibilityLabel="Resumen de filtros activos">
          {activeFiltersSummary}
        </Text>

        {dateRangeError ? <Text style={styles.errorText}>{dateRangeError}</Text> : null}

        <Pressable onPress={() => load(false, filters, filtersKey)} style={[styles.searchBtn, dateRangeError ? styles.searchBtnDisabled : null]} accessibilityRole="button" disabled={Boolean(dateRangeError)}>
          <Text style={styles.searchBtnText}>{loading ? 'Cargando...' : 'Recargar'}</Text>
        </Pressable>
      </View>

      <Modal visible={isMarkModalOpen} transparent animationType="fade" onRequestClose={() => setIsMarkModalOpen(false)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.container} accessibilityRole="dialog" accessibilityLabel="Marcar modal">
            <Text style={modalStyles.title}>Marcar</Text>
            <View style={modalStyles.buttonsRow}>
              <Pressable
                style={[modalStyles.btn, { backgroundColor: '#10b981' }]}
                  onPress={() => {
                    if (!markTargetId) return;
                    // DEV-only log
                    if (__DEV__) console.debug(`Mark action: Auditar on ${markTargetId}`);
                    setItems(prev => prev.map(t => (t.unique_id === markTargetId ? { ...t, audited: true } : t)));
                    setIsMarkModalOpen(false);
                  }}
                accessibilityRole="button"
              >
                <Text style={modalStyles.btnText}>Auditar</Text>
              </Pressable>

              <Pressable
                style={[modalStyles.btn, { backgroundColor: '#ef4444' }]}
                  onPress={() => {
                    if (!markTargetId) return;
                    if (__DEV__) console.debug(`Mark action: Sin auditar on ${markTargetId}`);
                    setItems(prev => prev.map(t => (t.unique_id === markTargetId ? { ...t, audited: false } : t)));
                    setIsMarkModalOpen(false);
                  }}
                accessibilityRole="button"
              >
                <Text style={modalStyles.btnText}>Sin auditar</Text>
              </Pressable>
            </View>

            <Pressable style={modalStyles.cancel} onPress={() => setIsMarkModalOpen(false)} accessibilityRole="button">
              <Text style={modalStyles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* subscribe to settings store so UI updates when user toggles visibility */}
      <MapCanvas items={filtered} style={styles.map} selectedId={selectedId} onSelect={item => setSelectedId(item.unique_id)} showUserLocation={showUserLocation} />

      {selectedItem ? (
        <View style={styles.detailCard} accessibilityLabel="Detalle del tag seleccionado">
          <View style={styles.detailHeader}>
            <View style={[styles.detailSwatch, { backgroundColor: selectedItem.colorHex }]} />
            <View style={styles.flexContent}>
              <Text style={styles.detailTitle}>{selectedItem.unique_id}</Text>
              <Text style={styles.detailSubtitle}>Auditoría: {getAuditStatusLabel(selectedItem.audited)}</Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Color</Text>
              <Text style={styles.detailValue}>{selectedItem.colorHex}</Text>
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
             keyExtractor={item => item.unique_id}
             getItemLayout={(_, index) => ({ length: 49, offset: 49 * index, index })}
             onScrollToIndexFailed={({ index }) => {
                const offset = Math.max(0, index * 49 - bottomBarOffset);
                listRef.current?.scrollToOffset({ offset, animated: true });
             }}
           renderItem={({ item }) => (
             <TouchableLongPress
               delay={650}
               style={[styles.item, selectedId === item.unique_id ? styles.itemSelected : null]}
               onPress={() => setSelectedId(item.unique_id)}
                 onLongPress={() => {
                   if (__DEV__) console.debug(`Long press detected on tag ${item.unique_id}`);
                   setMarkTargetId(item.unique_id);
                   setIsMarkModalOpen(true);
                 }}
             >
               <View style={[styles.dot, { backgroundColor: item.colorHex }]} />
               <View style={styles.flexContent}>
                 <Text style={styles.itemTitle}>{item.unique_id}</Text>
                 <Text style={styles.itemMeta}>{getAuditStatusLabel(item.audited)}</Text>
               </View>
             </TouchableLongPress>
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
  controls: { marginBottom: 8, width: '100%', minWidth: 0 },
  row: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start', flexWrap: 'wrap' },
  filterRow: { flexWrap: 'wrap' },
  // Reduce minWidth so fields can fit side-by-side on narrower viewports.
  halfField: { flex: 1, minWidth: 140 },
  halfFieldOffset: { marginLeft: 8, minWidth: 140 },
  flexContent: { flex: 1 },
  filterLabel: { color: '#0f172a', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  filterBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8 },
  filterActive: { backgroundColor: '#e6f0ff' },
  searchBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center' },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  filterSummary: { color: '#475569', fontSize: 12, marginBottom: 8 },
  errorText: { color: '#b91c1c', fontSize: 12, marginBottom: 8 },
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
    marginHorizontal: -6,
  },
  detailCell: {
    width: '33.3333%',
    paddingHorizontal: 6,
    marginBottom: 8,
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
  listContainer: { flex: 1, marginTop: 8 },
  subtitle: { marginBottom: 8, color: '#475569' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemSelected: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  itemTitle: { fontWeight: '700' },
  itemMeta: { color: '#6b7280', fontSize: 12 },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: 300, padding: 16, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  buttonsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
  cancel: { paddingVertical: 8 },
  cancelText: { color: '#334155' },
});
