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

type Props = {
  value: string | undefined;
  onChange: (hex: string | undefined) => void;
  placeholder?: string;
};

export default function ColorCombobox({ value, onChange, placeholder = 'Filtrar por color' }: Props) {
  const [open, setOpen] = useState(false);

  const selected = TAG_COLORS.find(c => c.hex === value);

  const handleSelect = (color: TagColor | null) => {
    onChange(color?.hex ?? undefined);
    setOpen(false);
  };

  // Web: use native select for better compatibility
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webWrapper, styles.webWrapperOverflow]}>
        {/* pointerEvents prop is deprecated on web; move to style.pointerEvents */}
        {/* Place the swatch absolutely so it doesn't affect layout width */}
        <View style={[styles.swatchSmall, { pointerEvents: 'none' }]}> 
          {selected ? (
            <View style={[styles.swatch, { backgroundColor: selected.hex, borderWidth: selected.hex === '#FFFFFF' ? 1 : 0 }]} />
          ) : (
            <View style={styles.swatchEmpty} />
          )}
        </View>

        {/* @ts-ignore — web-only select element */}
        <select
          value={value ?? ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value;
            onChange(val === '' ? undefined : val);
          }}
          style={webSelectStyle}
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
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityLabel={placeholder}
        accessibilityRole="combobox"
      >
        {selected ? (
          <View style={[styles.swatch, { backgroundColor: selected.hex, borderWidth: selected.hex === '#FFFFFF' ? 1 : 0 }]} />
        ) : (
          <View style={styles.swatchEmpty} />
        )}
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? `${selected.name} (${selected.hex})` : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <Pressable style={styles.clearRow} onPress={() => handleSelect(null)}>
              <View style={styles.swatchEmpty} />
              <Text style={styles.clearText}>Todos los colores</Text>
            </Pressable>
            <FlatList
              data={TAG_COLORS}
              keyExtractor={c => c.hex}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, value === item.hex && styles.optionSelected]}
                  onPress={() => handleSelect(item)}
                  accessibilityLabel={`Color ${item.name}`}
                >
                  <View style={[styles.swatch, { backgroundColor: item.hex, borderWidth: item.hex === '#FFFFFF' ? 1 : 0 }]} />
                  <Text style={styles.optionText}>{item.name}</Text>
                  <Text style={styles.optionHex}>{item.hex}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const webSelectStyle: React.CSSProperties = {
  // Let the select occupy the remaining space inside the flex row while
  // allowing it to shrink on narrow viewports. Avoid using width:100% here
  // because that plus the swatch's width would cause overflow.
  // ensure flexible shrink/grow behavior in narrow containers
  flex: 1,
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  maxWidth: '100%',
  // reserve space for the color swatch placed absolutely inside the wrapper
  paddingLeft: '44px',
  boxSizing: 'border-box',
  minWidth: 0,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: '8px',
  backgroundColor: '#fff',
  fontSize: 14,
  cursor: 'pointer',
  outline: 'none',
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  triggerText: { flex: 1, fontSize: 14, color: '#0f172a', marginLeft: 8 },
  placeholder: { color: '#94a3b8' },
  chevron: { color: '#64748b', fontSize: 12 },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderColor: '#cbd5e1',
  },
  swatchEmpty: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  sheetTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12, color: '#0f172a' },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  clearText: { marginLeft: 10, color: '#64748b', fontSize: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionSelected: { backgroundColor: '#eff6ff' },
  optionText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#0f172a' },
  optionHex: { color: '#94a3b8', fontSize: 12 },
  webWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 8,
    // allow the wrapper to size responsively and to shrink on narrow viewports
    width: '100%',
    minWidth: 0,
  },
  // small swatch used in the web select; position absolute so it doesn't
  // affect layout width and never forces overflow.
  swatchSmall: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // make wrapper clip any accidental overflow from children (defensive)
  webWrapperOverflow: {
    overflow: 'hidden',
  },
});
