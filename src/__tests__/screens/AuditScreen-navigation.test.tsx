/**
 * Tests for AuditScreen navigation integration
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AuditScreen from '../../presentation/screens/AuditScreen';
import { useNavigationStore } from '../../state/navigationStore';

// Mock modules
jest.mock('../../data/tagService', () => ({
  fetchTags: jest.fn().mockResolvedValue([]),
  saveTagAudit: jest.fn().mockResolvedValue(undefined),
  getAuditCounts: jest.fn().mockResolvedValue({ audited: 0, not_audited: 0, pending: 0, total: 0 }),
}));

jest.mock('../../infrastructure/api/abortManager', () => ({
  createAndRegisterAbortController: jest.fn().mockReturnValue({ signal: null }),
  unregisterAbortController: jest.fn(),
  abortAllControllers: jest.fn(),
}));

jest.mock('../../state/settingsStore', () => {
  const state = {
    showUserLocation: false,
    arrivalRadiusMeters: 10,
    arrivalRadiusConfigured: true,
    setShowUserLocation: jest.fn(),
    setArrivalRadius: jest.fn(),
    hydrateSettings: jest.fn().mockResolvedValue(true),
  };
  const store: any = (selector?: (s: typeof state) => unknown) =>
    typeof selector === 'function' ? selector(state) : state;
  store.getState = () => state;
  store.setState = jest.fn();
  return {
    useSettingsStore: store,
    DEFAULT_ARRIVAL_RADIUS_METERS: 10,
    canStartNavigationWithoutRadiusModal: jest.fn().mockReturnValue(true),
  };
});

jest.mock('../../stores', () => ({
  useAuthStore: jest.fn().mockReturnValue({
    isLoggedIn: true,
    username: 'test-user',
  }),
}));

jest.mock('../../infrastructure/locationService', () => ({
  checkPermission: jest.fn().mockResolvedValue('granted'),
  requestPermission: jest.fn().mockResolvedValue('granted'),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn().mockReturnValue(1),
  RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
}));

jest.mock('react-native-permissions', () => ({
  RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
}));

jest.mock('../../presentation/components/MapCanvas', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return function MockMapCanvas(props: any) {
    return (
      View ? (
        <View testID="map-canvas">
          <Text>Mock Map</Text>
          {props.isNavigationActive && (
            <Text testID="navigation-active">Navigation Active</Text>
          )}
        </View>
      ) : null
    );
  };
});

jest.mock('../../presentation/components/NavigationPanel', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return function MockNavigationPanel(props: any) {
    return (
      View ? (
        <View testID="navigation-panel">
          <Text testID="target-tag">{props.targetTag?.unique_id || 'No target'}</Text>
          <Text testID="distance">{props.distance || 'No distance'}</Text>
          <Pressable testID="audit-button" onPress={props.onAudit}>
            <Text>Auditar</Text>
          </Pressable>
          <Pressable testID="next-button" onPress={props.onNext}>
            <Text>Siguiente</Text>
          </Pressable>
          <Pressable testID="close-button" onPress={props.onClose}>
            <Text>Cerrar</Text>
          </Pressable>
        </View>
      ) : null
    );
  };
});

describe('AuditScreen Navigation Integration', () => {
  beforeEach(() => {
    // Reset navigation store
    act(() => {
      useNavigationStore.getState().stopNavigation();
    });
  });

  it('should render navigation toggle button', () => {
    const { getByText } = render(<AuditScreen />);
    
    expect(getByText('Modo Navegación')).toBeTruthy();
  });

  it('should not show navigation panel initially', () => {
    const { queryByTestId } = render(<AuditScreen />);
    
    expect(queryByTestId('navigation-panel')).toBeNull();
  });

  it('should activate navigation mode when toggle is pressed', async () => {
    const { getByText } = render(<AuditScreen />);
    
    const toggleButton = getByText('Modo Navegación');
    
    await act(async () => {
      fireEvent.press(toggleButton);
    });
    
    // Navigation should be active
    const state = useNavigationStore.getState();
    expect(state.isNavigationActive).toBe(true);
  });

  it('should show navigation panel when navigation is active', async () => {
    const { getByText, getByTestId } = render(<AuditScreen />);
    
    const toggleButton = getByText('Modo Navegación');
    
    await act(async () => {
      fireEvent.press(toggleButton);
    });
    
    // Navigation panel should be visible
    expect(getByTestId('navigation-panel')).toBeTruthy();
  });

  it('should deactivate navigation when close button is pressed', async () => {
    const { getByText, getByTestId } = render(<AuditScreen />);
    
    // Activate navigation
    const toggleButton = getByText('Modo Navegación');
    await act(async () => {
      fireEvent.press(toggleButton);
    });
    
    // Press close button in navigation panel
    const closeButton = getByTestId('close-button');
    await act(async () => {
      fireEvent.press(closeButton);
    });
    
    // Navigation should be deactivated
    const state = useNavigationStore.getState();
    expect(state.isNavigationActive).toBe(false);
  });

  it('should pass navigation props to MapCanvas', async () => {
    const { getByTestId, getByText } = render(<AuditScreen />);
    
    // Activate navigation
    const toggleButton = getByText('Modo Navegación');
    await act(async () => {
      fireEvent.press(toggleButton);
    });
    
    // MapCanvas should show navigation active
    expect(getByTestId('navigation-active')).toBeTruthy();
  });
});
