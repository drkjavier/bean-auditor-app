import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { fetchTags, Tag } from '../../data/tagService';
import { AuditStatus } from '../../domain/audit/AuditRecord';
import { createAndRegisterAbortController, unregisterAbortController, abortAllControllers } from '../../infrastructure/api/abortManager';
import MapCanvas from '../components/MapCanvas';
import NavigationPanel from '../components/NavigationPanel';
import ArrivalActionModal from '../components/ArrivalActionModal';
import ArrivalRadiusModal from '../components/ArrivalRadiusModal';
import { useSettingsStore, canStartNavigationWithoutRadiusModal } from '../../state/settingsStore';
import { useNavigationStore } from '../../state/navigationStore';
import { getNfcService } from '../../data/nfc/nfcServiceLoader';
import {
  extractNfcTagIdentity,
  doesNfcTagMatchDestination,
} from '../../domain/nfc/nfcTagMatcher';
import { useTheme } from '../themes/ThemeContext';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ColorCombobox from '../components/ColorCombobox';
import DatePickerInput from '../components/DatePickerInput';
import TouchableLongPress from '../components/TouchableLongPress';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import MdiIcon from '../components/MdiIcon';
import Button from '../components/Button';
import { useAudit, AuditCounts } from '../hooks/useAudit';
import { getAuditStatusLabel, getStatusBadgeColors } from '../utils/auditStatus';
import { distance as calcDistance, formatDistance } from '../../domain/farm/geoUtils';
import { useAuthStore } from '../../stores';
import * as locationService from '../../infrastructure/locationService';
import { RESULTS } from 'react-native-permissions';

const FILTER_DEBOUNCE_MS = 350;

/** Fixed row height for the tag list so getItemLayout stays accurate. */
const TAG_ROW_HEIGHT = 64;

/** Max characters allowed in the "not audited" reason note. */
const NOTE_MAX_LENGTH = 280;

const ALL_AUDIT_STATUSES: AuditStatus[] = ['audited', 'not_audited', 'pending'];

