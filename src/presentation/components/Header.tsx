import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import theme from '../themes/theme';

type Props = { title?: string; onMenuPress?: () => void; right?: React.ReactNode };

export default function Header({ title, onMenuPress, right }: Props) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onMenuPress} accessibilityLabel="Abrir menú" style={styles.menuButton}>
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 56, backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  menuButton: { padding: 8 },
  menuIcon: { fontSize: 20 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  right: { width: 48, alignItems: 'flex-end' },
});
