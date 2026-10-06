import { create } from 'zustand';
import * as settingsRepo from '../data/settings/SettingsRepository';
import { sanitizeThemeMode, type ThemeMode } from '../domain/constants/themeMode';

/** Default arrival radius in meters when user configures without a prior value. */
export const DEFAULT_ARRIVAL_RADIUS_METERS = 10;

type SettingsState = {
  // When true, the native map will show the user's location pin/button
  showUserLocation: boolean;
  setShowUserLocation: (v: boolean) => void;

  /** GPS radius (meters) to detect arrival at a navigation target tag. */
  arrivalRadiusMeters: number | null;
  /** True once the user has explicitly configured an arrival radius. */
  arrivalRadiusConfigured: boolean;
  /** Persist a positive arrival radius and mark it as configured. */
  setArrivalRadius: (meters: number) => void;

  /**
   * UI theme preference. 'system' (default) follows the device setting;
   * 'light' / 'dark' force the corresponding Terra Harvest palette.
   */
  themeMode: ThemeMode;
  /** Persist a theme mode ('light' | 'dark' | 'system'). Invalid values fall back to 'system'. */
  setThemeMode: (mode: ThemeMode) => void;

  /**
   * Load settings from SQLite (after the one-time legacy localStorage
   * migration). Returns true when a valid arrival radius is available.
   */
  hydrateSettings: () => Promise<boolean>;
};

export const useSettingsStore = create<SettingsState>(set => ({
  showUserLocation: false,
  setShowUserLocation: (v: boolean) => {
    // Update state synchronously; persistence is best-effort (UX first)
    set({ showUserLocation: v });
    settingsRepo.setShowUserLocation(v).catch(err => {
      console.warn('[settings] Failed to persist showUserLocation:', err);
    });
  },

  themeMode: 'system',
  setThemeMode: (mode: ThemeMode) => {
    const safe = sanitizeThemeMode(mode);
    set({ themeMode: safe });
    settingsRepo.setThemeMode(safe).catch(err => {
      console.warn('[settings] Failed to persist themeMode:', err);
    });
  },

  arrivalRadiusMeters: null,
  arrivalRadiusConfigured: false,

  setArrivalRadius: (meters: number) => {
    if (!Number.isFinite(meters) || meters <= 0) {
      return;
    }
    set({ arrivalRadiusMeters: meters, arrivalRadiusConfigured: true });
    settingsRepo.setArrivalRadiusMeters(meters).catch(err => {
      console.warn('[settings] Failed to persist arrivalRadiusMeters:', err);
    });
  },

  hydrateSettings: async () => {
    try {
      await settingsRepo.migrateLegacyLocalStorage();
    } catch (err) {
      console.warn('[settings] Legacy migration error:', err);
    }
    const [showUserLocation, radiusMeters, themeMode] = await Promise.all([
      settingsRepo.getShowUserLocation().catch(() => false),
      settingsRepo.getArrivalRadiusMeters().catch(() => null),
      settingsRepo.getThemeMode().catch(() => 'system' as const),
    ]);
    set({
      showUserLocation,
      arrivalRadiusMeters: radiusMeters,
      arrivalRadiusConfigured: radiusMeters != null,
      themeMode: sanitizeThemeMode(themeMode),
    });
    return radiusMeters != null;
  },
}));

/**
 * True when navigation can start without asking for arrival radius.
 * Reads the in-memory store (hydrateSettings runs at app start).
 */
export function canStartNavigationWithoutRadiusModal(): boolean {
  const state = useSettingsStore.getState();
  return (
    state.arrivalRadiusConfigured &&
    state.arrivalRadiusMeters != null &&
    Number.isFinite(state.arrivalRadiusMeters) &&
    state.arrivalRadiusMeters > 0
  );
}

export default useSettingsStore;
