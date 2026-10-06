import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { TAG_COLORS, TagColor } from '../../domain/constants/tagColors';
import { useTheme } from '../themes/ThemeContext';
import { getContrastText } from '../themes/colorUtils';

type Props = {
  value: string | undefined;
  onChange: (hex: string | undefined) => void;
  placeholder?: string;
};

/**
 * Returns 1 when the tag swatch needs a visible border to separate it
 * from light surfaces (white and other very light tag colors), 0 otherwise.
 * Tag colors are business data; only the border adapts to them.
 */
function getSwatchBorderWidth(hex: string): number {
  if (hex === '#FFFFFF') {
    return 1;
  }
  // Very light tag colors (yellow, silver, ...) also need a visible border.
  return getContrastText(hex) === '#1C1917' ? 1 : 0;
}

export default function ColorCombobox({ value, onChange, placeholder = 'Filtrar por color' }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = TAG_COLORS.find(c => c.hex === value);

  const handleSelect = (color: TagColor | null) => {
    onChange(color?.hex ?? undefined);
    setOpen(false);
  };

  // Web: use native select for better compatibility
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        {/* pointerEvents prop is deprecated on web; move to style.pointerEvents */}
        <View style={[styles.swatchSmall, { pointerEvents: 'none' }]}>
          {selected ? (
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: selected.hex,
                  borderWidth: getSwatchBorderWidth(selected.hex),
                  borderColor: colors.border,
                },
              ]}
            />
          ) : (
            <View style={[styles.swatchEmpty, { borderColor: colors.border }]} />
          )}
        </View>

        {/* @ts-ignore — web-only select element */}
        <select
          value={value ?? ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value;
            onChange(val === '' ? undefined : val);
          }}
          style={{
            flex: 1,
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 'auto',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minWidth: 0,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: '8px',
            backgroundColor: colors.card,
            color: colors.textPrimary,
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
          }}
          aria-label={placeholder}
        >
          <option value="">{placeholder}</option>
          {TAG_COLORS.map(c => (
            <option key={c.hex} value={c.hex}>
              {c.name} ({c.hex})
            </option>
          ))}
        </select>
      </View>
    );
  }

  // Native: custom modal picker
  return (
    <>
      <Pressable
        style={[styles.trigger, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}
        accessibilityLabel={placeholder}
        accessibilityRole="combobox"
      >
        {selected ? (
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: selected.hex,
                borderWidth: getSwatchBorderWidth(selected.hex),
                borderColor: colors.border,
              },
            ]}
          />
        ) : (
          <View style={[styles.swatchEmpty, { borderColor: colors.border }]} />
        )}
        <Text style={[styles.triggerText, { color: selected ? colors.textPrimary : colors.textMuted }]}>
          {selected ? `${selected.name} (${selected.hex})` : placeholder}
        </Text>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{placeholder}</Text>
            <Pressable style={[styles.clearRow, { borderBottomColor: colors.border }]} onPress={() => handleSelect(null)}>
              <View style={[styles.swatchEmpty, { borderColor: colors.border }]} />
              <Text style={[styles.clearText, { color: colors.textSecondary }]}>Todos los colores</Text>
            </Pressable>
            <FlatList
              data={TAG_COLORS}
              keyExtractor={c => c.hex}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    { borderBottomColor: colors.border },
                    value === item.hex && { backgroundColor: colors.primaryTonal },
                  ]}
                  onPress={() => handleSelect(item)}
                  accessibilityLabel={`Color ${item.name}`}
                >
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: item.hex,
                        borderWidth: getSwatchBorderWidth(item.hex),
                        borderColor: colors.border,
                      },
                    ]}
                  />
                  <Text style={[styles.optionText, { color: value === item.hex ? colors.primary : colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.optionHex, { color: colors.textMuted }]}>{item.hex}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  triggerText: { flex: 1, fontSize: 14, marginLeft: 8 },
  chevron: { fontSize: 12 },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  swatchEmpty: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
    borderTopWidth: 1,
  },
  sheetTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12 },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  clearText: { marginLeft: 10, fontSize: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  optionText: { flex: 1, marginLeft: 10, fontSize: 14 },
  optionHex: { fontSize: 12 },
  webWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    columnGap: 8,
    width: '100%',
    minWidth: 0,
  },
  swatchSmall: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
