/**
 * Tests for NavigationArrow component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NavigationArrow from '../../presentation/components/NavigationArrow';
import type { NavigationArrowProps } from '../../presentation/components/NavigationArrow';

// Mock data
const defaultProps: NavigationArrowProps = {
  bearing: 45,
  distance: 150,
  tagId: 'TAG-001',
  tagStatus: 'pending',
  visible: true,
  onPress: jest.fn(),
};

describe('NavigationArrow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when visible is true', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} />);
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
    });

    it('should not render when visible is false', () => {
      const { queryByRole } = render(
        <NavigationArrow {...defaultProps} visible={false} />
      );
      
      const button = queryByRole('button');
      expect(button).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have correct accessibility label', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('TAG-001');
      expect(button.props.accessibilityLabel).toContain('150');
      expect(button.props.accessibilityLabel).toContain('metros');
    });

    it('should include direction in accessibility label', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} bearing={45} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('Noreste');
    });

    it('should have button role', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility hint', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBeTruthy();
    });
  });

  describe('distance display', () => {
    it('should display distance in meters', () => {
      const { getByText } = render(<NavigationArrow {...defaultProps} distance={150} />);
      
      expect(getByText('150m')).toBeTruthy();
    });

    it('should display distance in kilometers', () => {
      const { getByText } = render(<NavigationArrow {...defaultProps} distance={2500} />);
      
      expect(getByText('2.5km')).toBeTruthy();
    });

    it('should display 0m for zero distance', () => {
      const { getByText } = render(<NavigationArrow {...defaultProps} distance={0} />);
      
      expect(getByText('0m')).toBeTruthy();
    });
  });

  describe('tag display', () => {
    it('should display tag ID', () => {
      const { getByText } = render(<NavigationArrow {...defaultProps} tagId="TAG-001" />);
      
      expect(getByText('TAG-001')).toBeTruthy();
    });

    it('should display status label for pending', () => {
      const { getByText } = render(
        <NavigationArrow {...defaultProps} tagStatus="pending" />
      );
      
      expect(getByText('Pendiente')).toBeTruthy();
    });

    it('should display status label for audited', () => {
      const { getByText } = render(
        <NavigationArrow {...defaultProps} tagStatus="audited" />
      );
      
      expect(getByText('Auditado')).toBeTruthy();
    });

    it('should display status label for not_audited', () => {
      const { getByText } = render(
        <NavigationArrow {...defaultProps} tagStatus="not_audited" />
      );
      
      expect(getByText('No auditado')).toBeTruthy();
    });

    it('should display default status for null', () => {
      const { getByText } = render(
        <NavigationArrow {...defaultProps} tagStatus={null} />
      );
      
      expect(getByText('Sin auditar')).toBeTruthy();
    });
  });

  describe('press interaction', () => {
    it('should call onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByRole } = render(
        <NavigationArrow {...defaultProps} onPress={onPressMock} />
      );
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not crash when onPress is undefined', () => {
      const { getByRole } = render(
        <NavigationArrow {...defaultProps} onPress={undefined} />
      );
      
      const button = getByRole('button');
      // Should not throw when pressing without onPress
      expect(() => fireEvent.press(button)).not.toThrow();
    });
  });

  describe('bearing directions', () => {
    it('should include Norte for 0 degrees', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} bearing={0} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('Norte');
    });

    it('should include Este for 90 degrees', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} bearing={90} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('Este');
    });

    it('should include Sur for 180 degrees', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} bearing={180} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('Sur');
    });

    it('should include Oeste for 270 degrees', () => {
      const { getByRole } = render(<NavigationArrow {...defaultProps} bearing={270} />);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('Oeste');
    });
  });
});
