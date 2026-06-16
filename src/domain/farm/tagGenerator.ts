/**
 * Tag Generator — Generates Tag data for N hectares of banana plantation
 * based on a planting pattern.
 *
 * Takes a center point (lat/lon) and generates all Tag objects for a
 * grid of hectares around it, using the specified planting pattern.
 *
 * @module domain/farm/tagGenerator
 */

import type { AuditStatus } from '../audit/AuditRecord';
import { TAG_COLOR_HEXES } from '../constants/tagColors';
import { generateHectarePositions, computeFieldLayout } from './plantingPattern';
import type { PatternType } from './plantingPattern';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Meters per degree of latitude (approximate) */
const METERS_PER_DEG_LAT = 111_320;

/** Hectare side length in meters */
const HECTARE_SIZE = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a latitude to meters-per-degree-longitude.
 * Longitude degrees shrink as you move away from the equator.
 */
function metersPerDegLon(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

/**
 * Generate a UUID v4-like string with a sequential suffix.
 */
function makeUuid(seq: number): string {
  const prefix = '550e8400-e29b-41d4-a716';
  return `${prefix}-${String(seq).padStart(12, '0')}`;
}

/**
 * Generate a unique tag ID like TAG-TIQ-000001.
 */
function makeTagId(seq: number): string {
  return `TAG-TIQ-${String(seq).padStart(6, '0')}`;
}

/**
 * Generate an ISO timestamp for the tag (recent past).
 */
function makeTimestamp(seq: number): string {
  // Spread timestamps over the last 90 days deterministically
  const daysAgo = ((seq * 137) % 90);
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

/**
 * Deterministic audit status based on sequence number.
 */
function makeAuditStatus(seq: number): AuditStatus | null {
  const mod = seq % 5;
  if (mod === 0) return 'audited';
  if (mod === 1) return 'not_audited';
  if (mod === 2) return 'pending';
  return null; // 60% unassigned for realism
}

// ── Tag type (matches the one in data/mocks/tagsMock) ─────────────────────────

/**
 * Shape of a generated tag, compatible with the app's Tag type.
 * Defined here to avoid circular dependency with data layer.
 */
export interface GeneratedTag {
  uuid: string;
  colorHex: string;
  unique_id: string;
  lat: number;
  lon: number;
  timestamp: string;
  audit_status: AuditStatus | null;
  sync_pending: boolean;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface TagGenerationParams {
  /** Center latitude of the plantation */
  centerLat: number;
  /** Center longitude of the plantation */
  centerLon: number;
  /** Number of hectares per side (3 = 3×3 grid = 9 ha) */
  hectaresPerSide: number;
  /** Target plants per hectare */
  plantsPerHectare: number;
  /** Planting pattern type */
  patternType: PatternType;
  /** Row spacing override (only for 'mixed' pattern) */
  rowSpacing?: number;
  /** Plant spacing override (only for 'mixed' pattern) */
  plantSpacing?: number;
  /** Starting sequence number for tag IDs (default: 1) */
  startSeq?: number;
  /** Optional existing center tag to preserve at the exact center */
  centerTag?: GeneratedTag;
}

export interface GenerationResult {
  /** All generated tags */
  tags: GeneratedTag[];
  /** Metrics per hectare */
  hectareMetrics: {
    gridRow: number;
    gridCol: number;
    plantCount: number;
    rowSpacing: number;
    plantSpacing: number;
  }[];
  /** Total plants generated */
  totalPlants: number;
  /** The tag at the center of the grid (preserved or first generated) */
  centerTag: GeneratedTag;
}

/**
 * Generate all Tag objects for a grid of hectares.
 *
 * @example
 * ```ts
 * const result = generateTags({
 *   centerLat: 14.283333,
 *   centerLon: -91.366667,
 *   hectaresPerSide: 3,
 *   plantsPerHectare: 1700,
 *   patternType: 'mixed',
 * });
 * console.log(result.totalPlants); // ≈ 15,300
 * ```
 */
export function generateTags(params: TagGenerationParams): GenerationResult {
  const {
    centerLat,
    centerLon,
    hectaresPerSide,
    plantsPerHectare,
    patternType,
    rowSpacing,
    plantSpacing,
    startSeq = 1,
    centerTag,
  } = params;

  // Pre-compute the field layout for metrics
  const layout = computeFieldLayout(patternType, plantsPerHectare, rowSpacing, plantSpacing);

  // Conversion factors
  const degPerMLat = 1 / METERS_PER_DEG_LAT;
  const degPerMLon = 1 / metersPerDegLon(centerLat);

  // Total grid extent in meters
  const totalMeters = hectaresPerSide * HECTARE_SIZE;
  // The center point is the center of the grid
  const halfTotalMeters = totalMeters / 2;

  const tags: GeneratedTag[] = [];
  const hectareMetrics: GenerationResult['hectareMetrics'] = [];

  let seq = startSeq;

  // Track if we've placed the center tag
  let placedCenterTag = false;
  let resolvedCenterTag: GeneratedTag | null = centerTag ?? null;

  // Iterate over the hectare grid
  const mid = Math.floor(hectaresPerSide / 2); // center hectare index

  for (let gridRow = 0; gridRow < hectaresPerSide; gridRow++) {
    for (let gridCol = 0; gridCol < hectaresPerSide; gridCol++) {
      // Top-left of this hectare in meters from center
      const haLeftM = gridCol * HECTARE_SIZE - halfTotalMeters;
      const haTopM = gridRow * HECTARE_SIZE - halfTotalMeters;

      // Generate plant positions for this hectare
      const positions = generateHectarePositions(
        patternType,
        plantsPerHectare,
        rowSpacing,
        plantSpacing,
      );

      // Is this the center hectare?
      const isCenterHectare = gridRow === mid && gridCol === mid;

      for (const pos of positions) {
        // Absolute position in meters from center
        const absXMeters = haLeftM + pos.x;
        const absYMeters = haTopM + pos.y;

        // Convert to lat/lon
        const lat = +(centerLat + absYMeters * degPerMLat).toFixed(7);
        const lon = +(centerLon + absXMeters * degPerMLon).toFixed(7);

        // If this is the center hectare and we have a center tag to preserve,
        // check if this position is close to the center
        if (isCenterHectare && centerTag && !placedCenterTag) {
          const distToCenter = Math.sqrt(absXMeters ** 2 + absYMeters ** 2);
          // Use center tag for the plant closest to center
          if (distToCenter < HECTARE_SIZE / Math.max(layout.rows, layout.cols)) {
            tags.push({
              ...centerTag,
              lat,
              lon,
            });
            resolvedCenterTag = { ...centerTag, lat, lon };
            placedCenterTag = true;
            seq++;
            continue;
          }
        }

        // Pick a color deterministically from the available colors
        const colorHex = TAG_COLOR_HEXES[seq % TAG_COLOR_HEXES.length];

        tags.push({
          uuid: makeUuid(seq),
          colorHex,
          unique_id: makeTagId(seq),
          lat,
          lon,
          timestamp: makeTimestamp(seq),
          audit_status: makeAuditStatus(seq),
          sync_pending: false,
        });

        seq++;
      }

      hectareMetrics.push({
        gridRow,
        gridCol,
        plantCount: positions.length,
        rowSpacing: layout.rowSpacing,
        plantSpacing: layout.plantSpacing,
      });
    }
  }

  // If no center tag was provided, use the tag closest to center
  if (!resolvedCenterTag) {
    let closest = tags[0];
    let minDist = Infinity;
    for (const tag of tags) {
      const dLat = tag.lat - centerLat;
      const dLon = tag.lon - centerLon;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < minDist) {
        minDist = dist;
        closest = tag;
      }
    }
    resolvedCenterTag = closest;
  }

  return {
    tags,
    hectareMetrics,
    totalPlants: tags.length,
    centerTag: resolvedCenterTag,
  };
}

/**
 * Generate a square plantation grid with 1,700 plants per hectare.
 *
 * @param centerLat     Center latitude
 * @param centerLon     Center longitude
 * @param hectaresPerSide Number of hectares per side (2 = 2×2 = 4 ha, 3 = 3×3 = 9 ha)
 * @param plantsPerHectare Plants per hectare (default: 1 700)
 * @param patternType   Planting pattern (default: 'mixed')
 * @param centerTag     Optional existing tag to preserve at center
 */
export function generateStandardPlantation(
  centerLat: number,
  centerLon: number,
  hectaresPerSide: number = 3,
  plantsPerHectare: number = 1700,
  patternType: PatternType = 'mixed',
  centerTag?: GeneratedTag,
): GenerationResult {
  return generateTags({
    centerLat,
    centerLon,
    hectaresPerSide,
    plantsPerHectare,
    patternType,
    rowSpacing: patternType === 'mixed' ? 100 / Math.round(100 / 3) : undefined,
    plantSpacing: patternType === 'mixed' ? 100 / Math.round(100 / 2) : undefined,
    startSeq: 1,
    centerTag,
  });
}
