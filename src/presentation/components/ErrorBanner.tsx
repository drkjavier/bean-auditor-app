import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../themes/theme';

type Props = { message?: string | null };

export default function ErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    maxWidth: 360,
  },
  text: { color: theme.colors.error },
});
