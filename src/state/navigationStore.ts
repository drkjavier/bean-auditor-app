/**
 * @module state/navigationStore
 * 
 * Store Zustand para manejar el estado del modo de navegación.
 * 
 * Proporciona:
 * - Control del modo de navegación (activo/inactivo)
 * - Tracking de posición del usuario
 * - Cálculo automático del tag más cercano pendiente
 * - Bearing y distance al tag destino
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
 *     stopNavigation 
 *   } = useNavigationStore();
 * 
 *   return (
 *     <Button 
 *       onPress={() => isNavigationActive ? stopNavigation() : startNavigation(tags)}
 *       title={isNavigationActive ? 'Detener' : 'Navegar'}
 *     />
 *   );
 * }
 * ```
 */

import { create } from 'zustand';
import type { Tag } from '../data/mocks/tagsMock';
import { 
  getNearestUncAuditTag, 
  bearing as calcBearing, 
  distance as calcDistance 
} from '../domain/farm/geoUtils';
import type { GeoPosition } from '../domain/farm/geoUtils';

/**
 * Estado de navegación
 */
export type NavigationState = {
  /** Si el modo de navegación está activo */
  isNavigationActive: boolean;
  
  /** Posición actual del usuario */
  userPosition: GeoPosition | null;
  
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
   * Actualiza la posición del usuario y recalcula el tag más cercano
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
   * Recalcula el tag más cercano pendiente de auditoría
   * Usa la posición y tags actuales del store
   */
  recalculateNearest: () => void;
  
  /**
   * Actualiza la lista de tags (útil después de auditar uno)
   * @param tags - Nueva lista de tags
   */
  setCurrentTags: (tags: Tag[]) => void;
};

/**
 * Estado inicial del store
 */
const initialState: NavigationState = {
  isNavigationActive: false,
  userPosition: null,
  positionError: null,
  nearestTag: null,
  distanceToNearest: null,
  bearingToNearest: null,
  currentTags: [],
};

/**
 * Store de navegación global
 */
export const useNavigationStore = create<NavigationState & NavigationActions>((set, get) => ({
  ...initialState,
  
  startNavigation: (tags: Tag[]) => {
    const state = get();
    
    // Calcular tag más cercano inmediatamente si hay posición
    let nearestTag: Tag | null = null;
    let distance: number | null = null;
    let bearing: number | null = null;
    
    if (state.userPosition) {
      nearestTag = getNearestUncAuditTag(tags, state.userPosition);
      
      if (nearestTag) {
        distance = calcDistance(state.userPosition, { lat: nearestTag.lat, lon: nearestTag.lon });
        bearing = calcBearing(state.userPosition, { lat: nearestTag.lat, lon: nearestTag.lon });
      }
    }
    
    set({
      isNavigationActive: true,
      currentTags: tags,
      nearestTag,
      distanceToNearest: distance,
      bearingToNearest: bearing,
      positionError: null,
    });
  },
  
  stopNavigation: () => {
    set({
      ...initialState,
      currentTags: [], // Limpiar tags al detener
    });
  },
  
  updateUserPosition: (lat: number, lon: number) => {
    const state = get();
    const newPosition: GeoPosition = { lat, lon };
    
    // Recalcular nearest tag con la nueva posición
    let nearestTag: Tag | null = null;
    let distance: number | null = null;
    let bearing: number | null = null;
    
    if (state.currentTags.length > 0) {
      nearestTag = getNearestUncAuditTag(state.currentTags, newPosition);
      
      if (nearestTag) {
        distance = calcDistance(newPosition, { lat: nearestTag.lat, lon: nearestTag.lon });
        bearing = calcBearing(newPosition, { lat: nearestTag.lat, lon: nearestTag.lon });
      }
    }
    
    set({
      userPosition: newPosition,
      positionError: null,
      nearestTag,
      distanceToNearest: distance,
      bearingToNearest: bearing,
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
    
    const nearestTag = getNearestUncAuditTag(state.currentTags, state.userPosition);
    
    let distance: number | null = null;
    let bearing: number | null = null;
    
    if (nearestTag) {
      distance = calcDistance(state.userPosition, { lat: nearestTag.lat, lon: nearestTag.lon });
      bearing = calcBearing(state.userPosition, { lat: nearestTag.lat, lon: nearestTag.lon });
    }
    
    set({
      nearestTag,
      distanceToNearest: distance,
      bearingToNearest: bearing,
    });
  },
  
  setCurrentTags: (tags: Tag[]) => {
    const state = get();
    
    set({
      currentTags: tags,
    });
    
    // Recalcular nearest tag con los nuevos tags
    if (state.isNavigationActive) {
      state.recalculateNearest();
    }
  },
}));

/**
 * Selector para obtener solo el estado de navegación (sin acciones)
 * Útil para componentes que solo necesitan leer el estado
 */
export const selectNavigationState = (state: NavigationState & NavigationActions) => ({
  isNavigationActive: state.isNavigationActive,
  userPosition: state.userPosition,
  positionError: state.positionError,
  nearestTag: state.nearestTag,
  distanceToNearest: state.distanceToNearest,
  bearingToNearest: state.bearingToNearest,
});

/**
 * Selector para obtener solo las acciones de navegación
 * Útil para componentes que solo necesitan ejecutar acciones
 */
export const selectNavigationActions = (state: NavigationState & NavigationActions) => ({
  startNavigation: state.startNavigation,
  stopNavigation: state.stopNavigation,
  updateUserPosition: state.updateUserPosition,
  setPositionError: state.setPositionError,
  recalculateNearest: state.recalculateNearest,
  setCurrentTags: state.setCurrentTags,
});

export default useNavigationStore;
