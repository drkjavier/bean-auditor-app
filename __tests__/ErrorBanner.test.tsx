import React from 'react';
import { render } from '@testing-library/react-native';
import ErrorBanner from '../src/presentation/components/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders message when provided', () => {
    const { getByText } = render(<ErrorBanner message="Oops" />);
    expect(getByText('Oops')).toBeTruthy();
  });

  it('renders null when no message', () => {
    const { queryByText } = render(<ErrorBanner /> as any);
    expect(queryByText('')).toBeNull();
  });
});
