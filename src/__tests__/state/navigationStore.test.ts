/**
 * Tests for navigationStore
 */

import { act } from '@testing-library/react-native';
import { useNavigationStore } from '../../state/navigationStore';
import type { Tag } from '../../data/mocks/tagsMock';

// Mock data
const mockTags: Tag[] = [
  {
    uuid: 'tag-001',
    colorHex: '#FF0000',
    unique_id: 'TAG-001',
    lat: 14.284000,
    lon: -91.366000,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'pending',
    sync_pending: false,
  },
  {
    uuid: 'tag-002',
    colorHex: '#00FF00',
    unique_id: 'TAG-002',
    lat: 14.282000,
    lon: -91.367000,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'audited',
    sync_pending: false,
  },
  {
    uuid: 'tag-003',
    colorHex: '#0000FF',
    unique_id: 'TAG-003',
    lat: 14.285000,
    lon: -91.365000,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'not_audited',
    sync_pending: false,
  },
  {
    uuid: 'tag-004',
    colorHex: '#FFFF00',
    unique_id: 'TAG-004',
    lat: 14.283500,
    lon: -91.366500,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'pending',
    sync_pending: false,
  },
];

// Reset store before each test
beforeEach(() => {
  act(() => {
    useNavigationStore.getState().stopNavigation();
  });
});

describe('navigationStore', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useNavigationStore.getState();
      
      expect(state.isNavigationActive).toBe(false);
      expect(state.userPosition).toBeNull();
      expect(state.positionError).toBeNull();
      expect(state.nearestTag).toBeNull();
      expect(state.distanceToNearest).toBeNull();
      expect(state.bearingToNearest).toBeNull();
      expect(state.currentTags).toEqual([]);
    });
  });

  describe('startNavigation', () => {
    it('should activate navigation mode', () => {
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.isNavigationActive).toBe(true);
      expect(state.currentTags).toEqual(mockTags);
    });

    it('should calculate nearest tag when position is available', () => {
      // Set position first
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      // Start navigation
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).not.toBeNull();
      // TAG-004 is closest to center
      expect(state.nearestTag?.unique_id).toBe('TAG-004');
      expect(state.distanceToNearest).not.toBeNull();
      expect(state.bearingToNearest).not.toBeNull();
    });

    it('should exclude audited tags from nearest calculation', () => {
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      const state = useNavigationStore.getState();
      
      // Should not be TAG-002 which is audited
      expect(state.nearestTag?.unique_id).not.toBe('TAG-002');
    });

    it('should clear position error when starting', () => {
      act(() => {
        useNavigationStore.getState().setPositionError('Some error');
      });
      
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.positionError).toBeNull();
    });
  });

  describe('stopNavigation', () => {
    it('should deactivate navigation mode', () => {
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      act(() => {
        useNavigationStore.getState().stopNavigation();
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.isNavigationActive).toBe(false);
      expect(state.nearestTag).toBeNull();
      expect(state.distanceToNearest).toBeNull();
      expect(state.bearingToNearest).toBeNull();
      expect(state.currentTags).toEqual([]);
    });

    it('should clear user position', () => {
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      act(() => {
        useNavigationStore.getState().stopNavigation();
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.userPosition).toBeNull();
    });
  });

  describe('updateUserPosition', () => {
    it('should update user position', () => {
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.userPosition).toEqual({ lat: 14.283333, lon: -91.366667 });
    });

    it('should recalculate nearest tag when navigation is active', () => {
      // Start navigation first
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      // Update position
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).not.toBeNull();
      expect(state.distanceToNearest).not.toBeNull();
      expect(state.bearingToNearest).not.toBeNull();
    });

    it('should clear position error', () => {
      act(() => {
        useNavigationStore.getState().setPositionError('Some error');
      });
      
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.positionError).toBeNull();
    });
  });

  describe('setPositionError', () => {
    it('should set position error', () => {
      act(() => {
        useNavigationStore.getState().setPositionError('GPS signal lost');
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.positionError).toBe('GPS signal lost');
    });
  });

  describe('recalculateNearest', () => {
    it('should recalculate nearest tag with current position and tags', () => {
      // Set position and tags
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      // Manually recalculate
      act(() => {
        useNavigationStore.getState().recalculateNearest();
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).not.toBeNull();
    });

    it('should return null when no position available', () => {
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      // Don't set position
      act(() => {
        useNavigationStore.getState().recalculateNearest();
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).toBeNull();
      expect(state.distanceToNearest).toBeNull();
      expect(state.bearingToNearest).toBeNull();
    });

    it('should return null when no tags available', () => {
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      // Start with no tags
      act(() => {
        useNavigationStore.getState().startNavigation([]);
      });
      
      act(() => {
        useNavigationStore.getState().recalculateNearest();
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).toBeNull();
    });
  });

  describe('setCurrentTags', () => {
    it('should update current tags', () => {
      const newTags = [mockTags[0], mockTags[1]];
      
      act(() => {
        useNavigationStore.getState().setCurrentTags(newTags);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.currentTags).toEqual(newTags);
    });

    it('should recalculate nearest tag if navigation is active', () => {
      // Start navigation with initial tags
      act(() => {
        useNavigationStore.getState().startNavigation(mockTags);
      });
      
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      // Update tags (remove the nearest one)
      const filteredTags = mockTags.filter(t => t.unique_id !== 'TAG-004');
      
      act(() => {
        useNavigationStore.getState().setCurrentTags(filteredTags);
      });
      
      const state = useNavigationStore.getState();
      
      // Should now be a different tag
      expect(state.nearestTag?.unique_id).not.toBe('TAG-004');
    });
  });

  describe('edge cases', () => {
    it('should handle all tags audited', () => {
      const allAudited = mockTags.map(t => ({ ...t, audit_status: 'audited' as const }));
      
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      act(() => {
        useNavigationStore.getState().startNavigation(allAudited);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).toBeNull();
      expect(state.distanceToNearest).toBeNull();
      expect(state.bearingToNearest).toBeNull();
    });

    it('should handle single tag', () => {
      act(() => {
        useNavigationStore.getState().updateUserPosition(14.283333, -91.366667);
      });
      
      act(() => {
        useNavigationStore.getState().startNavigation([mockTags[0]]);
      });
      
      const state = useNavigationStore.getState();
      
      expect(state.nearestTag).not.toBeNull();
      expect(state.nearestTag?.unique_id).toBe('TAG-001');
    });
  });
});
