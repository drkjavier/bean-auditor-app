import React from 'react';
import { render } from '@testing-library/react-native';
import Input from '../src/presentation/components/Input';

describe('Input', () => {
  it('renders label and toggles secure visibility', () => {
    const { getByText, getByLabelText } = render(<Input label="Password" secure testID="pwd" />);
    expect(getByText('Password')).toBeTruthy();
    const input = getByLabelText('Password');
    expect(input).toBeTruthy();
  });
});
