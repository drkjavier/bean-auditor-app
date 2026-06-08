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
    expect(props).toBeTruthy();
    expect(props.showsUserLocation).toBe(true);
    expect(props.showsMyLocationButton).toBe(true);
  });
});
