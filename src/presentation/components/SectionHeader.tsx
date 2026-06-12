/**
 * SectionHeader — title row with optional subtitle and action slot.
 *
 * Usage:
 *   <SectionHeader title="Cuenta" />
 *   <SectionHeader title="Preferencias" subtitle="Personaliza la app" />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export default function SectionHeader({ title, subtitle, action }: Props) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.sm }]}>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: colors.textPrimary, ...typography.subtitle }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.caption }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
  },
  title: {
    // overridable via style prop
  },
  subtitle: {
    marginTop: 2,
  },
  action: {
    marginLeft: 12,
  },
});
