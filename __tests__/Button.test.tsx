import React from 'react';
import { render } from '@testing-library/react-native';
import Button from '../src/presentation/components/Button';

describe('Button', () => {
  it('renders children and handles loading/disabled visuals', () => {
    const { getByText, rerender } = render(<Button onPress={() => {}}>Click</Button>);
    expect(getByText('Click')).toBeTruthy();

    rerender(<Button loading onPress={() => {}}>Loading</Button>);
    expect(getByText('Loading')).toBeTruthy();
  });
});
