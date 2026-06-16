/**
 * Planting Pattern domain logic.
 *
 * Calculates plant distributions for banana plantations using three pattern types:
 * - grid:     Square grid (marco real). Plants evenly spaced in both directions.
 * - tresbolillo: Triangular/staggered (tresbolillo). Equilateral triangle packing,
 *              each row offset by half the plant spacing for higher density.
 * - mixed:    Mixed pattern (hileras). Wider rows for machinery access, closer
 *              plants within the row, with alternating stagger. Most common in
 *              commercial banana plantations.
 *
 * @module domain/farm/plantingPattern
 */

/** Supported planting pattern types */
export type PatternType = 'grid' | 'tresbolillo' | 'mixed';

/** Input configuration for pattern calculation */
export interface PatternConfig {
  /** Target plants per hectare (typical range: 1 500–1 800) */
  plantsPerHectare: number;
  /** Pattern type selector */
  patternType: PatternType;
  /**
   * Row spacing in meters — only used when patternType === 'mixed'.
   * Default: 3.0
   */
  rowSpacing?: number;
  /**
   * Plant spacing within row in meters — only used when patternType === 'mixed'.
   * Default: 2.0
   */
  plantSpacing?: number;
}

/** A single plant position in meters from origin */
export interface PlantPosition {
  x: number;
  y: number;
}

/** Computed metrics for the pattern */
export interface PatternMetrics {
  /** Minimum distance between two plants in meters */
  distanceBetweenPlants: number;
  /** Area allocated to each plant in m² */
  areaPerPlant: number;
  /** Distance between rows in meters */
  rowSpacing: number;
  /** Distance between plants within a row in meters */
  plantSpacing: number;
  /** Input plants per hectare */
  plantsPerHectare: number;
  /** Estimated total plants that fit in 1 ha with this configuration */
  estimatedTotalPlants: number;
  /** Pattern type label */
  patternType: PatternType;
}

