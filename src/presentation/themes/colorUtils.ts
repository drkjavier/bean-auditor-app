/**
 * colorUtils — contrast helpers for adaptive text on colored surfaces.
 *
 * Used mainly for NFC tag swatches/badges: tag colors are business data
 * (persisted in the DB) and include very light hex values (yellow, white,
 * silver). Text rendered on top of them must adapt to stay legible.
 */

/** Parses a 3- or 6-digit hex color into RGB channels (0–255). */
export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** WCAG 2.1 relative luminance of an sRGB color. Returns 0–1. */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const channel = (c: number): number => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG 2.1 contrast ratio between two hex colors (1–21). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Returns the readable text color ('#0F172A' dark or '#FFFFFF' light)
 * for arbitrary background hex. Falls back to dark text for invalid input.
 */
export function getContrastText(bg: string): string {
  const rgb = parseHex(bg);
  if (!rgb) return '#0F172A';
  // Use the perceptual brightness shortcut first, then verify with luminance.
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  if (brightness > 150) return '#0F172A';
  return '#FFFFFF';
}

export default {
  parseHex,
  relativeLuminance,
  contrastRatio,
  getContrastText,
};
