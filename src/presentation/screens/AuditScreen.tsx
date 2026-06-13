import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal, ScrollView } from 'react-native';
import { fetchTags, Tag } from '../../data/tagService';
import { createAndRegisterAbortController, unregisterAbortController, abortAllControllers } from '../../infrastructure/api/abortManager';
import MapCanvas from '../components/MapCanvas';
import { useSettingsStore } from '../../state/settingsStore';
import { useTheme } from '../themes/ThemeContext';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ColorCombobox from '../components/ColorCombobox';
import DatePickerInput from '../components/DatePickerInput';
import TouchableLongPress from '../components/TouchableLongPress';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import { useAuthStore } from '../../stores';

const FILTER_DEBOUNCE_MS = 350;

function getAuditStatusLabel(audited: boolean) {
  return audited ? 'Auditado' : 'Pendiente';
}

export default function AuditScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const { colors, typography, spacing, radii } = useTheme();
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
      try { unregisterAbortController(ctrl);     } catch {
      // noop — best-effort abort
    }
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
    } catch {
      // noop — best-effort unregister
    }
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
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch {
        // ignore if list not ready yet
      }
    }, 0);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [selectedId, filtered]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}
      accessibilityLabel="Pantalla Auditoría"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.textPrimary, ...typography.h2 }]}>Auditoría</Text>

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <View id="container-filtros" style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Filtros" subtitle={autoRefreshing ? 'Actualizando…' : 'Los filtros se aplican automáticamente'} />
        <Card variant="outlined" accessibilityLabel="Filtros de auditoría">
          <ColorCombobox value={colorFilter} onChange={setColorFilter} placeholder="Filtrar por color" />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <DatePickerInput value={from} onChange={setFrom} label="Desde" mode="from" />
            </View>
            <View style={[styles.halfField, styles.halfFieldOffset]}>
              <DatePickerInput value={to} onChange={setTo} label="Hasta" mode="to" />
            </View>
          </View>

          <Text style={[styles.filterLabel, { color: colors.textPrimary, ...typography.caption }]}>Estado de auditoría</Text>
          <View style={[styles.row, styles.filterRow]}>
            <Pressable style={[styles.filterBtn, { borderColor: colors.border }, auditedFilter === undefined ? [styles.filterActive, { backgroundColor: colors.primaryTonal }] : null]} onPress={() => setAuditedFilter(undefined)} accessibilityRole="button" accessibilityState={{ selected: auditedFilter === undefined }} accessibilityLabel="Filtro: Todos">
              <Text style={{ color: colors.textPrimary, ...typography.caption }}>Todos</Text>
            </Pressable>
            <Pressable style={[styles.filterBtn, { borderColor: colors.border }, auditedFilter === true ? [styles.filterActive, { backgroundColor: colors.primaryTonal }] : null]} onPress={() => setAuditedFilter(true)} accessibilityRole="button" accessibilityState={{ selected: auditedFilter === true }} accessibilityLabel="Filtro: Auditados">
              <Text style={{ color: colors.textPrimary, ...typography.caption }}>Auditados</Text>
            </Pressable>
            <Pressable style={[styles.filterBtn, { borderColor: colors.border }, auditedFilter === false ? [styles.filterActive, { backgroundColor: colors.primaryTonal }] : null]} onPress={() => setAuditedFilter(false)} accessibilityRole="button" accessibilityState={{ selected: auditedFilter === false }} accessibilityLabel="Filtro: Pendientes">
              <Text style={{ color: colors.textPrimary, ...typography.caption }}>Pendientes</Text>
            </Pressable>
          </View>

          <Text style={[styles.filterSummary, { color: colors.textCaption, ...typography.caption }]} accessibilityLabel="Resumen de filtros activos">
            {activeFiltersSummary}
          </Text>

          <ErrorBanner message={dateRangeError} />

          <Pressable onPress={() => load(false, filters, filtersKey)} style={[styles.searchBtn, { backgroundColor: colors.primary, borderRadius: radii.md }, dateRangeError ? styles.searchBtnDisabled : null]} accessibilityRole="button" accessibilityLabel="Recargar datos" disabled={Boolean(dateRangeError)}>
            <Text style={[styles.searchBtnText, { color: colors.textButton }]}>{loading ? 'Cargando...' : 'Recargar'}</Text>
          </Pressable>
        </Card>
      </View>

      {/* ── Mapa ───────────────────────────────────────────────────────── */}
      <View id="container-mapa" style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Mapa" />
        <MapCanvas items={filtered} style={styles.map} selectedId={selectedId} onSelect={item => setSelectedId(item.unique_id)} showUserLocation={showUserLocation} />
      </View>

      {/* ── Detalle del tag seleccionado ────────────────────────────────── */}
      {selectedItem ? (
        <View id="container-detalle-tag" style={{ marginTop: spacing.lg }}>
          <SectionHeader title="Detalle del tag" />
          <Card variant="outlined" accessibilityLabel="Detalle del tag seleccionado">
            <View style={styles.detailHeader}>
              <View style={[styles.detailSwatch, { backgroundColor: selectedItem.colorHex }]} />
              <View style={styles.flexContent}>
                <Text style={[styles.detailTitle, { color: colors.textPrimary, ...typography.subtitle }]}>
                  {selectedItem.unique_id}
                </Text>
                <Text style={[styles.detailSubtitle, { color: colors.textCaption, ...typography.caption }]}>
                  Auditoría: {getAuditStatusLabel(selectedItem.audited)}
                </Text>
              </View>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textCaption, ...typography.caption }]}>Color</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary, ...typography.body }]}>{selectedItem.colorHex}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textCaption, ...typography.caption }]}>Latitud</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary, ...typography.body }]}>{selectedItem.lat.toFixed(4)}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textCaption, ...typography.caption }]}>Longitud</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary, ...typography.body }]}>{selectedItem.lon.toFixed(4)}</Text>
              </View>
            </View>

            <Text style={[styles.detailTimestamp, { color: colors.textCaption, ...typography.caption }]}>
              Actualizado: {new Date(selectedItem.timestamp).toLocaleString()}
            </Text>
          </Card>
        </View>
      ) : null}

      {/* ── Listado de tags ─────────────────────────────────────────────── */}
      <View id="container-tags" style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Tags" subtitle={`Resultados: ${filtered.length}`} />
        <Card variant="outlined" style={styles.tagListContainer}>
          <FlatList
            ref={listRef}
            data={filtered}
            style={{ flex: 1 }}
            nestedScrollEnabled
            keyExtractor={item => item.unique_id}
            getItemLayout={(_, index) => ({ length: 49, offset: 49 * index, index })}
            onScrollToIndexFailed={({ index }) => {
               const offset = Math.max(0, index * 49);
               listRef.current?.scrollToOffset({ offset, animated: true });
            }}
            ListEmptyComponent={
              <EmptyState
                icon="clipboard-text-search-outline"
                title="Sin resultados"
                description="Ajusta los filtros o recarga para ver los tags disponibles."
                actionLabel="Recargar"
                onAction={() => load(false, filters, filtersKey)}
              />
            }
            renderItem={({ item }) => (
              <TouchableLongPress
                delay={650}
                style={[styles.item, { borderBottomColor: colors.border }, selectedId === item.unique_id ? [styles.itemSelected, { backgroundColor: colors.primaryTonal }] : null]}
                onPress={() => setSelectedId(item.unique_id)}
                onLongPress={() => {
                  if (__DEV__) console.debug(`Long press detected on tag ${item.unique_id}`);
                  setMarkTargetId(item.unique_id);
                  setIsMarkModalOpen(true);
                }}
              >
                <View style={[styles.dot, { backgroundColor: item.colorHex }]} />
                <View style={styles.flexContent}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary, ...typography.body }]}>{item.unique_id}</Text>
                  <Text style={[styles.itemMeta, { color: colors.textCaption, ...typography.caption }]}>
                    {getAuditStatusLabel(item.audited)}
                  </Text>
                </View>
              </TouchableLongPress>
            )}
          />
        </Card>
      </View>

      {/* ── Modal de auditoría ──────────────────────────────────────────── */}
      <Modal visible={isMarkModalOpen} transparent animationType="fade" onRequestClose={() => setIsMarkModalOpen(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.container, { borderRadius: radii.lg, backgroundColor: colors.card }]} accessibilityRole="dialog" accessibilityLabel="Marcar modal">
            <Text style={[modalStyles.title, { color: colors.textPrimary, ...typography.subtitle }]}>Marcar</Text>
            <View style={modalStyles.buttonsRow}>
              <Pressable
                style={[modalStyles.btn, { backgroundColor: colors.success, borderRadius: radii.md }]}
                onPress={() => {
                  if (!markTargetId) return;
                  if (__DEV__) console.debug(`Mark action: Auditar on ${markTargetId}`);
                  setItems(prev => prev.map(t => (t.unique_id === markTargetId ? { ...t, audited: true } : t)));
                  setIsMarkModalOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Marcar como auditado"
              >
                <Text style={[modalStyles.btnText, { color: colors.textButton }]}>Auditar</Text>
              </Pressable>

              <Pressable
                style={[modalStyles.btn, { backgroundColor: colors.error, borderRadius: radii.md }]}
                onPress={() => {
                  if (!markTargetId) return;
                  if (__DEV__) console.debug(`Mark action: Sin auditar on ${markTargetId}`);
                  setItems(prev => prev.map(t => (t.unique_id === markTargetId ? { ...t, audited: false } : t)));
                  setIsMarkModalOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Marcar como pendiente"
              >
                <Text style={[modalStyles.btnText, { color: colors.textButton }]}>Sin auditar</Text>
              </Pressable>
            </View>

            <Pressable style={modalStyles.cancel} onPress={() => setIsMarkModalOpen(false)} accessibilityRole="button" accessibilityLabel="Cancelar">
              <Text style={[modalStyles.cancelText, { color: colors.textPrimary }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {},
  row: { flexDirection: 'row', marginTop: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  filterRow: { flexWrap: 'wrap' },
  halfField: { flex: 1, minWidth: 140 },
  halfFieldOffset: { marginLeft: 8, minWidth: 140 },
  flexContent: { flex: 1 },
  filterLabel: { fontWeight: '600', marginTop: 8 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  filterActive: {},
  searchBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { fontWeight: '700' },
  filterSummary: { marginTop: 8 },
  map: { height: 300, borderRadius: 12 },
  tagListContainer: { height: 250 },
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
  detailTitle: {},
  detailSubtitle: {
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
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '600',
  },
  detailTimestamp: {
    marginTop: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  itemSelected: { borderRadius: 8, paddingHorizontal: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  itemTitle: {},
  itemMeta: { marginTop: 2 },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: 300, padding: 16, alignItems: 'center' },
  title: { marginBottom: 12 },
  buttonsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 12 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
  btnText: { fontWeight: '700' },
  cancel: { paddingVertical: 8 },
  cancelText: {},
});
