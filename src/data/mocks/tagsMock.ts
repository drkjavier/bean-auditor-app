/**
 * Mock data: ~50 tags simulating a small sample plantation (1 ha).
 *
 * Each hectare uses a mixed pattern (hileras) with wide rows (10 m) and
 * close plants within the row (20 m): 10 rows × 5 plants = 50 tags.
 *
 * The grid is centered on Finca bananera Tiquisate, Guatemala:
 *   Center: 14.283333, -91.366667
 *
 * The CENTER tag is the one closest to the center point. It can be used as
 * the reference point for NFC workflows.
 *
 * @module data/mocks/tagsMock
 */

import { generateTags } from '../../domain/farm/tagGenerator';
import type { AuditStatus } from '../../domain/audit/AuditRecord';

// ── Tag Type ──────────────────────────────────────────────────────────────────

export type Tag = {
  uuid: string;
  colorHex: string;
  unique_id: string;
  lat: number;
  lon: number;
  timestamp: string;
  audit_status: AuditStatus | null;
  sync_pending: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const LAT_BASE = 14.283333;
const LON_BASE = -91.366667;

// ── Generation ────────────────────────────────────────────────────────────────

/**
 * The full plantation generation result — 1 hectare sample (10 rows × 5 plants).
 * Generated once at module load time.
 */
const generationResult = generateTags({
  centerLat: LAT_BASE,
  centerLon: LON_BASE,
  hectaresPerSide: 1,
  plantsPerHectare: 50,
  patternType: 'mixed',
  rowSpacing: 10,
  plantSpacing: 20,
});

/** All ~50 tags for the 1-hectare sample plantation */
export const tagsMock: Tag[] = generationResult.tags as Tag[];

/** The tag closest to the center of the grid */
export const centerTag: Tag = generationResult.centerTag as Tag;

/** Per-hectare metrics */
export const { hectareMetrics } = generationResult;

/** Total plant count */
export const { totalPlants } = generationResult;

// ── Dev helper ────────────────────────────────────────────────────────────────

/**
 * Return a summary string describing the mock plantation.
 */
export function getPlantationSummary(): string {
  const ha = hectareMetrics;
  const totalHa = ha.length;
  const avgPlants = totalPlants / totalHa;
  const firstHa = ha[0];
  return (
    `${totalHa} hectárea(s) · ` +
    `${totalPlants} plantas totales · ` +
    `~${Math.round(avgPlants)} plantas/ha · ` +
    `Patrón: mixto (${firstHa.rowSpacing.toFixed(2)}m × ${firstHa.plantSpacing.toFixed(2)}m) · ` +
    `Centro: ${centerTag.unique_id} @ (${LAT_BASE}, ${LON_BASE})`
  );
}
