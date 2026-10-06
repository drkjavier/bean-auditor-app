/**
 * Tests for ArrivalActionModal
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ArrivalActionModal from '../../presentation/components/ArrivalActionModal';
import type { Tag } from '../../data/mocks/tagsMock';

const targetTag: Tag = {
  uuid: 'tag-004',
  colorHex: '#FFFF00',
  unique_id: 'TAG-004',
  lat: 14.2835,
  lon: -91.3665,
  timestamp: '2026-06-25T10:00:00Z',
  audit_status: 'pending',
  sync_pending: false,
};

describe('ArrivalActionModal', () => {
  it('renders destination and actions when visible', () => {
    const { getByText, getByLabelText } = render(
      <ArrivalActionModal
        visible
        targetTag={targetTag}
        onAudit={jest.fn()}
        onSkip={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('Has llegado')).toBeTruthy();
    expect(getByText('Tag destino: TAG-004')).toBeTruthy();
    expect(getByLabelText('Auditar tag TAG-004')).toBeTruthy();
    expect(getByLabelText('Saltar tag por ahora en esta sesión')).toBeTruthy();
  });

  it('invokes onAudit when Auditar is pressed', () => {
    const onAudit = jest.fn();
    const { getByLabelText } = render(
      <ArrivalActionModal
        visible
        targetTag={targetTag}
        onAudit={onAudit}
        onSkip={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Auditar tag TAG-004'));
    expect(onAudit).toHaveBeenCalledTimes(1);
  });

  it('invokes onSkip when Saltar por ahora is pressed', () => {
    const onSkip = jest.fn();
    const { getByLabelText } = render(
      <ArrivalActionModal
        visible
        targetTag={targetTag}
        onAudit={jest.fn()}
        onSkip={onSkip}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Saltar tag por ahora en esta sesión'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('invokes onClose when Cerrar is pressed', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <ArrivalActionModal
        visible
        targetTag={targetTag}
        onAudit={jest.fn()}
        onSkip={jest.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.press(getByLabelText('Cerrar sin ejecutar acción'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows processing state and hides action buttons', () => {
    const onAudit = jest.fn();
    const { getByText, queryByLabelText } = render(
      <ArrivalActionModal
        visible
        targetTag={targetTag}
        isProcessing
        onAudit={onAudit}
        onSkip={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('Verificando tag NFC…')).toBeTruthy();
    expect(queryByLabelText('Auditar tag TAG-004')).toBeNull();
  });

  it('does not render content when not visible', () => {
    const { queryByText } = render(
      <ArrivalActionModal
        visible={false}
        targetTag={targetTag}
        onAudit={jest.fn()}
        onSkip={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(queryByText('Has llegado')).toBeNull();
  });
});
