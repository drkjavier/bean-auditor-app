/**
 * Tests for settingsStore — showUserLocation + arrival radius persistence.
 *
 * SettingsRepository is mocked with an in-memory fake; SQLite behavior is
 * covered in __tests__/sqlite/settingsRepository.test.ts.
 */

import { act } from '@testing-library/react-native';
import {
  useSettingsStore,
  canStartNavigationWithoutRadiusModal,
  DEFAULT_ARRIVAL_RADIUS_METERS,
} from '../../state/settingsStore';

jest.mock('../../data/settings/SettingsRepository', () => {
  const memory = new Map<string, string | number | boolean>();
  const SETTINGS_KEYS = {
    showUserLocation: 'showUserLocation',
    arrivalRadiusMeters: 'arrivalRadiusMeters',
    themeMode: 'themeMode',
    legacyMigrationDone: '__legacy_migration_v1',
  };
  return {
    __memory: memory,
    SETTINGS_KEYS,
    getSetting: jest.fn(async (key: string) => (memory.has(key) ? memory.get(key) : null)),
    setSetting: jest.fn(async (key: string, value: string | number | boolean) => {
      memory.set(key, value);
    }),
    getShowUserLocation: jest.fn(async () => {
      const v = memory.get(SETTINGS_KEYS.showUserLocation);
      return v === true || v === 'true';
    }),
    setShowUserLocation: jest.fn(async (v: boolean) => {
      memory.set(SETTINGS_KEYS.showUserLocation, v);
    }),
    getArrivalRadiusMeters: jest.fn(async () => {
      const v = memory.get(SETTINGS_KEYS.arrivalRadiusMeters);
      return typeof v === 'number' ? v : null;
    }),
    setArrivalRadiusMeters: jest.fn(async (m: number) => {
      memory.set(SETTINGS_KEYS.arrivalRadiusMeters, m);
    }),
    getThemeMode: jest.fn(async () => {
      const v = memory.get(SETTINGS_KEYS.themeMode);
      return typeof v === 'string' ? v : null;
    }),
    setThemeMode: jest.fn(async (mode: string) => {
      memory.set(SETTINGS_KEYS.themeMode, mode);
    }),
    migrateLegacyLocalStorage: jest.fn(async () => {}),
  };
});

// Access the mocked repo after imports (mock is registered by jest.mock hoist)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const repo = require('../../data/settings/SettingsRepository');

beforeEach(() => {
  repo.__memory.clear();
  jest.clearAllMocks();
  act(() => {
    useSettingsStore.setState({
      showUserLocation: false,
      arrivalRadiusMeters: null,
      arrivalRadiusConfigured: false,
      themeMode: 'system',
    });
  });
});

