/**
 * Mock data: 6 800 tags simulating 4 hectares (2 × 2) of banana plantation.
 *
 * Each hectare has ~1 700 plants placed in a mixed pattern (hileras) with
 * staggered rows (34 rows × 50 plants = 1 700 plants/ha).
 *
 * The grid is centered on Finca bananera Tiquisate, Guatemala:
 *   Center: 14.283333, -91.366667
 *
 * The CENTER tag is the one closest to the center point (intersection of
 * the 4 hectares). It can be used as the reference point for NFC workflows.
 *
 * @module data/mocks/tagsMock
 */

import { generateStandardPlantation } from '../../domain/farm/tagGenerator';
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
 * The full plantation generation result — 4 hectares (2×2 grid).
 * Generated once at module load time.
 */
const generationResult = generateStandardPlantation(
  LAT_BASE,
  LON_BASE,
  2, // hectaresPerSide: 2×2 = 4 ha
  1700,
  'mixed',
);

/** All 6 800 tags for the 4-hectare plantation */
export const tagsMock: Tag[] = generationResult.tags as Tag[];

/** The tag closest to the center of the 4-hectare grid */
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
    `${totalHa} hectáreas (2×2) · ` +
    `${totalPlants.toLocaleString()} plantas totales · ` +
    `~${Math.round(avgPlants)} plantas/ha · ` +
    `Patrón: mixto (${firstHa.rowSpacing.toFixed(2)}m × ${firstHa.plantSpacing.toFixed(2)}m) · ` +
    `Centro: ${centerTag.unique_id} @ (${LAT_BASE}, ${LON_BASE})`
  );
}
