import React from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';

type Props = { children?: React.ReactNode; title?: string; onMenuPress?: () => void };

export default function AppLayout({ children, title, onMenuPress }: Props) {
  return (
    <View style={styles.root}>
      <Header title={title} onMenuPress={onMenuPress} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#f8fafc' }, content: { flex: 1, padding: 12 } });
