import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { Tag } from '../../data/mocks/tagsMock';
import { useTheme } from '../themes/ThemeContext';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: string | null;
  onSelect?: (item: Tag) => void;
  mapLoadError?: string | null;
};

export default function MapCanvasFallback({ items, style, selectedId, onSelect, mapLoadError }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }, style]}
      accessibilityLabel="Mapa de auditorías fallback"
    >
      <Text style={styles.title}>Mapa (fallback)</Text>
      {mapLoadError ? (
        <Text style={[styles.errorText, { color: colors.error }]} testID="mapLoadError">El mapa nativo no está disponible. Revisa la consola Metro o instala react-native-maps y reconstruye la app.</Text>
      ) : null}
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>No hay puntos para mostrar</Text>
      ) : (
        items.map(item => (
          <Pressable
            key={item.uuid}
            style={[
              styles.row,
              selectedId === item.unique_id
                ? [styles.rowSelected, { backgroundColor: colors.primaryTonal }]
                : null,
            ]}
            onPress={onSelect ? () => onSelect(item) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar punto ${item.unique_id}`}
          >
            <View style={[styles.swatch, { backgroundColor: item.colorHex }]} />
            <Text style={[styles.label, { color: colors.textPrimary }]}>{item.unique_id}</Text>
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
    borderRadius: 12,
    padding: 12,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  empty: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowSelected: {
    borderRadius: 8,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  label: {},
  errorText: {
    marginBottom: 8,
    fontSize: 12,
  },
});
