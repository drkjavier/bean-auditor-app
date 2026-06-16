/**
 * PlantingPatternVisualizer — Interactive visualizer for banana planting patterns.
 *
 * Allows the user to:
 * - Choose between grid (cuadrícula), tresbolillo, and mixed (hileras) patterns
 * - Adjust plants per hectare within a 1 500–1 800 range
 * - For mixed patterns, customize row and plant spacing
 * - See a dot visualization of the selected pattern
 * - Read key metrics: distance between plants, area per plant, row spacing, etc.
 *
 * @component
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import {
  PatternType,
  calculatePattern,
  getPatternLabel,
  getPatternDescription,
  PatternMetrics,
  PlantPosition,
} from '../../domain/farm/plantingPattern';
import Card from './Card';
import SectionHeader from './SectionHeader';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_PLANTS = 1_500;
const MAX_PLANTS = 1_800;
const STEP = 10;
const DOT_DIAMETER = 10;
const CANVAS_PADDING = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

/**
 * Normalise plant positions (in meters) to pixel offsets within a container.
 * Adds padding and centres the content.
 */
function normalizeToPixels(
  positions: PlantPosition[],
  containerW: number,
  containerH: number,
): { left: number; top: number }[] {
  if (positions.length === 0) return [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of positions) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const usableW = containerW - CANVAS_PADDING * 2;
  const usableH = containerH - CANVAS_PADDING * 2;

  return positions.map(p => ({
    left: CANVAS_PADDING + ((p.x - minX) / rangeX) * usableW,
    top: CANVAS_PADDING + ((p.y - minY) / rangeY) * usableH,
  }));
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  /** Initial plants per hectare (must be within 1 500–1 800) */
  initialPlants?: number;
  /** Callback when metrics change */
  onMetricsChange?: (metrics: PatternMetrics) => void;
};

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Pill selector row for pattern type.
 */
