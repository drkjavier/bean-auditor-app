import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

type ButtonProps = {
  onPress?: () => void;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'tonal';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
};

export default function Button({ onPress, children, variant = 'primary', loading = false, disabled = false, accessibilityLabel, style, testID }: ButtonProps) {
  const { colors, radii } = useTheme();

  const bgColor = disabled
    ? colors.disabledBg
    : variant === 'tonal'
      ? colors.primaryTonal
      : variant === 'primary'
        ? colors.primary
        : variant === 'secondary'
          ? colors.actionSecondaryBg
          : 'transparent';
  const textColor = disabled
    ? colors.disabledText
    : variant === 'primary'
      ? colors.textButton
      : variant === 'secondary'
        ? colors.onActionSecondary
        : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor, borderRadius: radii.md },
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
