/**
 * SettingsRow — label + trailing slot with optional divider.
 *
 * Usage:
 *   <SettingsRow label="Versión" trailing={<Text>1.0.0</Text>} />
 *   <SettingsRow label="Cerrar sesión" onPress={logout} showDivider={false} />
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

type Props = {
  label: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  accessibilityLabel?: string;
};

export default function SettingsRow({ label, trailing, onPress, showDivider = true, accessibilityLabel }: Props) {
  const { colors, typography } = useTheme();

  const content = (
    <View style={[styles.row, { minHeight: 48 }]}>
      <Text style={[styles.label, { color: colors.textPrimary, ...typography.body }]}>{label}</Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || label}
          style={({ pressed }) => [pressed ? { opacity: 0.7 } : null]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {showDivider ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  label: {
    flex: 1,
  },
  trailing: {
    marginLeft: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
