/**
 * PlantationGrid — Visual overview of a square grid of hectares (e.g. 2×2 or 3×3).
 *
 * Shows:
 * - A grid where each cell represents one hectare with plant count
 * - The center hectare marked (only for odd-sized grids like 3×3)
 * - The center tag details (ID, coordinates)
 * - Summary stats (total plants, plants/ha, pattern info)
 * - Tap a hectare to select it; selected info shown below
 *
 * @component
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import type { PatternType } from '../../domain/farm/plantingPattern';
import { getPatternLabel } from '../../domain/farm/plantingPattern';
import { useWindowDimensions } from 'react-native';
import Card from './Card';
import SectionHeader from './SectionHeader';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HectareSummary {
  gridRow: number;
  gridCol: number;
  plantCount: number;
}

export interface PlantationSummary {
  hectares: HectareSummary[];
  totalPlants: number;
  centerTagId: string;
  centerLat: number;
  centerLon: number;
  plantsPerHectare: number;
  patternType: PatternType;
}

type Props = {
  /** Plantation summary data */
  data: PlantationSummary;
  /** Callback when a hectare is selected */
  onHectareSelect?: (hectare: HectareSummary) => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function PlantationGrid({ data, onHectareSelect }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // Determine center hectare (only meaningful for odd-sized grids e.g. 3×3)
  const sideLen = Math.sqrt(data.hectares.length);
  const isOddGrid = Number.isInteger(sideLen) && sideLen % 2 === 1;
  const centerIndex = useMemo(() => {
    if (!isOddGrid) return -1; // no single center for even grids (e.g. 2×2)
    const mid = Math.floor(sideLen / 2);
    return mid * sideLen + mid;
  }, [sideLen, isOddGrid]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    isOddGrid ? centerIndex : 0,
  );

  // Calculate cell size based on screen
  const cellSize = useMemo(() => {
    const maxW = Math.min(screenWidth - spacing.md * 2 - 48, 360);
    return Math.floor(maxW / sideLen);
  }, [screenWidth, spacing, sideLen]);

  const patternLabel = getPatternLabel(data.patternType);

  // Build rows for display
  const gridRows: HectareSummary[][] = [];
  for (let r = 0; r < sideLen; r++) {
    const row: HectareSummary[] = [];
    for (let c = 0; c < sideLen; c++) {
      const ha = data.hectares.find(h => h.gridRow === r && h.gridCol === c);
      if (ha) row.push(ha);
    }
    gridRows.push(row);
  }

  return (
    <View style={{ marginTop: spacing.lg }}>
      <SectionHeader
        title={`Plantación: ${data.hectares.length} hectáreas`}
        subtitle={`${patternLabel} · ${data.plantsPerHectare} plantas/ha`}
      />

      <Card variant="outlined">
        {/* ── Grid ──────────────────────────────────────────────────── */}
        <View style={styles.gridContainer}>
          {gridRows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((ha) => {
                const idx = data.hectares.indexOf(ha);
                const isCenter = idx === centerIndex;
                const isSelected = idx === selectedIndex;

                return (
                  <Pressable
                    key={`${ha.gridRow}-${ha.gridCol}`}
                    onPress={() => {
                      setSelectedIndex(idx);
                      onHectareSelect?.(ha);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Hectárea fila ${ha.gridRow + 1}, columna ${ha.gridCol + 1}: ${ha.plantCount} plantas${isCenter ? ' — centro' : ''}`}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isSelected
                          ? colors.primaryTonal
                          : isCenter
                            ? colors.primaryTonal
                            : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : isCenter
                            ? colors.primary
                            : colors.border,
                        borderWidth: isSelected || isCenter ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Label */}
                    <Text
                      style={[
                        styles.cellLabel,
                        { color: isCenter ? colors.primary : colors.textCaption, ...typography.overline },
                      ]}
                    >
                      {isCenter ? '★ CENTRO' : `Ha ${idx + 1}`}
                    </Text>

                    {/* Plant count */}
                    <Text
                      style={[
                        styles.cellCount,
                        { color: isCenter ? colors.primary : colors.textPrimary, ...typography.h2 },
                      ]}
                    >
                      {ha.plantCount.toLocaleString()}
                    </Text>

                    {/* Sub-label */}
                    <Text
                      style={[
                        styles.cellUnit,
                        { color: colors.textCaption, ...typography.caption },
                      ]}
                    >
                      plantas
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Selected hectare info ───────────────────────────────── */}
        {selectedIndex !== null && data.hectares[selectedIndex] && (
          <View
            style={[
              styles.selectedInfo,
              {
                marginTop: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.surface,
                borderRadius: radii.md,
              },
            ]}
          >
            <Text style={[styles.selectedTitle, { color: colors.textPrimary, ...typography.subtitle }]}>
              Hectárea {selectedIndex + 1}
              {selectedIndex === centerIndex ? ' (Centro)' : ''}
            </Text>
            <Text style={[styles.selectedDetail, { color: colors.textSecondary, ...typography.body }]}>
              {data.hectares[selectedIndex].plantCount.toLocaleString()} plantas · Fila {data.hectares[selectedIndex].gridRow + 1}, Columna {data.hectares[selectedIndex].gridCol + 1}
            </Text>
          </View>
        )}

        {/* ── Center tag details ──────────────────────────────────── */}
        <View
          style={[
            styles.centerTagCard,
            {
              marginTop: spacing.sm,
              padding: spacing.sm,
              backgroundColor: colors.primaryTonal,
              borderRadius: radii.md,
            },
          ]}
          accessibilityLabel={`Tag central: ${data.centerTagId}`}
        >
          <View style={styles.centerTagRow}>
            <Text style={[styles.centerTagLabel, { color: colors.primary, ...typography.overline }]}>
              TAG CENTRAL
            </Text>
            <Text style={[styles.centerTagId, { color: colors.primary, ...typography.subtitle }]}>
              {data.centerTagId}
            </Text>
          </View>
          <Text style={[{ color: colors.textSecondary, ...typography.caption, marginTop: 2 }]}>
            {data.centerLat.toFixed(6)}, {data.centerLon.toFixed(6)}
          </Text>
        </View>

        {/* ── Summary stats ───────────────────────────────────────── */}
        <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary, ...typography.h2 }]}>
              {data.totalPlants.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textCaption, ...typography.overline }]}>
              TOTAL PLANTAS
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary, ...typography.h2 }]}>
              {data.hectares.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textCaption, ...typography.overline }]}>
              HECTÁREAS
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.textPrimary, ...typography.h2 }]}>
              {data.plantsPerHectare}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textCaption, ...typography.overline }]}>
              PLANTAS/HA
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gridContainer: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  cell: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cellCount: {
    fontWeight: '700',
  },
  cellUnit: {
    fontSize: 10,
    marginTop: 1,
  },
  selectedInfo: {
    // dynamic styles
  },
  selectedTitle: {
    fontWeight: '600',
  },
  selectedDetail: {
    marginTop: 2,
  },
  centerTagCard: {
    // dynamic styles
  },
  centerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerTagLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerTagId: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
