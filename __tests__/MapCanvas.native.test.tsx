import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MapCanvas from '../src/presentation/components/MapCanvas';

jest.mock('../src/presentation/components/MapCanvas.native', () => require('../__mocks__/react-native-maps').default);
jest.mock('@react-native-community/geolocation', () => require('../__mocks__/geolocation').default);
jest.mock('react-native-permissions', () => require('../__mocks__/react-native-permissions'));

describe('MapCanvas native behavior', () => {
  test('renders fallback or native MapView on native platform', async () => {
    // Render the platform proxy; the test environment simulates native imports
    let tree;
    await act(async () => {
      tree = renderer.create(<MapCanvas items={[]} />);
      await Promise.resolve();
    });

    expect(tree.toJSON()).toBeTruthy();
  });
});
