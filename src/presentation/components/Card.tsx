/**
 * Card — surface container with variants.
 *
 * Usage:
 *   <Card variant="elevated">content</Card>
 *   <Card variant="outlined">content</Card>
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

type CardVariant = 'elevated' | 'outlined' | 'filled';

type Props = {
  children?: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export default function Card({ children, variant = 'elevated', style, accessibilityLabel }: Props) {
  const { colors, radii, shadows, spacing } = useTheme();

  const baseStyle: ViewStyle = {
    borderRadius: radii.lg,
    padding: spacing.md,
  };

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { backgroundColor: colors.card, borderWidth: 0, ...shadows.md }
      : variant === 'outlined'
        ? { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }
        : { backgroundColor: colors.surface, borderWidth: 0 };

  return (
    <View
      style={[styles.card, baseStyle, variantStyle, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
