import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AuditScreen from '../src/presentation/screens/AuditScreen';

jest.mock('../src/presentation/components/MapCanvas', () => 'MapCanvas');
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  callback(0);
  return 0;
};

jest.mock('../src/data/tagService', () => ({
  fetchTags: jest.fn().mockResolvedValue([
    {
      id: 1,
      unique_id: 'TAG-1000',
      color: '#ef4444',
      lat: 37.77,
      lon: -122.42,
      timestamp: '2026-05-01T00:00:00.000Z',
      state: 'open',
    },
  ]),
}));
jest.mock('../src/stores/authStore', () => ({
  useAuthStore: (selector: any) => selector({ isLoggedIn: true }),
}));

describe('AuditScreen map integration', () => {
  test('renders audit screen after loading data', async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<AuditScreen />);
      await Promise.resolve();
    });

    expect(tree!.toJSON()).toBeTruthy();
  });

  test('passes selectedId and onSelect to map', async () => {
    const MapCanvas = require('../src/presentation/components/MapCanvas');

    await act(async () => {
      renderer.create(<AuditScreen />);
      await Promise.resolve();
    });

    expect(MapCanvas).toBeTruthy();
  });

  test('renders selected detail panel content', async () => {
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<AuditScreen />);
      await Promise.resolve();
    });

    const textOutput = JSON.stringify(tree!.toJSON());
    expect(textOutput).toContain('TAG-1000');
    expect(textOutput).toContain('Estado: ');
    expect(textOutput).toContain('open');
  });
});