function PatternPills({
  selected,
  onChange,
  colors,
}: {
  selected: PatternType;
  onChange: (t: PatternType) => void;
  colors: any;
}) {
  const types: PatternType[] = ['grid', 'tresbolillo', 'mixed'];

  return (
    <View style={pillStyles.row} accessibilityRole="tablist">
      {types.map(type => {
        const active = type === selected;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={getPatternLabel(type)}
            style={[
              pillStyles.pill,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                pillStyles.label,
                { color: active ? colors.textButton : colors.textSecondary },
              ]}
            >
              {getPatternLabel(type)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});

/**
 * Stepper control ( − value + ) with optional range indicator bar.
 */
function Stepper({
  value,
  min,
  max,
  step,
  onChange,
  colors,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  colors: any;
  spacing?: any;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <View>
      {/* Value display + buttons */}
      <View style={stepperStyles.row}>
        <Pressable
          onPress={decrement}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel="Reducir cantidad"
          style={[
            stepperStyles.btn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: value <= min ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[stepperStyles.btnText, { color: colors.textPrimary }]}>
            −
          </Text>
        </Pressable>

        <Text
          style={[
            stepperStyles.value,
            { color: colors.textPrimary },
          ]}
          accessibilityLabel={`${formatNumber(value)} plantas por hectárea`}
        >
          {formatNumber(value)}
        </Text>

        <Pressable
          onPress={increment}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel="Aumentar cantidad"
          style={[
            stepperStyles.btn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: value >= max ? 0.4 : 1,
            },
          ]}
        >
          <Text style={[stepperStyles.btnText, { color: colors.textPrimary }]}>
            +
          </Text>
        </Pressable>
      </View>

      {/* Range indicator bar */}
      <View
        style={[
          stepperStyles.track,
          { backgroundColor: colors.border },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min, max, now: value }}
      >
        <View
          style={[
            stepperStyles.fill,
            {
              backgroundColor: colors.primary,
              width: `${pct}%` as any,
            },
          ]}
        />
      </View>

      {/* Min / Max labels */}
      <View style={stepperStyles.labels}>
        <Text style={[stepperStyles.label, { color: colors.textCaption }]}>
          {formatNumber(min)}
        </Text>
        <Text style={[stepperStyles.label, { color: colors.textCaption }]}>
          {formatNumber(max)}
        </Text>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
  },
  track: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
  },
});

/**
 * Metric card displaying a label and a value.
 */
function MetricCard({
  label,
  value,
  unit,
  colors,
  typography,
}: {
  label: string;
  value: string;
  unit: string;
  colors: any;
  typography: any;
}) {
  return (
    <View
      style={[
        metricStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[metricStyles.value, { color: colors.primary, ...typography.h2 }]}>
        {value}
      </Text>
      <Text style={[metricStyles.unit, { color: colors.textSecondary, ...typography.caption }]}>
        {unit}
      </Text>
      <Text style={[metricStyles.label, { color: colors.textCaption, ...typography.overline }]}>
        {label}
      </Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    fontWeight: '700',
  },
  unit: {
    marginTop: 2,
  },
  label: {
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

/**
 * Spacing input control for mixed pattern fine-tuning.
 */
function SpacingInput({
  label,
  value,
  step,
  onChange,
  colors,
  typography,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
  colors: any;
  typography: any;
}) {
  return (
    <View style={spacingInputStyles.row}>
      <Text style={[spacingInputStyles.label, { color: colors.textSecondary, ...typography.body }]}>
        {label}
      </Text>
      <View style={spacingInputStyles.controls}>
        <Pressable
          onPress={() => onChange(Math.max(0.5, +(value - step).toFixed(1)))}
          accessibilityRole="button"
          accessibilityLabel={`Reducir ${label}`}
          style={[
            spacingInputStyles.btn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[spacingInputStyles.btnText, { color: colors.textPrimary }]}>−</Text>
        </Pressable>
        <Text
          style={[spacingInputStyles.value, { color: colors.textPrimary, ...typography.subtitle }]}
          accessibilityLabel={`${label}: ${value} metros`}
        >
          {value.toFixed(1)}
        </Text>
        <Pressable
          onPress={() => onChange(Math.min(6.0, +(value + step).toFixed(1)))}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          style={[
            spacingInputStyles.btn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[spacingInputStyles.btnText, { color: colors.textPrimary }]}>+</Text>
        </Pressable>
        <Text style={[{ color: colors.textCaption, ...typography.caption }]}>m</Text>
      </View>
    </View>
  );
}

const spacingInputStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  value: {
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function PlantingPatternVisualizer({
  initialPlants = 1_650,
  onMetricsChange,
}: Props) {
  const { colors, typography, spacing } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Clamp initial value
  const safeInitial = Math.min(Math.max(initialPlants, MIN_PLANTS), MAX_PLANTS);

  // State
  const [patternType, setPatternType] = useState<PatternType>('mixed');
  const [plantsPerHectare, setPlantsPerHectare] = useState(safeInitial);
  const [rowSpacing, setRowSpacing] = useState(3.0);
  const [plantSpacing, setPlantSpacing] = useState(2.0);

  // Calculate pattern
  const visualization = useMemo(() => {
    const config =
      patternType === 'mixed'
        ? { plantsPerHectare, patternType, rowSpacing, plantSpacing }
        : { plantsPerHectare, patternType };

    const result = calculatePattern(config);

    // Notify parent
    onMetricsChange?.(result.metrics);

    return result;
  }, [plantsPerHectare, patternType, rowSpacing, plantSpacing, onMetricsChange]);

  // Container size for the dot canvas
  const containerSize = useMemo(() => {
    const maxW = Math.min(screenWidth - spacing.md * 2 - 32, 380);
    return { width: maxW, height: maxW };
  }, [screenWidth, spacing]);

  // Normalise dot positions to pixels
  const dotPositions = useMemo(
    () =>
      normalizeToPixels(
        visualization.samplePositions,
        containerSize.width,
        containerSize.height,
      ),
    [visualization.samplePositions, containerSize],
  );

  const { metrics } = visualization;
  const description = getPatternDescription(patternType);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ marginTop: spacing.lg }}>
      <SectionHeader
        title="Patrones de Siembra"
        subtitle="Calcula la distancia entre plantas según el arreglo"
      />

      <Card variant="outlined">
        {/* Pattern type selector */}
        <PatternPills
          selected={patternType}
          onChange={setPatternType}
          colors={colors}
        />

        {/* Description */}
        <Text
          style={[
            styles.description,
            { color: colors.textCaption, ...typography.caption },
          ]}
        >
          {description}
        </Text>

        {/* Spacer */}
        <View style={{ height: spacing.md }} />

        {/* Plant count stepper */}
        <Stepper
          value={plantsPerHectare}
          min={MIN_PLANTS}
          max={MAX_PLANTS}
          step={STEP}
          onChange={setPlantsPerHectare}
          colors={colors}
          spacing={spacing}
        />

        {/* Mixed pattern fine-tuning */}
        {patternType === 'mixed' && (
          <View
            style={[
              styles.mixedControls,
              {
                marginTop: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.surface,
                borderRadius: 8,
              },
            ]}
          >
            <Text
              style={[
                styles.mixedTitle,
                { color: colors.textSecondary, ...typography.caption },
              ]}
            >
              Ajuste de distancias
            </Text>
            <SpacingInput
              label="Distancia entre surcos"
              value={rowSpacing}
              step={0.25}
              onChange={setRowSpacing}
              colors={colors}
              typography={typography}
            />
            <SpacingInput
              label="Distancia entre plantas"
              value={plantSpacing}
              step={0.25}
              onChange={setPlantSpacing}
              colors={colors}
              typography={typography}
            />
          </View>
        )}

        {/* Spacer */}
        <View style={{ height: spacing.md }} />

        {/* ── Dot canvas ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.canvas,
            {
              width: containerSize.width,
              height: containerSize.height,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel={`Visualización de patrón ${getPatternLabel(patternType)} con ${formatNumber(plantsPerHectare)} plantas por hectárea`}
        >
          {dotPositions.map((pos, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  left: pos.left - DOT_DIAMETER / 2,
                  top: pos.top - DOT_DIAMETER / 2,
                  width: DOT_DIAMETER,
                  height: DOT_DIAMETER,
                  backgroundColor: colors.success,
                  borderColor: colors.primary,
                  opacity: 0.8,
                },
              ]}
            />
          ))}

          {/* Empty state: if no dots */}
          {dotPositions.length === 0 && (
            <Text
              style={[
                styles.emptyCanvas,
                { color: colors.textCaption, ...typography.caption },
              ]}
            >
              Sin datos para visualizar
            </Text>
          )}
        </View>

        {/* ── Metrics grid ─────────────────────────────────────────────── */}
        <View style={[styles.metricsGrid, { marginTop: spacing.md }]}>
          <MetricCard
            label="Distancia entre plantas"
            value={metrics.distanceBetweenPlants.toFixed(2)}
            unit="metros"
            colors={colors}
            typography={typography}
          />
          <MetricCard
            label="Área por planta"
            value={metrics.areaPerPlant.toFixed(2)}
            unit="m²"
            colors={colors}
            typography={typography}
          />
        </View>

        <View style={[styles.metricsGrid, { marginTop: spacing.sm }]}>
          <MetricCard
            label="Distancia entre surcos"
            value={metrics.rowSpacing.toFixed(2)}
            unit="metros"
            colors={colors}
            typography={typography}
          />
          <MetricCard
            label="Plantas estimadas"
            value={formatNumber(metrics.estimatedTotalPlants)}
            unit="por hectárea"
            colors={colors}
            typography={typography}
          />
        </View>

        {/* Detail note */}
        <Text
          style={[
            styles.disclaimer,
            { color: colors.textOverline, ...typography.overline },
          ]}
        >
          Muestra representativa de {visualization.samplePositions.length} plantas — escala proporcional al patrón real
        </Text>
      </Card>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  description: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  mixedControls: {
    gap: 4,
  },
  mixedTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  canvas: {
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  emptyCanvas: {
    textAlign: 'center',
    marginTop: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  disclaimer: {
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
