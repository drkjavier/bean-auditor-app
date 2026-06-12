/**
 * EmptyState — centered message for empty lists/views.
 *
 * Usage:
 *   <EmptyState icon="tag-off-outline" title="Sin resultados" />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';
import Button from './Button';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon = 'alert-circle-outline', title, description, actionLabel, onAction }: Props) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.container, { paddingVertical: spacing.xl }]} accessibilityLabel={title}>
      <MdiIcon name={icon} size={48} color={colors.muted} />
      <Text style={[styles.title, { color: colors.textPrimary, marginTop: spacing.md, ...typography.subtitle }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary, marginTop: spacing.xs, ...typography.body }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.md, width: 200 }}>
          <Button variant="tonal" onPress={onAction} accessibilityLabel={actionLabel}>
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