/** Full result of a pattern calculation */
export interface PatternVisualization {
  metrics: PatternMetrics;
  /** Plant positions for a representative sample (used for drawing) */
  samplePositions: PlantPosition[];
  /** Width of the sample area in meters */
  sampleWidth: number;
  /** Height of the sample area in meters */
  sampleHeight: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HECTARE = 10_000; // 1 ha = 100 m × 100 m
const FIELD_SIZE = 100; // side of a square hectare

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Generate plant positions for a rectangular grid with optional stagger.
 *
 * @param rows       Number of rows
 * @param cols       Number of columns per row
 * @param rowSpacing Distance between rows in meters
 * @param colSpacing Distance between columns in meters
 * @param stagger    If true, odd rows are offset by colSpacing / 2
 */
function generatePositions(
  rows: number,
  cols: number,
  rowSpacing: number,
  colSpacing: number,
  stagger: boolean,
): PlantPosition[] {
  const positions: PlantPosition[] = [];

  for (let r = 0; r < rows; r++) {
    const offsetX = stagger && r % 2 === 1 ? colSpacing / 2 : 0;
    for (let c = 0; c < cols; c++) {
      positions.push({ x: c * colSpacing + offsetX, y: r * rowSpacing });
    }
  }

  return positions;
}

/**
 * Clamp a value within a range.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Compute exact row count, column count, and spacings for a given pattern
 * such that the total plants ≈ plantsPerHectare within 100 m × 100 m.
 */
export function computeFieldLayout(
  patternType: PatternType,
  plantsPerHectare: number,
  rowSpacingOverride?: number,
  plantSpacingOverride?: number,
): {
  rows: number;
  cols: number;
  rowSpacing: number;
  plantSpacing: number;
  stagger: boolean;
  totalPlants: number;
} {
  const areaPerPlant = HECTARE / plantsPerHectare;

  switch (patternType) {
    case 'grid': {
      const spacing = Math.sqrt(areaPerPlant);
      const rows = Math.floor(FIELD_SIZE / spacing);
      const cols = Math.floor(FIELD_SIZE / spacing);
      const adjSpacing = FIELD_SIZE / Math.max(rows, 1);
      return {
        rows,
        cols,
        rowSpacing: adjSpacing,
        plantSpacing: adjSpacing,
        stagger: false,
        totalPlants: rows * cols,
      };
    }

    case 'tresbolillo': {
      const d = Math.sqrt((areaPerPlant * 2) / Math.sqrt(3));
      const rowSp = (d * Math.sqrt(3)) / 2;
      const rows = Math.floor(FIELD_SIZE / rowSp);
      const cols = Math.floor(FIELD_SIZE / d);
      const adjRowSpacing = FIELD_SIZE / Math.max(rows, 1);
      const adjPlantSpacing = FIELD_SIZE / Math.max(cols, 1);
      return {
        rows,
        cols,
        rowSpacing: adjRowSpacing,
        plantSpacing: adjPlantSpacing,
        stagger: true,
        totalPlants: rows * cols,
      };
    }

    case 'mixed': {
      const rs = rowSpacingOverride ?? 3.0;
      const ps = plantSpacingOverride ?? 2.0;
      // Solve for exact row/plant spacing that yields 1700 in 100x100
      // Try to get as close as possible by adjusting to exact divisors of 100
      const targetDivisor = Math.round(FIELD_SIZE / rs);
      const actualRowSpacing = FIELD_SIZE / Math.max(targetDivisor, 1);
      const rows = targetDivisor;

      const targetColDivisor = Math.round(FIELD_SIZE / ps);
      const actualPlantSpacing = FIELD_SIZE / Math.max(targetColDivisor, 1);
      const cols = targetColDivisor;

      return {
        rows,
        cols,
        rowSpacing: actualRowSpacing,
        plantSpacing: actualPlantSpacing,
        stagger: true,
        totalPlants: rows * cols,
      };
    }
  }
}

/**
 * Generate ALL plant positions for a full hectare (100 m × 100 m)
 * using the given pattern type and plant count.
 *
 * Positions are centered within the field (start at spacing/2 from edge).
 */
export function generateHectarePositions(
  patternType: PatternType,
  plantsPerHectare: number,
  rowSpacingOverride?: number,
  plantSpacingOverride?: number,
): PlantPosition[] {
  const layout = computeFieldLayout(
    patternType,
    plantsPerHectare,
    rowSpacingOverride,
    plantSpacingOverride,
  );

  const { rows, cols, rowSpacing, plantSpacing, stagger } = layout;

  // Center the grid: start at spacing/2 so plants are centred
  const xStart = plantSpacing / 2;
  const yStart = rowSpacing / 2;

  const positions: PlantPosition[] = [];
  for (let r = 0; r < rows; r++) {
    const offsetX = stagger && r % 2 === 1 ? plantSpacing / 2 : 0;
    for (let c = 0; c < cols; c++) {
      const x = c * plantSpacing + xStart + offsetX;
      // If the offset pushes us beyond the field boundary, skip
      if (x > FIELD_SIZE) continue;
      positions.push({ x, y: r * rowSpacing + yStart });
    }
  }

  return positions;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Calculate planting pattern metrics and generate sample positions for visualization.
 *
 * @param config - Pattern configuration
 * @returns Visualization data including metrics and sample positions
 *
 * @example
 * ```ts
 * const viz = calculatePattern({ plantsPerHectare: 1650, patternType: 'tresbolillo' });
 * console.log(viz.metrics.distanceBetweenPlants); // ≈ 2.64 m
 * ```
 */
export function calculatePattern(config: PatternConfig): PatternVisualization {
  const { plantsPerHectare, patternType } = config;
  const areaPerPlant = HECTARE / plantsPerHectare;

  let rowSpacing: number;
  let plantSpacing: number;
  let distanceBetweenPlants: number;
  let stagger: boolean;

  switch (patternType) {
    case 'grid': {
      // Square grid: spacing = √(area per plant)
      const spacing = Math.sqrt(areaPerPlant);
      rowSpacing = spacing;
      plantSpacing = spacing;
      distanceBetweenPlants = spacing;
      stagger = false;
      break;
    }

    case 'tresbolillo': {
      // Equilateral triangle packing (tresbolillo).
      // Area per plant = (√3 / 2) × d² where d is the distance between plants.
      // Therefore: d = √(areaPerPlant × 2 / √3)
      const d = Math.sqrt((areaPerPlant * 2) / Math.sqrt(3));
      rowSpacing = (d * Math.sqrt(3)) / 2; // height of equilateral triangle
      plantSpacing = d;
      distanceBetweenPlants = d;
      stagger = true;
      break;
    }

    case 'mixed': {
      // Commercial banana pattern: wider rows, tighter plants, staggered.
      rowSpacing = config.rowSpacing ?? 3.0;
      plantSpacing = config.plantSpacing ?? 2.0;
      // Nearest neighbor: could be along the row (plantSpacing) or
      // diagonal to the next row: √(rowSpacing² + (plantSpacing/2)²)
      const diagonal = Math.sqrt(rowSpacing ** 2 + (plantSpacing / 2) ** 2);
      distanceBetweenPlants = Math.min(plantSpacing, diagonal);
      stagger = true;
      break;
    }
  }

  // Full-field estimate
  const numberOfRows = Math.ceil(FIELD_SIZE / rowSpacing);
  const plantsPerRow = Math.ceil(FIELD_SIZE / plantSpacing);
  const estimatedTotalPlants = numberOfRows * plantsPerRow;

  // Sample for visualization: display a subset (8 × 8 nominal grid)
  const SAMPLE_ROWS = 8;
  const SAMPLE_COLS = 8;
  const samplePositions = generatePositions(
    SAMPLE_ROWS,
    SAMPLE_COLS,
    rowSpacing,
    plantSpacing,
    stagger,
  );

  const sampleWidth = SAMPLE_COLS * plantSpacing;
  const sampleHeight = SAMPLE_ROWS * rowSpacing;

  return {
    metrics: {
      distanceBetweenPlants: clamp(
        Math.round(distanceBetweenPlants * 100) / 100,
        0.1,
        100,
      ),
      areaPerPlant: clamp(Math.round(areaPerPlant * 100) / 100, 0.1, 100),
      rowSpacing: clamp(Math.round(rowSpacing * 100) / 100, 0.1, 100),
      plantSpacing: clamp(Math.round(plantSpacing * 100) / 100, 0.1, 100),
      plantsPerHectare,
      estimatedTotalPlants,
      patternType,
    },
    samplePositions,
    sampleWidth,
    sampleHeight,
  };
}

/**
 * Get a human-readable label for a pattern type.
 */
export function getPatternLabel(patternType: PatternType): string {
  const labels: Record<PatternType, string> = {
    grid: 'Cuadrícula',
    tresbolillo: 'Tresbolillo',
    mixed: 'Mixto (Hileras)',
  };
  return labels[patternType];
}

/**
 * Get a short description for a pattern type.
 */
export function getPatternDescription(patternType: PatternType): string {
  const descriptions: Record<PatternType, string> = {
    grid: 'Marco real — plantas equiespaciadas en ambas direcciones',
    tresbolillo:
      'Triangular — mayor densidad, cada surco está alternado medio paso',
    mixed:
      'Hileras anchas + plantas densas — patrón comercial para banano',
  };
  return descriptions[patternType];
}
