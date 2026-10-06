import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';
import { useTheme } from '../themes/ThemeContext';

type Props = { children?: React.ReactNode; title?: string; onMenuPress?: () => void };

export default function AppLayout({ children, title, onMenuPress }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title={title} onMenuPress={onMenuPress} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { flex: 1, padding: 12 } });
