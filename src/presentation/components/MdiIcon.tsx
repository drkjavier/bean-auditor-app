import React from 'react';
import { Platform, Text, StyleSheet } from 'react-native';
import theme from '../themes/theme';

// Web: use CSS font glyphs; Native: use react-native-vector-icons
const isWeb = Platform.OS === 'web';

// Native icon mapping (react-native-vector-icons name)
const NATIVE_ICON_MAP: Record<string, string> = {
  'email-outline': 'email-outline',
  'lock-outline': 'lock-outline',
  eye: 'eye',
  'eye-off': 'eye-off',
  'clipboard-text-search-outline': 'clipboard-text-search-outline',
  'cog-outline': 'cog-outline',
  'clipboard-check-outline': 'clipboard-check-outline',
  'clipboard-clock-outline': 'clipboard-clock-outline',
  'tag-outline': 'tag-outline',
  'timer-outline': 'timer-outline',
  'check-circle-outline': 'check-circle-outline',
  refresh: 'refresh',
  'alert-circle': 'alert-circle',
  close: 'close',
  cellphone: 'cellphone',
  cloud: 'cloud',
  database: 'database',
  delete: 'delete',
  'close-circle-outline': 'close-circle-outline',
  'clock-outline': 'clock-outline',
};

// Web glyph codepoints
const WEB_GLYPH: Record<string, string> = {
  'email-outline': String.fromCodePoint(0xF01F0),
  'lock-outline': String.fromCodePoint(0xF0341),
  eye: String.fromCodePoint(0xF0208),
  'eye-off': String.fromCodePoint(0xF0209),
  'clipboard-text-search-outline': String.fromCodePoint(0xF0F5E),
  'cog-outline': String.fromCodePoint(0xF0493),
  'clipboard-check-outline': String.fromCodePoint(0xF02BE),
  'clipboard-clock-outline': String.fromCodePoint(0xF0F50),
  'tag-outline': String.fromCodePoint(0xF02F7),
  'timer-outline': String.fromCodePoint(0xF0570),
  'check-circle-outline': String.fromCodePoint(0xF02BE),
  refresh: String.fromCodePoint(0xF0450),
  'alert-circle': String.fromCodePoint(0xF002A),
  close: String.fromCodePoint(0xF0156),
  cellphone: String.fromCodePoint(0xF08F9),
  cloud: String.fromCodePoint(0xF0590),
  database: String.fromCodePoint(0xF01BC),
  delete: String.fromCodePoint(0xF01B4),
  'close-circle-outline': String.fromCodePoint(0xF015A),
  'clock-outline': String.fromCodePoint(0xF057E),
};

type Props = {
  name: string;
  size?: number;
  color?: string;
};

/** Renders a Material Design Icon cross-platform (web font + native vector-icons). */
export default function MdiIcon({ name, size = 20, color = theme.colors.muted }: Props) {
  if (isWeb) {
    const glyph = WEB_GLYPH[name];
    if (!glyph) return null;
    return (
      <Text style={[styles.icon, { fontSize: size, color }]} aria-hidden>
        {glyph}
      </Text>
    );
  }

  // Native: use react-native-vector-icons
  try {
    const MaterialCommunityIcons = require('react-native-vector-icons/MaterialCommunityIcons').default;
    const iconName = NATIVE_ICON_MAP[name] ?? name;
    return <MaterialCommunityIcons name={iconName} size={size} color={color} accessibilityElementsHidden />;
  } catch {
    // Fallback: render nothing if vector-icons not linked
    return null;
  }
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'Material Design Icons',
    lineHeight: undefined,
  },
});
