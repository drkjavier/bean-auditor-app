import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapCanvas from '../src/presentation/components/MapCanvas';

const rnMapsMock = require('../__mocks__/react-native-maps');

// ── Mock SafeAreaProvider (native module not available in Jest) ────────────────
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => R.createElement(R.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaView: ({ children, ...props }: any) => R.createElement('View', props, children),
  };
});

describe('MapCanvas showsUserLocation prop', () => {
  beforeEach(() => {
    if (rnMapsMock.__getAnimateMock) rnMapsMock.__getAnimateMock().mockClear();
  });

  test('passes showsUserLocation to MapView when prop enabled', async () => {
    await act(async () => {
      renderer.create(
        <SafeAreaProvider>
          <MapCanvas items={[]} showUserLocation={true} />
        </SafeAreaProvider>
      );
    });

    const props = rnMapsMock.__getLastProps();
    // In some test environments the mock records last props on the module-level
    // object; ensure it's defined and contains the expected keys.
    expect(props).toBeTruthy();
    if (props) {
      expect(props.showsUserLocation === true || props.props?.showsUserLocation === true).toBeTruthy();
      expect(props.showsMyLocationButton === true || props.props?.showsMyLocationButton === true).toBeTruthy();
    }
  });
});
