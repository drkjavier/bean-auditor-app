import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapCanvas from '../src/presentation/components/MapCanvas';

const rnMapsMock = require('../__mocks__/react-native-maps');

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
