import React from 'react';
import { Text, StyleSheet } from 'react-native';
import theme from '../themes/theme';

/** Map of MDI icon names to their unicode codepoints in the Material Design Icons font. */
const MDI_GLYPH: Record<string, string> = {
  'email-outline': String.fromCodePoint(0xF01F0),
  'lock-outline': String.fromCodePoint(0xF0341),
  eye: String.fromCodePoint(0xF0208),
  'eye-off': String.fromCodePoint(0xF0209),
};

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export default function MdiIcon({ name, size = 20, color = theme.colors.muted }: Props) {
  const glyph = MDI_GLYPH[name];
  if (!glyph) return null;
  return (
    <Text style={[styles.icon, { fontSize: size, color }]} aria-hidden>
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'Material Design Icons',
    lineHeight: undefined,
  },
});
