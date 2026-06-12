/**
 * Theme tokens — Phase 1 (design system)
 *
 * Usage:
 *   import theme from '../themes/theme';
 *   // or via useTheme() for dark mode support
 *
 * Exports a comprehensive set of design tokens (colors, spacing,
 * typography, radii, shadows and breakpoints) used across the presentation layer.
 * Keep this file framework-agnostic and free of side-effects.
 */

const theme = {
  // ── Colors ─────────────────────────────────────────────────────────────────
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
    // Semantic tokens
    textCaption: '#6B7280',
    textButton: '#FFFFFF',
    textOverline: '#9CA3AF',
    textLink: '#0B5FFF',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    shadow: 'rgba(0, 0, 0, 0.08)',
    dangerTonal: 'rgba(239, 68, 68, 0.10)',
    primaryTonal: 'rgba(11, 95, 255, 0.10)',
  },

  // ── Spacing ────────────────────────────────────────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    overline: {
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
  },

  // ── Radii ──────────────────────────────────────────────────────────────────
  radii: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },

  // breakpoint in pixels used for responsive decisions in presentation layer
  responsiveBreakpoint: 900,
} as const;

export default theme;
