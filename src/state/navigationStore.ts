/**
 * @module state/navigationStore
 *
 * Store Zustand para manejar el estado del modo de navegación tipo Waze.
 *
 * Proporciona:
 * - Control del modo de navegación (activo/inactivo)
 * - Tracking de posición del usuario
 * - Cálculo automático del tag más cercano pendiente
 * - Detección de llegada por radio GPS configurable
 * - Modal de acciones al llegar (auditar / saltar)
 * - Lista de tags saltados solo en la sesión actual
 *
 * @example
 * ```typescript
 * import { useNavigationStore } from '../state/navigationStore';
 *
 * function MyComponent() {
 *   const {
 *     isNavigationActive,
 *     nearestTag,
 *     distanceToNearest,
 *     startNavigation,
 *     stopNavigation,
 *   } = useNavigationStore();
 *
 *   return (
 *     <Button
 *       onPress={() => (isNavigationActive ? stopNavigation() : startNavigation(tags))}
 *       title={isNavigationActive ? 'Detener' : 'Navegar'}
 *     />
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import type { Tag } from '../data/tagService';
import {
  getNearestUncAuditTag,
  bearing as calcBearing,
  distance as calcDistance,
} from '../domain/farm/geoUtils';
import type { GeoPosition } from '../domain/farm/geoUtils';
import { useSettingsStore } from './settingsStore';

/**
 * Estado de navegación
 */
export type NavigationState = {
  /** Si el modo de navegación está activo */
  isNavigationActive: boolean;

  /** Posición actual del usuario */
  userPosition: GeoPosition | null;

  /** Si se está buscando la posición GPS */
  isSearchingPosition: boolean;

  /** Error al obtener posición */
  positionError: string | null;

  /** Tag destino actual (más cercano pendiente) */
  nearestTag: Tag | null;

  /** Distancia al tag destino en metros */
  distanceToNearest: number | null;

  /** Dirección al tag destino en grados (0-360) */
  bearingToNearest: number | null;

  /** Lista de tags actual (para recálculos) */
  currentTags: Tag[];

  /** UUIDs de tags saltados solo en esta sesión de navegación */
  skippedTagUuids: string[];

  /** Radio GPS (m) para detectar llegada al tag destino */
  arrivalRadiusMeters: number | null;

  /** Si el modal de acciones de llegada está visible */
  isArrivalModalVisible: boolean;

  /** UUID del tag por el que ya se mostró el modal de llegada (evita re-prompt) */
  lastArrivalPromptedTagUuid: string | null;
};

/**
 * Acciones del store de navegación
 */
export type NavigationActions = {
  /**
   * Activa el modo de navegación
   * @param tags - Lista de tags disponibles para calcular el más cercano
   */
  startNavigation: (tags: Tag[]) => void;

  /**
   * Desactiva el modo de navegación y limpia el estado
   */
  stopNavigation: () => void;

  /**
   * Actualiza la posición del usuario y recalcula el tag más cercano.
   * Si la distancia es menor o igual al radio configurado, muestra el modal de llegada.
   * @param lat - Latitud actual
   * @param lon - Longitud actual
   */
  updateUserPosition: (lat: number, lon: number) => void;

  /**
   * Establece un error de posición
   * @param error - Mensaje de error
   */
  setPositionError: (error: string) => void;

  /**
   * Recalcula el tag más cercano pendiente de auditoría excluyendo saltados
   */
  recalculateNearest: () => void;

  /**
   * Actualiza la lista de tags (útil después de auditar uno)
   * @param tags - Nueva lista de tags
   */
  setCurrentTags: (tags: Tag[]) => void;

  /**
   * Salta el tag destino actual solo en esta sesión.
   * No modifica audit_status; lo excluye del cálculo de cercanía.
   */
  skipCurrentTag: () => void;

  /**
   * Muestra el modal de acciones de llegada
   */
  showArrivalModal: () => void;

  /**
   * Oculta el modal de acciones de llegada.
   * @param options.resetPrompt - Si es true, permite volver a preguntar por el mismo tag
   */
  hideArrivalModal: (options?: { resetPrompt?: boolean }) => void;

  /**
   * Cierra el modal tras resolver la acción (auditar o saltar) y recalcula el destino.
   */
  completeArrivalAction: () => void;

  /**
   * Establece el radio de llegada en el store de navegación
   * (se sincroniza desde settingsStore al iniciar navegación)
   */
  setArrivalRadius: (meters: number | null) => void;
};

/**
 * Estado inicial del store
 */
const initialState: NavigationState = {
  isNavigationActive: false,
  userPosition: null,
  isSearchingPosition: false,
  positionError: null,
  nearestTag: null,
  distanceToNearest: null,
  bearingToNearest: null,
  currentTags: [],
  skippedTagUuids: [],
  arrivalRadiusMeters: null,
  isArrivalModalVisible: false,
  lastArrivalPromptedTagUuid: null,
};

function computeTarget(
  tags: Tag[],
  userPosition: GeoPosition | null,
  excludeUuids: string[],
): { nearestTag: Tag | null; distance: number | null; bearing: number | null } {
  if (!userPosition || tags.length === 0) {
    return { nearestTag: null, distance: null, bearing: null };
  }

  const nearestTag = getNearestUncAuditTag(tags, userPosition, excludeUuids);
  if (!nearestTag) {
    return { nearestTag: null, distance: null, bearing: null };
  }

  const targetPos: GeoPosition = { lat: nearestTag.lat, lon: nearestTag.lon };
  return {
    nearestTag,
    distance: calcDistance(userPosition, targetPos),
    bearing: calcBearing(userPosition, targetPos),
  };
}

