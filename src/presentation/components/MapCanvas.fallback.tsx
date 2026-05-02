import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Tag } from '../../data/mocks/tagsMock';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: number | null;
  onSelect?: (item: Tag) => void;
};

export default function MapCanvasFallback({ items, style, selectedId, onSelect }: Props) {
  return (
    <View style={[styles.container, style]} accessibilityLabel="Mapa de auditorías fallback">
      <Text style={styles.title}>Mapa (fallback)</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No hay puntos para mostrar</Text>
      ) : (
        items.map(item => (
          <Pressable
            key={String(item.id)}
            style={[styles.row, selectedId === item.id ? styles.rowSelected : null]}
            onPress={onSelect ? () => onSelect(item) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar punto ${item.unique_id}`}
          >
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <Text style={styles.label}>{item.unique_id}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 240,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  empty: {
    color: '#64748b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowSelected: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  label: {
    color: '#0f172a',
  },
});
