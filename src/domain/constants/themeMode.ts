/**
 * Theme mode — pure domain constant shared by state and presentation.
 *
 * Lives in domain (framework-free) so both the settings store (state layer)
 * and the theme provider (presentation layer) can depend on it without
 * violating the layer rule: presentation → domain ← data, state → domain.
 */

/** User-selectable UI theme mode (persisted as a string setting). */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Sanitizes a persisted/unknown theme mode value. Invalid values fall back to 'system'. */
export function sanitizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export default { sanitizeThemeMode };
