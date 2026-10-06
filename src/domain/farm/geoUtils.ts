/**
 * @module domain/farm/geoUtils
 * 
 * Funciones de cálculo geoespacial para navegación de auditoría.
 * 
 * Proporciona:
 * - Cálculo de bearing (dirección) entre dos puntos
 * - Cálculo de distancia entre dos puntos
 * - Selección del tag más cercano pendiente de auditoría
 * - Formateo de distancia para UI
 * 
 * @example
 * ```typescript
 * import { bearing, distance, getNearestUncAuditTag, formatDistance } from './geoUtils';
 * 
 * const from = { lat: 14.2833, lon: -91.3667 };
 * const to = { lat: 14.2840, lon: -91.3660 };
 * 
 * console.log(bearing(from, to));  // 45.2 (grados)
 * console.log(distance(from, to)); // 112.5 (metros)
 * console.log(formatDistance(150)); // "150m"
 * ```
 * 
 * @requires @turf/bearing
 * @requires @turf/distance
 * @requires @turf/helpers
 */

import { bearing as turfBearing } from '@turf/bearing';
import { distance as turfDistance } from '@turf/distance';
import { point } from '@turf/helpers';
import type { Tag } from '../../data/mocks/tagsMock';

/**
 * Coordenadas geográficas
 */
export type GeoPosition = {
  lat: number;
  lon: number;
};

/**
 * Calcula la dirección (bearing) en grados desde un punto hacia otro.
 * 
 * @param from - Punto de origen
 * @param to - Punto de destino
 * @returns Ángulo en grados (0-360, donde 0=Norte, 90=Este)
 * 
 * @example
 * ```typescript
 * const from = { lat: 14.2833, lon: -91.3667 };
 * const to = { lat: 14.2840, lon: -91.3660 };
 * const dir = bearing(from, to);
 * // dir ≈ 45.2 (noreste)
 * ```
 */
export function bearing(from: GeoPosition, to: GeoPosition): number {
  const fromPoint = point([from.lon, from.lat]);
  const toPoint = point([to.lon, to.lat]);
  
  const angle = turfBearing(fromPoint, toPoint);
  
  // Convertir de -180..180 a 0..360
  return (angle + 360) % 360;
}

/**
 * Calcula la distancia en metros entre dos puntos geográficos.
 * 
 * @param from - Punto de origen
 * @param to - Punto de destino
 * @returns Distancia en metros
 * 
 * @example
 * ```typescript
 * const from = { lat: 14.2833, lon: -91.3667 };
 * const to = { lat: 14.2840, lon: -91.3660 };
 * const dist = distance(from, to);
 * // dist ≈ 112.5 (metros)
 * ```
 */
export function distance(from: GeoPosition, to: GeoPosition): number {
  const fromPoint = point([from.lon, from.lat]);
  const toPoint = point([to.lon, to.lat]);
  
  // turfDistance retorna kilómetros por defecto
  const km = turfDistance(fromPoint, toPoint);
  
  // Convertir a metros
  return km * 1000;
}

/**
 * Encuentra el tag más cercano que NO esté en estado 'audited'
 * y que no esté en la lista de exclusiones (p.ej. saltados en la sesión).
 *
 * @param tags - Lista de tags disponibles
 * @param userPosition - Posición actual del usuario
 * @param excludeUuids - UUIDs a excluir del cálculo (opcional)
 * @returns El tag pendiente más cercano, o null si no hay pendientes
 *
 * @example
 * ```typescript
 * const userPos = { lat: 14.2833, lon: -91.3667 };
 * const nearest = getNearestUncAuditTag(tags, userPos, ['tag-004']);
 * ```
 */
export function getNearestUncAuditTag(
  tags: Tag[],
  userPosition: GeoPosition,
  excludeUuids: string[] = [],
): Tag | null {
  const excluded = new Set(excludeUuids);
  const unaudited = tags.filter(
    tag => tag.audit_status !== 'audited' && !excluded.has(tag.uuid),
  );

  if (unaudited.length === 0) {
    return null;
  }

  let nearest: Tag | null = null;
  let nearestDistance = Infinity;

  for (const tag of unaudited) {
    const dist = distance(userPosition, { lat: tag.lat, lon: tag.lon });

    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearest = tag;
    }
  }

  return nearest;
}

/**
 * Formatea una distancia en metros para mostrar en UI.
 * 
 * @param meters - Distancia en metros
 * @returns String formateado: "150m" o "2.5km"
 * 
 * @example
 * ```typescript
 * formatDistance(150);   // "150m"
 * formatDistance(999);   // "999m"
 * formatDistance(1000);  // "1.0km"
 * formatDistance(2500);  // "2.5km"
 * formatDistance(0);     // "0m"
 * ```
 */
export function formatDistance(meters: number): string {
  if (meters < 0) {
    return '0m';
  }
  
  if (meters < 1000) {
    // Redondear a número entero para distancias < 1km
    return `${Math.round(meters)}m`;
  }
  
  // Para 1km o más, mostrar con 1 decimal
  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
}

/**
 * Obtiene una descripción legible de la dirección en español.
 * 
 * @param bearingDegrees - Ángulo en grados (0-360)
 * @returns Descripción de la dirección
 * 
 * @example
 * ```typescript
 * getBearingDescription(0);    // "Norte"
 * getBearingDescription(45);   // "Noreste"
 * getBearingDescription(90);   // "Este"
 * getBearingDescription(180);  // "Sur"
 * ```
 */
export function getBearingDescription(bearingDegrees: number): string {
  // Normalizar a 0-360
  const normalized = ((bearingDegrees % 360) + 360) % 360;
  
  const directions = [
    { max: 22.5, name: 'Norte' },
    { max: 67.5, name: 'Noreste' },
    { max: 112.5, name: 'Este' },
    { max: 157.5, name: 'Sureste' },
    { max: 202.5, name: 'Sur' },
    { max: 247.5, name: 'Suroeste' },
    { max: 292.5, name: 'Oeste' },
    { max: 337.5, name: 'Noroeste' },
    { max: 360, name: 'Norte' },
  ];
  
  for (const dir of directions) {
    if (normalized < dir.max) {
      return dir.name;
    }
  }
  
  return 'Norte';
}