describe('settingsStore arrival radius', () => {
  it('starts unconfigured when nothing persisted', () => {
    const state = useSettingsStore.getState();
    expect(state.arrivalRadiusConfigured).toBe(false);
    expect(state.arrivalRadiusMeters).toBeNull();
    expect(DEFAULT_ARRIVAL_RADIUS_METERS).toBe(10);
  });

  it('persists a positive radius through SettingsRepository', () => {
    act(() => {
      useSettingsStore.getState().setArrivalRadius(15);
    });

    const state = useSettingsStore.getState();
    expect(state.arrivalRadiusMeters).toBe(15);
    expect(state.arrivalRadiusConfigured).toBe(true);
    expect(repo.setArrivalRadiusMeters).toHaveBeenCalledWith(15);
  });

  it('rejects invalid radius values without persisting', () => {
    act(() => {
      useSettingsStore.getState().setArrivalRadius(0);
      useSettingsStore.getState().setArrivalRadius(-5);
      useSettingsStore.getState().setArrivalRadius(Number.NaN);
    });

    const state = useSettingsStore.getState();
    expect(state.arrivalRadiusConfigured).toBe(false);
    expect(state.arrivalRadiusMeters).toBeNull();
    expect(repo.setArrivalRadiusMeters).not.toHaveBeenCalled();
  });

  it('still updates state when persistence fails (UX first)', async () => {
    repo.setArrivalRadiusMeters.mockRejectedValueOnce(new Error('db corrupt'));

    await act(async () => {
      useSettingsStore.getState().setArrivalRadius(15);
      await Promise.resolve();
    });

    const state = useSettingsStore.getState();
    expect(state.arrivalRadiusMeters).toBe(15);
    expect(state.arrivalRadiusConfigured).toBe(true);
  });

  it('hydrateSettings loads values from the repository', async () => {
    repo.__memory.set('showUserLocation', true);
    repo.__memory.set('arrivalRadiusMeters', 12);

    let hydrated = false;
    await act(async () => {
      hydrated = await useSettingsStore.getState().hydrateSettings();
    });

    expect(hydrated).toBe(true);
    const state = useSettingsStore.getState();
    expect(state.showUserLocation).toBe(true);
    expect(state.arrivalRadiusMeters).toBe(12);
    expect(state.arrivalRadiusConfigured).toBe(true);
    expect(repo.migrateLegacyLocalStorage).toHaveBeenCalled();
  });

  it('hydrateSettings returns false when no radius is configured', async () => {
    let hydrated = true;
    await act(async () => {
      hydrated = await useSettingsStore.getState().hydrateSettings();
    });

    expect(hydrated).toBe(false);
    expect(useSettingsStore.getState().arrivalRadiusConfigured).toBe(false);
  });

  it('setShowUserLocation persists through SettingsRepository', () => {
    act(() => {
      useSettingsStore.getState().setShowUserLocation(true);
    });

    expect(useSettingsStore.getState().showUserLocation).toBe(true);
    expect(repo.setShowUserLocation).toHaveBeenCalledWith(true);
  });

  it('canStartNavigationWithoutRadiusModal is false until radius configured', () => {
    expect(canStartNavigationWithoutRadiusModal()).toBe(false);

    act(() => {
      useSettingsStore.getState().setArrivalRadius(10);
    });

    expect(canStartNavigationWithoutRadiusModal()).toBe(true);
  });

  it('canStartNavigationWithoutRadiusModal recovers after hydrateSettings', async () => {
    act(() => {
      useSettingsStore.setState({
        arrivalRadiusMeters: null,
        arrivalRadiusConfigured: false,
      });
    });
    repo.__memory.set('arrivalRadiusMeters', 14);

    await act(async () => {
      await useSettingsStore.getState().hydrateSettings();
    });

    expect(canStartNavigationWithoutRadiusModal()).toBe(true);
    expect(useSettingsStore.getState().arrivalRadiusMeters).toBe(14);
  });
});

describe('settingsStore theme mode', () => {
  it('defaults to system', () => {
    expect(useSettingsStore.getState().themeMode).toBe('system');
  });

  it('persists a valid theme mode through SettingsRepository', () => {
    act(() => {
      useSettingsStore.getState().setThemeMode('dark');
    });

    expect(useSettingsStore.getState().themeMode).toBe('dark');
    expect(repo.setThemeMode).toHaveBeenCalledWith('dark');
  });

  it('sanitizes invalid theme mode values to system', () => {
    act(() => {
      useSettingsStore.getState().setThemeMode('blue' as any);
    });

    expect(useSettingsStore.getState().themeMode).toBe('system');
    expect(repo.setThemeMode).toHaveBeenCalledWith('system');
  });

  it('hydrateSettings loads persisted theme mode and sanitizes invalid values', async () => {
    repo.__memory.set('themeMode', 'light');

    await act(async () => {
      await useSettingsStore.getState().hydrateSettings();
    });
    expect(useSettingsStore.getState().themeMode).toBe('light');

    repo.__memory.set('themeMode', 'neon');
    await act(async () => {
      await useSettingsStore.getState().hydrateSettings();
    });
    expect(useSettingsStore.getState().themeMode).toBe('system');
  });

  it('still updates state when theme persistence fails (UX first)', async () => {
    repo.setThemeMode.mockRejectedValueOnce(new Error('db corrupt'));

    await act(async () => {
      useSettingsStore.getState().setThemeMode('dark');
      await Promise.resolve();
    });

    expect(useSettingsStore.getState().themeMode).toBe('dark');
  });
});
