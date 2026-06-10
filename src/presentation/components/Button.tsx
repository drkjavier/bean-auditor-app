import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import theme from '../themes/theme';

type ButtonProps = {
  onPress?: () => void;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
};

export default function Button({ onPress, children, variant = 'primary', loading = false, disabled = false, accessibilityLabel, style, testID }: ButtonProps) {
  const bgColor = disabled ? theme.colors.muted : variant === 'primary' ? theme.colors.primary : variant === 'secondary' ? theme.colors.surface : 'transparent';
  const textColor = variant === 'primary' ? '#fff' : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor },
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
    borderRadius: theme.radii.md,
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
