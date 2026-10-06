/**
 * Tests for ArrivalRadiusModal
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ArrivalRadiusModal from '../../presentation/components/ArrivalRadiusModal';

describe('ArrivalRadiusModal', () => {
  it('renders title and suggested value', () => {
    const { getByText, getByLabelText } = render(
      <ArrivalRadiusModal
        visible
        suggestedMeters={10}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(getByText('Radio de llegada')).toBeTruthy();
    expect(getByLabelText('Radio de llegada en metros').props.value).toBe('10');
  });

  it('confirms with parsed radius value', () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByText } = render(
      <ArrivalRadiusModal visible onCancel={jest.fn()} onConfirm={onConfirm} />,
    );

    fireEvent.changeText(getByLabelText('Radio de llegada en metros'), '12');
    fireEvent.press(getByText('Guardar y navegar'));

    expect(onConfirm).toHaveBeenCalledWith(12);
  });

  it('shows validation error for non-positive values', () => {
    const onConfirm = jest.fn();
    const { getByLabelText, getByText } = render(
      <ArrivalRadiusModal visible onCancel={jest.fn()} onConfirm={onConfirm} />,
    );

    fireEvent.changeText(getByLabelText('Radio de llegada en metros'), '0');
    fireEvent.press(getByText('Guardar y navegar'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(getByText('Ingresa un radio válido en metros (mayor a 0).')).toBeTruthy();
  });

  it('invokes onCancel', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ArrivalRadiusModal visible onCancel={onCancel} onConfirm={jest.fn()} />,
    );

    fireEvent.press(getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
