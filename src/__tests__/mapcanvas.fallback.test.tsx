import React from 'react';
import { render } from '@testing-library/react-native';
import MapCanvasFallback from '../presentation/components/MapCanvas.fallback';
import tagsMock from '../data/mocks/tagsMock';

// tagsMock may be a large array or undefined in some test environments; guard it
const sampleTags = Array.isArray(tagsMock) ? tagsMock.slice(0, 3) : [];

describe('MapCanvas.fallback', () => {
  it('renders error message when mapLoadError is provided', () => {
    const { getByTestId } = render(<MapCanvasFallback items={sampleTags as any} mapLoadError="not found" /> as any);
    expect(getByTestId('mapLoadError')).toBeTruthy();
  });
});
