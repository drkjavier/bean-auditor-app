/**
 * ThemeContext — "Graphite + Indigo" light/dark theme with user-selectable mode.
 *
 * Single source of truth for all design tokens (see `tokens.ts`).
 * Consumers MUST use `useTheme()` instead of importing palettes directly.
 *
 * Theme resolution:
 *   - settingsStore.themeMode = 'system' (default) → follows prefers-color-scheme
 *     (web media query / useColorScheme on native).
 *   - 'light' / 'dark' → forces the corresponding palette.
 *   - Invalid persisted values fall back to 'system'.
 */
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, sharedTokens, type Colors } from './tokens';
import { sanitizeThemeMode, type ThemeMode } from '../../domain/constants/themeMode';
import { useSettingsStore } from '../../state/settingsStore';

export type { ThemeMode };

export interface ThemeTokens {
  colors: Colors;
  spacing: typeof sharedTokens.spacing;
  typography: typeof sharedTokens.typography;
  radii: typeof sharedTokens.radii;
  shadows: typeof sharedTokens.shadows;
  responsiveBreakpoint: number;
  /** True when the active palette is the dark one. */
  isDark: boolean;
  /** Current user preference ('light' | 'dark' | 'system'). */
  themeMode: ThemeMode;
  /** Update the persisted user preference. */
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeTokens>({
  colors: lightColors,
  ...sharedTokens,
  isDark: false,
  themeMode: 'system',
  setThemeMode: () => {
    /* no-op default (outside provider) */
  },
});

// ── Provider ────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const themeMode = useSettingsStore(state => state.themeMode);
  const setThemeMode = useSettingsStore(state => state.setThemeMode);

  // Sanitize on read: an invalid persisted value must never break rendering.
  const safeMode = sanitizeThemeMode(themeMode);
  const isDark = safeMode === 'system' ? scheme === 'dark' : safeMode === 'dark';

  // Keep the store self-healed when a bad value is detected.
  useEffect(() => {
    if (themeMode !== safeMode) {
      setThemeMode(safeMode);
    }
  }, [themeMode, safeMode, setThemeMode]);

  const value = useMemo<ThemeTokens>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      ...sharedTokens,
      isDark,
      themeMode: safeMode,
      setThemeMode,
    }),
    [isDark, safeMode, setThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}

export default ThemeContext;
