import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal, ScrollView, TextInput } from 'react-native';
import { fetchTags, saveTagAudit, Tag } from '../../data/tagService';
import { AuditStatus } from '../../domain/audit/AuditRecord';
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
import MdiIcon from '../components/MdiIcon';
import { useAuthStore } from '../../stores';

const FILTER_DEBOUNCE_MS = 350;

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

const ALL_AUDIT_STATUSES: AuditStatus[] = ['audited', 'not_audited', 'pending'];

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
  const [auditAction, setAuditAction] = useState<AuditStatus | null>(null);
  const [auditNote, setAuditNote] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | undefined>(undefined);
  const [auditStatusFilter, setAuditStatusFilter] = useState<AuditStatus | undefined>(undefined);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const showUserLocation = useSettingsStore(state => state.showUserLocation);

  const filters = useMemo(
    () => ({
      color: colorFilter,
      audit_status: auditStatusFilter,
      from: from || undefined,
      to: to || undefined,
    }),
    [colorFilter, auditStatusFilter, from, to],
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
    if (auditStatusFilter) parts.push(getAuditStatusLabel(auditStatusFilter));
    if (from) parts.push(`Desde ${new Date(from).toLocaleDateString()}`);
    if (to) parts.push(`Hasta ${new Date(to).toLocaleDateString()}`);

    return parts.length > 0 ? parts.join(' · ') : 'Sin filtros activos';
  }, [colorFilter, auditStatusFilter, from, to]);

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

  const markTargetTag = useMemo(
    () => (markTargetId ? filtered.find(item => item.unique_id === markTargetId) ?? null : null),
    [filtered, markTargetId],
  );

  const closeMarkModal = useCallback(() => {
    setIsMarkModalOpen(false);
    setAuditAction(null);
    setAuditNote('');
  }, []);

  const openMarkModal = useCallback((unique_id: string) => {
    setMarkTargetId(unique_id);
    setAuditAction(null);
    setAuditNote('');
    setIsMarkModalOpen(true);
  }, []);

  const handleConfirmAudit = useCallback(async () => {
    if (!markTargetTag || !auditAction) return;

    if (auditAction === 'not_audited' && !auditNote.trim()) {
      return;
    }

    try {
      await saveTagAudit(markTargetTag.uuid, auditAction, {
        note: auditAction === 'not_audited' ? auditNote.trim() : null,
      });

      // Refresh list so the new status is reflected
      load(false, filters, filtersKey);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to save audit', err);
    } finally {
      closeMarkModal();
    }
  }, [markTargetTag, auditAction, auditNote, closeMarkModal, filters, filtersKey, load]);

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
            <Pressable
              style={[styles.filterBtn, { borderColor: colors.border }, auditStatusFilter === undefined ? [styles.filterActive, { backgroundColor: colors.primaryTonal }] : null]}
              onPress={() => setAuditStatusFilter(undefined)}
              accessibilityRole="button"
              accessibilityState={{ selected: auditStatusFilter === undefined }}
              accessibilityLabel="Filtro: Todos"
            >
              <Text style={{ color: colors.textPrimary, ...typography.caption }}>Todos</Text>
            </Pressable>
            {ALL_AUDIT_STATUSES.map(status => (
              <Pressable
                key={status}
                style={[styles.filterBtn, { borderColor: colors.border }, auditStatusFilter === status ? [styles.filterActive, { backgroundColor: colors.primaryTonal }] : null]}
                onPress={() => setAuditStatusFilter(status)}
                accessibilityRole="button"
                accessibilityState={{ selected: auditStatusFilter === status }}
                accessibilityLabel={`Filtro: ${getAuditStatusLabel(status)}`}
              >
                <Text style={{ color: colors.textPrimary, ...typography.caption }}>{getAuditStatusLabel(status)}</Text>
              </Pressable>
            ))}
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
        <MapCanvas items={filtered} style={styles.map} selectedId={selectedId} onSelect={(item: Tag) => setSelectedId(item.unique_id)} showUserLocation={showUserLocation} />
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
                  Auditoría: {getAuditStatusLabel(selectedItem.audit_status)}
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
                  if (process.env.NODE_ENV !== 'production') console.debug(`Long press detected on tag ${item.unique_id}`);
                  openMarkModal(item.unique_id);
                }}
              >
                <View style={[styles.dot, { backgroundColor: item.colorHex }]} />
                <View style={styles.flexContent}>
                  <Text style={[styles.itemTitle, { color: colors.textPrimary, ...typography.body }]}>{item.unique_id}</Text>
                  <Text style={[styles.itemMeta, { color: colors.textCaption, ...typography.caption }]}>
                    {getAuditStatusLabel(item.audit_status)}
                  </Text>
                </View>
              </TouchableLongPress>
            )}
          />
        </Card>
      </View>

      {/* ── Modal de auditoría ──────────────────────────────────────────── */}
      <Modal visible={isMarkModalOpen} transparent animationType="fade" onRequestClose={closeMarkModal}>
        <View style={modalStyles.backdrop}>
          <View
            style={[modalStyles.container, { borderRadius: radii.lg, backgroundColor: colors.card }]}
            accessibilityRole="alert"
            accessibilityLabel={markTargetTag ? `Auditar tag ${markTargetTag.unique_id}` : 'Auditar tag'}
          >
            {/* ── Header del modal con contexto del tag ──────────────────────── */}
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.textPrimary, ...typography.subtitle }]}>
                Auditar Tag
              </Text>
              {markTargetTag ? (
                <View style={modalStyles.tagInfo}>
                  <View style={[modalStyles.tagSwatch, { backgroundColor: markTargetTag.colorHex }]} />
                  <Text style={[modalStyles.tagId, { color: colors.textCaption, ...typography.body }]}>
                    {markTargetTag.unique_id}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ── Paso 1: Seleccionar acción ─────────────────────────────────── */}
            {auditAction === null ? (
              <View style={modalStyles.buttonsRow}>
                <Pressable
                  style={({ pressed }) => [
                    modalStyles.btn,
                    modalStyles.btnPrimary,
                    { backgroundColor: colors.success, borderRadius: radii.md },
                    pressed && modalStyles.btnPressed,
                  ]}
                  onPress={() => setAuditAction('audited')}
                  accessibilityRole="button"
                  accessibilityLabel="Marcar como auditado"
                >
                  <MdiIcon name="check-circle-outline" size={20} color={colors.textButton} />
                  <Text style={[modalStyles.btnText, { color: colors.textButton }]}>Auditar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    modalStyles.btn,
                    modalStyles.btnSecondary,
                    { borderColor: colors.error, borderRadius: radii.md },
                    pressed && modalStyles.btnPressed,
                  ]}
                  onPress={() => setAuditAction('not_audited')}
                  accessibilityRole="button"
                  accessibilityLabel="Marcar como no auditado"
                >
                  <MdiIcon name="close-circle-outline" size={20} color={colors.error} />
                  <Text style={[modalStyles.btnText, { color: colors.error }]}>No auditar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    modalStyles.btn,
                    modalStyles.btnTertiary,
                    { borderColor: colors.warning, borderRadius: radii.md },
                    pressed && modalStyles.btnPressed,
                  ]}
                  onPress={() => setAuditAction('pending')}
                  accessibilityRole="button"
                  accessibilityLabel="Marcar como pendiente"
                >
                  <MdiIcon name="clock-outline" size={20} color={colors.warning} />
                  <Text style={[modalStyles.btnText, { color: colors.warning }]}>Pendiente</Text>
                </Pressable>
              </View>
            ) : null}

            {/* ── Paso 2: Nota obligatoria para no auditado ──────────────────── */}
            {auditAction === 'not_audited' ? (
              <View style={modalStyles.noteSection}>
                <Text style={[modalStyles.noteLabel, { color: colors.textPrimary, ...typography.caption }]}>
                  Indica la razón por la que no se auditó
                </Text>
                <TextInput
                  style={[
                    modalStyles.noteInput,
                    {
                      borderColor: colors.border,
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                      borderRadius: radii.md,
                    },
                  ]}
                  value={auditNote}
                  onChangeText={setAuditNote}
                  placeholder="Ej: tag dañado, no accesible..."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  accessibilityLabel="Razón de no auditoría"
                  accessibilityHint="Campo obligatorio para guardar el estado no auditado"
                />
                <View style={modalStyles.confirmRow}>
                  <Pressable
                    style={({ pressed }) => [
                      modalStyles.btn,
                      modalStyles.btnSecondary,
                      { borderColor: colors.border, borderRadius: radii.md },
                      pressed && modalStyles.btnPressed,
                    ]}
                    onPress={() => setAuditAction(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Volver a selección"
                  >
                    <Text style={[modalStyles.btnText, { color: colors.textSecondary }]}>Volver</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      modalStyles.btn,
                      modalStyles.btnPrimary,
                      {
                        backgroundColor: auditNote.trim() ? colors.error : colors.muted,
                        borderRadius: radii.md,
                      },
                      pressed && modalStyles.btnPressed,
                    ]}
                    onPress={handleConfirmAudit}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar no auditoría"
                    disabled={!auditNote.trim()}
                  >
                    <Text style={[modalStyles.btnText, { color: colors.textButton }]}>Confirmar</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* ── Confirmación directa para auditado/pendiente ──────────────── */}
            {auditAction === 'audited' || auditAction === 'pending' ? (
              <View style={modalStyles.confirmRow}>
                <Pressable
                  style={({ pressed }) => [
                    modalStyles.btn,
                    modalStyles.btnSecondary,
                    { borderColor: colors.border, borderRadius: radii.md },
                    pressed && modalStyles.btnPressed,
                  ]}
                  onPress={() => setAuditAction(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Volver a selección"
                >
                  <Text style={[modalStyles.btnText, { color: colors.textSecondary }]}>Volver</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    modalStyles.btn,
                    modalStyles.btnPrimary,
                    {
                      backgroundColor: auditAction === 'audited' ? colors.success : colors.warning,
                      borderRadius: radii.md,
                    },
                    pressed && modalStyles.btnPressed,
                  ]}
                  onPress={handleConfirmAudit}
                  accessibilityRole="button"
                  accessibilityLabel={`Confirmar ${getAuditStatusLabel(auditAction)}`}
                >
                  <Text style={[modalStyles.btnText, { color: colors.textButton }]}>
                    Confirmar {getAuditStatusLabel(auditAction)}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* ── Cancelar ───────────────────────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [modalStyles.cancel, pressed && modalStyles.cancelPressed]}
              onPress={closeMarkModal}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={[modalStyles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
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
  map: { height: 435, borderRadius: 12 },
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 320,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  tagId: {
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 6,
  },
  btnPrimary: {
    gap: 8,
  },
  btnSecondary: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    gap: 8,
  },
  btnTertiary: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    gap: 8,
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  noteSection: {
    width: '100%',
    marginBottom: 16,
  },
  noteLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  noteInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  confirmRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelPressed: {
    opacity: 0.6,
  },
  cancelText: {
    fontWeight: '500',
    fontSize: 14,
  },
});