export default function AuditScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const { colors, typography, spacing, radii, responsiveBreakpoint } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
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
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState(false);
  const [isNfcProcessing, setIsNfcProcessing] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const showUserLocation = useSettingsStore(state => state.showUserLocation);

  // Audit operations (save + counts) via hook: gives isSaving/error feedback.
  const { saveAudit, isSaving, error: saveError, clearError, getAuditCounts } = useAudit();
  const [auditCounts, setAuditCounts] = useState<AuditCounts | null>(null);

  // Navigation mode state
  const {
    isNavigationActive,
    nearestTag,
    distanceToNearest,
    bearingToNearest,
    isSearchingPosition,
    isArrivalModalVisible,
    userPosition,
    skippedTagUuids,
    startNavigation,
    stopNavigation,
    updateUserPosition,
    recalculateNearest,
    skipCurrentTag,
    hideArrivalModal,
    completeArrivalAction,
  } = useNavigationStore();
  const watchIdRef = useRef<number | null>(null);

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

    return parts.length > 0 ? parts.join(' · ') : null;
  }, [colorFilter, auditStatusFilter, from, to]);

  const hasActiveFilters = Boolean(colorFilter || auditStatusFilter || from || to);

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

      // Refresh the global per-status summary (null counts as pending).
      getAuditCounts().then(counts => {
        if (isMounted.current) setAuditCounts(counts);
      });
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
  }, [dateRangeError, filters, filtersKey, getAuditCounts]);

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

  // Transient success feedback after a saved audit.
  useEffect(() => {
    if (!saveSuccess) return undefined;
    const timeout = setTimeout(() => setSaveSuccess(null), 3000);
    return () => clearTimeout(timeout);
  }, [saveSuccess]);

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
    clearError();
  }, [clearError]);

  const openMarkModal = useCallback((unique_id: string) => {
    setMarkTargetId(unique_id);
    setAuditAction(null);
    setAuditNote('');
    clearError();
    setIsMarkModalOpen(true);
  }, [clearError]);

  // Navigation mode handlers
  const startPositionTracking = useCallback(async () => {
    try {
      // Always request permission to trigger the browser/device prompt
      const requestResult = await locationService.requestPermission();

      if (requestResult === RESULTS.GRANTED) {
        // Start watching position
        watchIdRef.current = locationService.watchPosition(
          (position: any) => {
            const { latitude, longitude } = position.coords;
            updateUserPosition(latitude, longitude);
          },
          (error: any) => {
            // Timeout/unavailable errors are recoverable — warn instead of a critical log.
            console.warn('Position tracking error:', error);
          },
          { enableHighAccuracy: true, distanceFilter: 1, interval: 1000 }
        );
      } else if (requestResult === RESULTS.DENIED) {
        Alert.alert('Permiso requerido', 'Necesitamos permiso de ubicación para navegar. Por favor, habilita el permiso en la configuración de tu navegador.');
      } else {
        Alert.alert('Permiso requerido', 'No se pudo obtener permiso de ubicación. Verifica la configuración de tu navegador.');
      }
    } catch (error) {
      console.error('Error starting position tracking:', error);
      Alert.alert('Error', 'No se pudo iniciar el seguimiento de ubicación.');
    }
  }, [updateUserPosition]);

  const stopPositionTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      try {
        locationService.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      } catch {
        // noop
      }
    }
  }, []);

  const handleToggleNavigation = useCallback(() => {
    if (isNavigationActive) {
      stopPositionTracking();
      stopNavigation();
      setArrivalError(null);
      return;
    }

    // Prefer store + storage. If either has a valid radius, skip the modal.
    if (!canStartNavigationWithoutRadiusModal()) {
      setIsRadiusModalOpen(true);
      return;
    }

    startNavigation(filtered);
    startPositionTracking();
  }, [isNavigationActive, filtered, startNavigation, stopNavigation, startPositionTracking, stopPositionTracking]);

  const handleConfirmRadiusAndNavigate = useCallback((meters: number) => {
    useSettingsStore.getState().setArrivalRadius(meters);
    setIsRadiusModalOpen(false);
    startNavigation(filtered);
    startPositionTracking();
  }, [filtered, startNavigation, startPositionTracking]);

  const handleNavigationPress = useCallback(() => {
    // Could open tag details or perform other action
  }, []);

  const handleAuditFromNavigation = useCallback(() => {
    if (nearestTag) {
      openMarkModal(nearestTag.unique_id);
    }
  }, [nearestTag, openMarkModal]);

  const handleNextFromNavigation = useCallback(() => {
    if (nearestTag) {
      skipCurrentTag();
    }
  }, [nearestTag, skipCurrentTag]);

  /**
   * Arrival flow: NFC verification first, then quick audit with GPS position.
   * Cancels audit if NFC fails, is unavailable, or does not match destination.
   */
  const handleArrivalAudit = useCallback(async () => {
    if (!nearestTag || isNfcProcessing) return;

    const target = nearestTag;
    setIsNfcProcessing(true);
    setArrivalError(null);

    try {
      const nfc = await getNfcService();
      const capability = await nfc.checkNfcCapability();

      if (!capability.isSupported || !capability.isEnabled) {
        setArrivalError('NFC no está disponible. La auditoría fue cancelada. Puedes saltar el tag o cerrar.');
        return;
      }

      await nfc.initNfc();
      const tagData = await nfc.readNfcTag();
      const identity = extractNfcTagIdentity(tagData);

      if (!doesNfcTagMatchDestination(identity, target)) {
        setArrivalError(
          'El tag NFC leído no corresponde al destino. La auditoría fue cancelada.',
        );
        return;
      }

      const position = useNavigationStore.getState().userPosition;
      await saveAudit(target.uuid, 'audited', {
        lat: position?.lat ?? null,
        lon: position?.lon ?? null,
      });

      setSaveSuccess('Auditoría registrada');
      completeArrivalAction();
      load(false, filters, filtersKey);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('NFC audit failed', err);
      setArrivalError('No se pudo completar la auditoría NFC. Puedes reintentar, saltar o cerrar.');
    } finally {
      setIsNfcProcessing(false);
    }
  }, [nearestTag, isNfcProcessing, saveAudit, completeArrivalAction, load, filters, filtersKey]);

  const handleArrivalSkip = useCallback(() => {
    setArrivalError(null);
    skipCurrentTag();
  }, [skipCurrentTag]);

  const handleArrivalClose = useCallback(() => {
    setArrivalError(null);
    hideArrivalModal();
  }, [hideArrivalModal]);

  const handleSelectTag = useCallback((item: Tag) => {
    setSelectedId(item.unique_id);
  }, []);

  // Cleanup position tracking on unmount
  useEffect(() => {
    return () => {
      stopPositionTracking();
    };
  }, [stopPositionTracking]);

  // Update navigation tags when filtered list changes
  useEffect(() => {
    if (isNavigationActive) {
      // Use the store's setCurrentTags to update the list
      useNavigationStore.getState().setCurrentTags(filtered);
    }
  }, [filtered, isNavigationActive]);

  const handleConfirmAudit = useCallback(async () => {
    if (!markTargetTag || !auditAction || isSaving) return;

    if (auditAction === 'not_audited' && !auditNote.trim()) {
      return;
    }

    try {
      await saveAudit(markTargetTag.uuid, auditAction, {
        note: auditAction === 'not_audited' ? auditNote.trim() : null,
      });

      // Success: close modal, refresh list and surface transient feedback.
      closeMarkModal();
      setSaveSuccess('Auditoría registrada');
      load(false, filters, filtersKey);

      // If navigation is active, recalculate nearest tag after audit
      if (isNavigationActive) {
        // Small delay to allow the list to refresh
        setTimeout(() => {
          recalculateNearest();
        }, 100);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to save audit', err);
      // Keep the modal open so the user can retry; saveError renders inside it.
    }
  }, [markTargetTag, auditAction, auditNote, isSaving, saveAudit, closeMarkModal, filters, filtersKey, load, isNavigationActive, recalculateNearest]);

  const handleClearFilters = useCallback(() => {
    setColorFilter(undefined);
    setAuditStatusFilter(undefined);
    setFrom('');
    setTo('');
  }, []);

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

  // Responsive map height: full height on wide screens, reduced on narrow ones.
  const mapHeight = windowWidth >= responsiveBreakpoint ? 470 : 320;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}
      accessibilityLabel="Pantalla Auditoría"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.textPrimary, ...typography.h2 }]}>Auditoría</Text>

      {saveSuccess ? (
        <View
          style={[styles.successBanner, { backgroundColor: colors.successTonal, borderColor: colors.success }]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={saveSuccess}
        >
          <MdiIcon name="check-circle-outline" size={16} color={colors.success} />
          <Text style={[styles.successBannerText, { color: colors.success }]}>{saveSuccess}</Text>
        </View>
      ) : null}

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

          {activeFiltersSummary ? (
            <Text style={[styles.filterSummary, { color: colors.textCaption, ...typography.caption }]} accessibilityLabel="Resumen de filtros activos">
              {activeFiltersSummary}
            </Text>
          ) : null}

          <ErrorBanner message={dateRangeError} />

          {hasActiveFilters ? (
            <Pressable
              onPress={handleClearFilters}
              style={styles.clearFiltersBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpiar filtros"
            >
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Limpiar filtros</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => load(false, filters, filtersKey)}
            style={[
              styles.searchBtn,
              { backgroundColor: colors.actionSecondaryBg, borderRadius: radii.md },
              (dateRangeError || loading || autoRefreshing) ? styles.searchBtnDisabled : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Recargar datos"
            disabled={Boolean(dateRangeError) || loading || autoRefreshing}
          >
            {loading || autoRefreshing ? (
              <ActivityIndicator size="small" color={colors.onActionSecondary} />
            ) : null}
            <Text style={[styles.searchBtnText, { color: colors.onActionSecondary }]}>
              {loading || autoRefreshing ? 'Actualizando…' : 'Recargar'}
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* ── Mapa ───────────────────────────────────────────────────────── */}
      <View id="container-mapa" style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Mapa" />
        <MapCanvas
          items={filtered}
          style={{ height: mapHeight, borderRadius: radii.lg }}
          selectedId={selectedId}
          onSelect={handleSelectTag}
          showUserLocation={showUserLocation}
          isNavigationActive={isNavigationActive}
          navigationTarget={nearestTag}
          nearestTagId={nearestTag?.uuid ?? null}
          distanceToTarget={distanceToNearest}
          bearingToTarget={bearingToNearest}
          userPosition={userPosition}
          onNavigationPress={handleNavigationPress}
        />

        {/* Navigation Mode Toggle Button */}
        <Pressable
          style={[
            styles.navigationToggle,
            {
              backgroundColor: isNavigationActive ? colors.primary : colors.primaryTonal,
              borderColor: isNavigationActive ? colors.primaryVariant : colors.primary,
            },
          ]}
          onPress={handleToggleNavigation}
          accessibilityRole="button"
          accessibilityLabel={isNavigationActive ? 'Cerrar modo navegación' : 'Activar modo navegación'}
          accessibilityState={{ selected: isNavigationActive }}
        >
          <MdiIcon
            name={isNavigationActive ? 'compass-off-outline' : 'compass-outline'}
            size={20}
            color={isNavigationActive ? colors.textButton : colors.primary}
          />
          <Text
            style={[
              styles.navigationToggleText,
              { color: isNavigationActive ? colors.textButton : colors.primary },
            ]}
          >
            {isNavigationActive ? 'Cerrar Navegación' : 'Modo Navegación'}
          </Text>
        </Pressable>
      </View>

      {/* ── Navigation Panel ────────────────────────────────────────────── */}
      {isNavigationActive && (
        <View id="container-navigation" style={{ marginTop: spacing.lg }}>
          <NavigationPanel
            targetTag={nearestTag}
            distance={distanceToNearest}
            tagStatus={nearestTag?.audit_status ?? null}
            hasPosition={userPosition !== null}
            isSearchingPosition={isSearchingPosition}
            onAudit={handleAuditFromNavigation}
            onNext={handleNextFromNavigation}
            onClose={handleToggleNavigation}
          />
        </View>
      )}

      {/* ── Arrival action modal (Waze-like) ─────────────────────────────── */}
      <ArrivalActionModal
        visible={isArrivalModalVisible && isNavigationActive}
        targetTag={nearestTag}
        isProcessing={isNfcProcessing}
        errorMessage={arrivalError}
        onAudit={handleArrivalAudit}
        onSkip={handleArrivalSkip}
        onClose={handleArrivalClose}
      />

      {/* ── Arrival radius config modal ──────────────────────────────────── */}
      <ArrivalRadiusModal
        visible={isRadiusModalOpen}
        onCancel={() => setIsRadiusModalOpen(false)}
        onConfirm={handleConfirmRadiusAndNavigate}
      />

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
                <View style={styles.detailBadgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColors(selectedItem.audit_status, colors).background }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusBadgeColors(selectedItem.audit_status, colors).text }]}>
                      {getAuditStatusLabel(selectedItem.audit_status)}
                    </Text>
                  </View>
                  {selectedItem.sync_pending ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.warningTonal }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.warning }]}>Pendiente de sincronizar</Text>
                    </View>
                  ) : null}
                  {isNavigationActive && skippedTagUuids.includes(selectedItem.uuid) ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.infoTonal }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.info }]}>Saltado</Text>
                    </View>
                  ) : null}
                </View>
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
              {userPosition ? (
                <View style={styles.detailCell}>
                  <Text style={[styles.detailLabel, { color: colors.textCaption, ...typography.caption }]}>Distancia</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary, ...typography.body }]}>
                    {formatDistance(calcDistance(userPosition, { lat: selectedItem.lat, lon: selectedItem.lon }))}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.detailTimestamp, { color: colors.textCaption, ...typography.caption }]}>
              Actualizado: {new Date(selectedItem.timestamp).toLocaleString()}
            </Text>

            <View style={styles.detailCta}>
              <Button
                variant="primary"
                onPress={() => openMarkModal(selectedItem.unique_id)}
                accessibilityLabel={`Auditar tag ${selectedItem.unique_id}`}
              >
                Auditar tag
              </Button>
            </View>
          </Card>
        </View>
      ) : null}

      {/* ── Listado de tags ─────────────────────────────────────────────── */}
      <View id="container-tags" style={{ marginTop: spacing.lg }}>
        <SectionHeader title="Tags" subtitle={`Resultados: ${filtered.length}`} />
        {auditCounts ? (
          <View style={styles.countsRow} accessibilityLabel="Resumen por estado de auditoría">
            <View style={[styles.countChip, { backgroundColor: colors.successTonal }]}>
              <Text style={[styles.countChipText, { color: colors.success }]}>{auditCounts.audited} auditados</Text>
            </View>
            <View style={[styles.countChip, { backgroundColor: colors.dangerTonal }]}>
              <Text style={[styles.countChipText, { color: colors.error }]}>{auditCounts.not_audited} no auditados</Text>
            </View>
            <View style={[styles.countChip, { backgroundColor: colors.warningTonal }]}>
              <Text style={[styles.countChipText, { color: colors.warning }]}>{auditCounts.pending} pendientes</Text>
            </View>
          </View>
        ) : null}
        <Card variant="outlined" style={styles.tagListContainer}>
          <FlatList
            ref={listRef}
            data={filtered}
            style={styles.flatList}
            nestedScrollEnabled
            keyExtractor={item => item.unique_id}
            getItemLayout={(_, index) => ({ length: TAG_ROW_HEIGHT, offset: TAG_ROW_HEIGHT * index, index })}
            onScrollToIndexFailed={({ index }) => {
               const offset = Math.max(0, index * TAG_ROW_HEIGHT);
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
            renderItem={({ item }) => {
              const isSkipped = isNavigationActive && skippedTagUuids.includes(item.uuid);
              return (
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
                    <View style={styles.itemTitleRow}>
                      <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.textPrimary, ...typography.body }]}>{item.unique_id}</Text>
                      {item.sync_pending ? (
                        <View style={[styles.miniBadge, { backgroundColor: colors.warningTonal }]}>
                          <Text style={[styles.miniBadgeText, { color: colors.warning }]}>Sync</Text>
                        </View>
                      ) : null}
                      {isSkipped ? (
                        <View style={[styles.miniBadge, { backgroundColor: colors.infoTonal }]}>
                          <Text style={[styles.miniBadgeText, { color: colors.info }]}>Saltado</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.itemMeta, { color: colors.textCaption, ...typography.caption }]}>
                      {getAuditStatusLabel(item.audit_status)}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.itemAction, { borderColor: colors.border }]}
                    onPress={() => openMarkModal(item.unique_id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Auditar tag ${item.unique_id}`}
                    hitSlop={8}
                  >
                    <MdiIcon name="check-circle-outline" size={22} color={colors.primary} />
                  </Pressable>
                </TouchableLongPress>
              );
            }}
          />
        </Card>
      </View>

      {/* ── Modal de auditoría ──────────────────────────────────────────── */}
      <Modal visible={isMarkModalOpen} transparent animationType="fade" onRequestClose={closeMarkModal}>
        <View style={modalStyles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={modalStyles.kav}
          >
            <View
              style={[modalStyles.container, { borderRadius: radii.lg, backgroundColor: colors.card }]}
              accessibilityRole="alert"
              accessibilityViewIsModal
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
                {markTargetTag ? (
                  <View style={modalStyles.tagMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColors(markTargetTag.audit_status, colors).background }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusBadgeColors(markTargetTag.audit_status, colors).text }]}>
                        {getAuditStatusLabel(markTargetTag.audit_status)}
                      </Text>
                    </View>
                    <Text style={[modalStyles.tagTimestamp, { color: colors.textCaption, ...typography.caption }]}>
                      Actualizado: {new Date(markTargetTag.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>

              <ErrorBanner message={saveError} />

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
                    maxLength={NOTE_MAX_LENGTH}
                    textAlignVertical="top"
                    accessibilityLabel="Razón de no auditoría"
                    accessibilityHint="Campo obligatorio para guardar el estado no auditado"
                  />
                  <Text style={[modalStyles.charCounter, { color: colors.textCaption }]}>
                    {auditNote.length}/{NOTE_MAX_LENGTH}
                  </Text>
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
                          backgroundColor: auditNote.trim() && !isSaving ? colors.primary : colors.disabledBg,
                          borderRadius: radii.md,
                        },
                        pressed && modalStyles.btnPressed,
                      ]}
                      onPress={handleConfirmAudit}
                      accessibilityRole="button"
                      accessibilityLabel="Confirmar no auditoría"
                      accessibilityState={{ disabled: !auditNote.trim() || isSaving }}
                      disabled={!auditNote.trim() || isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color={colors.textButton} />
                      ) : (
                        <Text style={[modalStyles.btnText, { color: colors.textButton }]}>Confirmar</Text>
                      )}
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
                      isSaving && modalStyles.btnDisabled,
                      pressed && modalStyles.btnPressed,
                    ]}
                    onPress={handleConfirmAudit}
                    accessibilityRole="button"
                    accessibilityLabel={`Confirmar ${getAuditStatusLabel(auditAction)}`}
                    accessibilityState={{ disabled: isSaving }}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={colors.textButton} />
                    ) : (
                      <Text style={[modalStyles.btnText, { color: colors.textButton }]}>
                        Confirmar
                      </Text>
                    )}
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
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatList: { flex: 1 },
  title: {},
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successBannerText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', marginTop: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  filterRow: { gap: 8 },
  halfField: { flex: 1, minWidth: 140 },
  halfFieldOffset: { marginLeft: 8, minWidth: 140 },
  flexContent: { flex: 1 },
  filterLabel: { fontWeight: '600', marginTop: 8 },
  filterBtn: { flexGrow: 1, flexBasis: 'auto', minHeight: 44, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  filterActive: {},
  searchBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 12 },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { fontWeight: '700' },
  clearFiltersBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginTop: 4 },
  clearFiltersText: { fontWeight: '600', fontSize: 13 },
  filterSummary: { marginTop: 8 },
  tagListContainer: { height: 250 },
  countsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  countChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  countChipText: { fontSize: 12, fontWeight: '600' },
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
  detailBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
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
  detailCta: { marginTop: 12 },
  item: { height: TAG_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 1 },
  itemSelected: { borderRadius: 8 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemAction: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniBadgeText: { fontSize: 10, fontWeight: '700' },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  itemTitle: { flexShrink: 1 },
  itemMeta: { marginTop: 2 },
  navigationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  navigationToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kav: {
    width: '100%',
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
  tagMeta: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  tagTimestamp: {},
  buttonsRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
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
    minHeight: 44,
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
  btnDisabled: {
    opacity: 0.6,
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
    marginBottom: 4,
  },
  charCounter: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    fontSize: 11,
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
