/**
 * Theme tokens - Phase0
 *
 * Usage:
 * import theme from 'src/presentation/themes/theme';
 *
 * This file exports a minimal set of design tokens (colors, spacing,
 * typography, radii and breakpoints) used across the presentation layer.
 * Keep this file framework-agnostic and free of side-effects.
 */

const theme = {
  colors: {
    primary: '#0B5FFF',
    primaryVariant: '#0846CC',
    background: '#FFFFFF',
    surface: '#F7F9FC',
    textPrimary: '#0F1724',
    textSecondary: '#596379',
    muted: '#9AA7B2',
    success: '#1ABC9C',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E6EDF3',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },

  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
  },

  radii: {
    sm: 4,
    md: 8,
  },

  // breakpoint in pixels used for responsive decisions in presentation layer
  responsiveBreakpoint: 900,
} as const;

export default theme;