function shouldPromptArrival(
  state: NavigationState,
  distance: number | null,
  nearestTag: Tag | null,
): boolean {
  if (state.isArrivalModalVisible) return false;
  if (state.arrivalRadiusMeters == null) return false;
  if (distance == null || nearestTag == null) return false;
  if (state.lastArrivalPromptedTagUuid === nearestTag.uuid) return false;
  return distance <= state.arrivalRadiusMeters;
}

/**
 * Store de navegación global
 */
export const useNavigationStore = create<NavigationState & NavigationActions>((set, get) => ({
  ...initialState,

  startNavigation: (tags: Tag[]) => {
    const state = get();
    const radius = useSettingsStore.getState().arrivalRadiusMeters;

    const target = computeTarget(tags, state.userPosition, []);

    set({
      isNavigationActive: true,
      currentTags: tags,
      nearestTag: target.nearestTag,
      distanceToNearest: target.distance,
      bearingToNearest: target.bearing,
      isSearchingPosition: !state.userPosition,
      positionError: null,
      skippedTagUuids: [],
      arrivalRadiusMeters: radius,
      isArrivalModalVisible: false,
      lastArrivalPromptedTagUuid: null,
    });
  },

  stopNavigation: () => {
    set({
      ...initialState,
      currentTags: [],
      skippedTagUuids: [],
    });
  },

  updateUserPosition: (lat: number, lon: number) => {
    const state = get();
    const newPosition: GeoPosition = { lat, lon };

    const target = computeTarget(state.currentTags, newPosition, state.skippedTagUuids);
    const arrived = shouldPromptArrival(state, target.distance, target.nearestTag);

    set({
      userPosition: newPosition,
      isSearchingPosition: false,
      positionError: null,
      nearestTag: target.nearestTag,
      distanceToNearest: target.distance,
      bearingToNearest: target.bearing,
      isArrivalModalVisible: arrived ? true : state.isArrivalModalVisible,
      lastArrivalPromptedTagUuid: arrived
        ? target.nearestTag?.uuid ?? null
        : state.lastArrivalPromptedTagUuid,
    });
  },

  setPositionError: (error: string) => {
    set({
      positionError: error,
    });
  },

  recalculateNearest: () => {
    const state = get();

    if (!state.userPosition || state.currentTags.length === 0) {
      set({
        nearestTag: null,
        distanceToNearest: null,
        bearingToNearest: null,
      });
      return;
    }

    const target = computeTarget(
      state.currentTags,
      state.userPosition,
      state.skippedTagUuids,
    );

    set({
      nearestTag: target.nearestTag,
      distanceToNearest: target.distance,
      bearingToNearest: target.bearing,
      // New target: allow arrival prompt again for the new tag
      lastArrivalPromptedTagUuid:
        target.nearestTag?.uuid !== state.nearestTag?.uuid
          ? null
          : state.lastArrivalPromptedTagUuid,
    });
  },

  setCurrentTags: (tags: Tag[]) => {
    const state = get();

    set({
      currentTags: tags,
    });

    if (state.isNavigationActive) {
      state.recalculateNearest();
    }
  },

  skipCurrentTag: () => {
    const state = get();
    if (!state.nearestTag) {
      return;
    }

    const skippedTagUuids = Array.from(
      new Set([...state.skippedTagUuids, state.nearestTag.uuid]),
    );

    const target = computeTarget(
      state.currentTags,
      state.userPosition,
      skippedTagUuids,
    );

    set({
      skippedTagUuids,
      nearestTag: target.nearestTag,
      distanceToNearest: target.distance,
      bearingToNearest: target.bearing,
      isArrivalModalVisible: false,
      lastArrivalPromptedTagUuid: null,
    });
  },

  showArrivalModal: () => {
    set({ isArrivalModalVisible: true });
  },

  hideArrivalModal: (options?: { resetPrompt?: boolean }) => {
    const state = get();
    set({
      isArrivalModalVisible: false,
      lastArrivalPromptedTagUuid: options?.resetPrompt
        ? null
        : state.lastArrivalPromptedTagUuid,
    });
  },

  completeArrivalAction: () => {
    const state = get();
    set({
      isArrivalModalVisible: false,
      lastArrivalPromptedTagUuid: null,
    });
    state.recalculateNearest();
  },

  setArrivalRadius: (meters: number | null) => {
    set({ arrivalRadiusMeters: meters });
  },
}));

/**
 * Selector para obtener solo el estado de navegación (sin acciones)
 */
export const selectNavigationState = (state: NavigationState & NavigationActions) => ({
  isNavigationActive: state.isNavigationActive,
  userPosition: state.userPosition,
  isSearchingPosition: state.isSearchingPosition,
  positionError: state.positionError,
  nearestTag: state.nearestTag,
  distanceToNearest: state.distanceToNearest,
  bearingToNearest: state.bearingToNearest,
  skippedTagUuids: state.skippedTagUuids,
  arrivalRadiusMeters: state.arrivalRadiusMeters,
  isArrivalModalVisible: state.isArrivalModalVisible,
  lastArrivalPromptedTagUuid: state.lastArrivalPromptedTagUuid,
});

/**
 * Selector para obtener solo las acciones de navegación
 */
export const selectNavigationActions = (state: NavigationState & NavigationActions) => ({
  startNavigation: state.startNavigation,
  stopNavigation: state.stopNavigation,
  updateUserPosition: state.updateUserPosition,
  setPositionError: state.setPositionError,
  recalculateNearest: state.recalculateNearest,
  setCurrentTags: state.setCurrentTags,
  skipCurrentTag: state.skipCurrentTag,
  showArrivalModal: state.showArrivalModal,
  hideArrivalModal: state.hideArrivalModal,
  completeArrivalAction: state.completeArrivalAction,
  setArrivalRadius: state.setArrivalRadius,
});

export default useNavigationStore;
