/**
 * ThemeContext — dark/light theme support via React Context.
 *
 * Usage:
 *   import { useTheme } from '../themes/ThemeContext';
 *   const { colors, spacing, typography } = useTheme();
 *
 * On web: follows `prefers-color-scheme` media query.
 * On native: uses `useColorScheme()` from React Native.
 * Fallback: light theme.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// ── Light palette ────────────────────────────────────────────────────────────
const lightColors = {
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
  textCaption: '#6B7280',
  textButton: '#FFFFFF',
  textOverline: '#9CA3AF',
  textLink: '#0B5FFF',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  shadow: 'rgba(0, 0, 0, 0.08)',
  dangerTonal: 'rgba(239, 68, 68, 0.10)',
  primaryTonal: 'rgba(11, 95, 255, 0.10)',
} as const;

// ── Dark palette ─────────────────────────────────────────────────────────────
const darkColors = {
  primary: '#4D8FFF',
  primaryVariant: '#3370CC',
  background: '#0F1724',
  surface: '#1C2536',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  muted: '#64748B',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  border: '#334155',
  textCaption: '#94A3B8',
  textButton: '#FFFFFF',
  textOverline: '#64748B',
  textLink: '#4D8FFF',
  card: '#1C2536',
  cardBorder: '#334155',
  shadow: 'rgba(0, 0, 0, 0.30)',
  dangerTonal: 'rgba(248, 113, 113, 0.15)',
  primaryTonal: 'rgba(77, 143, 255, 0.15)',
} as const;

export type Colors = typeof lightColors;

// ── Shared tokens (same in both modes) ───────────────────────────────────────
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
  },
  radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    lg: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  },
  responsiveBreakpoint: 900,
} as const;

export interface ThemeTokens {
  colors: Colors;
  spacing: typeof sharedTokens.spacing;
  typography: typeof sharedTokens.typography;
  radii: typeof sharedTokens.radii;
  shadows: typeof sharedTokens.shadows;
  responsiveBreakpoint: number;
  isDark: boolean;
}

// ── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeTokens>({
  colors: lightColors,
  ...sharedTokens,
  isDark: false,
});

// ── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const value = useMemo<ThemeTokens>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      ...sharedTokens,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}

export default ThemeContext;
