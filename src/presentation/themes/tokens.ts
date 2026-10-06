/**
 * Design tokens — "Graphite + Indigo" (single source of truth).
 *
 * Replaces the former dual system (static `theme.ts` + `ThemeContext.tsx` palettes).
 * All presentation components must consume these tokens via `useTheme()`
 * from `ThemeContext.tsx`. Do NOT import palettes directly in components.
 *
 * Palettes:
 *   - light: "Frost"     — cool graphite surfaces (slate neutrals) + vivid indigo accent.
 *   - dark:  "Midnight"  — near-black graphite layers + bright indigo accent.
 *
 * Visual direction: modern SaaS aesthetic (Linear/Vercel style).
 * All text/background pairs are verified against WCAG 2.1 AA (≥ 4.5:1 for
 * normal text, ≥ 3:1 for large text and UI components).
 */

import { sanitizeThemeMode, type ThemeMode } from '../../domain/constants/themeMode';

// Re-exported for convenience — canonical location is domain/constants/themeMode.
export { sanitizeThemeMode };
export type { ThemeMode };

// ── Light palette — "Frost" (Graphite + Indigo) ─────────────────────────────
const lightColors = {
  // Brand
  primary: '#4F46E5',
  primaryVariant: '#3730A3',
  textLink: '#4F46E5',

  // Surfaces
  background: '#F8FAFC',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  border: '#E2E8F0',

  // Text (all ≥ 4.5:1 on background #F8FAFC)
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  muted: '#64748B',
  textCaption: '#64748B',
  textOverline: '#64748B',
  textButton: '#FFFFFF',

  // Status (≥ 4.5:1 with white text on top and on their tonal backgrounds)
  success: '#047857',
  warning: '#B45309',
  error: '#B91C1C',
  info: '#0369A1',

  // Tonal backgrounds for badges/banners
  successTonal: '#D1FAE5',
  warningTonal: '#FEF3C7',
  dangerTonal: '#FEE2E2',
  primaryTonal: '#EEF2FF',
  infoTonal: '#E0F2FE',

  // Actions
  actionSecondaryBg: '#F1F5F9',
  onActionSecondary: '#475569',

  // Disabled (≥ 3:1 — WCAG inactive-component threshold)
  disabledBg: '#E2E8F0',
  disabledText: '#64748B',

  // Misc
  shadow: 'rgba(15, 23, 42, 0.08)',
} as const;

// ── Dark palette — "Midnight" (Graphite + Indigo) ───────────────────────────
const darkColors = {
  // Brand
  primary: '#818CF8',
  primaryVariant: '#A5B4FC',
  textLink: '#818CF8',

  // Surfaces
  background: '#0B0B12',
  surface: '#0B0B12',
  card: '#15151F',
  cardBorder: '#1E1E2E',
  border: '#1E1E2E',

  // Text (all ≥ 4.5:1 on surface #15151F)
  textPrimary: '#F4F4F8',
  textSecondary: '#A0A0B8',
  textMuted: '#82829A',
  muted: '#82829A',
  textCaption: '#82829A',
  textOverline: '#82829A',
  // Dark text on the bright dark-mode accent/status colors (indigo, mint, amber, coral)
  textButton: '#0B0B12',

  // Status (bright variants; pair with dark text via textButton)
  success: '#34D399',
  warning: '#FBBF24',
  error: '#FB7185',
  info: '#67E8F9',

  // Tonal backgrounds for badges/banners
  successTonal: 'rgba(52, 211, 153, 0.14)',
  warningTonal: 'rgba(251, 191, 36, 0.14)',
  dangerTonal: 'rgba(251, 113, 133, 0.14)',
  primaryTonal: 'rgba(129, 140, 248, 0.16)',
  infoTonal: 'rgba(103, 232, 249, 0.14)',

  // Actions
  actionSecondaryBg: '#1E1E2E',
  onActionSecondary: '#A0A0B8',

  // Disabled (≥ 3:1)
  disabledBg: '#1E1E2E',
  disabledText: '#82829A',

  // Misc
  shadow: 'rgba(0, 0, 0, 0.45)',
} as const;

export type Colors = typeof lightColors;

// ── Shared tokens (identical in both modes) ─────────────────────────────────
const sharedTokens = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
    overline: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
    /** Numeric KPIs (summary counts) — tabular figures for scanability. */
    data: {
      fontSize: 24,
      fontWeight: '800' as const,
      lineHeight: 28,
      fontVariant: ['tabular-nums' as const],
    },
  },
  radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: {
    // boxShadow is supported natively by RN 0.76+ and by react-native-web.
    // The deprecated shadow* props (shadowOffset/shadowOpacity/shadowRadius)
    // trigger deprecation warnings on web, so they are no longer used.
    sm: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', elevation: 1 },
    md: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', elevation: 3 },
    lg: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)', elevation: 6 },
  },
  responsiveBreakpoint: 900,
} as const;

export { lightColors, darkColors, sharedTokens };
