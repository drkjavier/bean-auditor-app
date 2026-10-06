/**
 * Tests for navigationStore — Waze arrival / skip / action-modal flow
 */

import { act } from '@testing-library/react-native';
import { useNavigationStore } from '../../state/navigationStore';
import { useSettingsStore } from '../../state/settingsStore';
import type { Tag } from '../../data/mocks/tagsMock';

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

beforeEach(() => {
  act(() => {
    useNavigationStore.getState().stopNavigation();
    useSettingsStore.getState().setArrivalRadius(10);
  });
});

describe('navigationStore arrival flow', () => {
  it('loads arrival radius from settings on startNavigation', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
    });

    expect(useNavigationStore.getState().arrivalRadiusMeters).toBe(10);
  });

  it('does not show arrival modal when outside radius', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
      useNavigationStore.getState().updateUserPosition(14.280000, -91.370000);
    });

    expect(useNavigationStore.getState().isArrivalModalVisible).toBe(false);
  });

  it('shows arrival modal when inside configured radius', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
      // Near TAG-004 (closest pending)
      useNavigationStore.getState().updateUserPosition(14.283500, -91.366500);
    });

    const state = useNavigationStore.getState();
    expect(state.nearestTag?.unique_id).toBe('TAG-004');
    expect(state.isArrivalModalVisible).toBe(true);
    expect(state.lastArrivalPromptedTagUuid).toBe('tag-004');
  });

  it('does not re-prompt for same tag after closing without action', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
      useNavigationStore.getState().updateUserPosition(14.283500, -91.366500);
    });

    act(() => {
      useNavigationStore.getState().hideArrivalModal();
    });

    act(() => {
      useNavigationStore.getState().updateUserPosition(14.283510, -91.366510);
    });

    expect(useNavigationStore.getState().isArrivalModalVisible).toBe(false);
  });

  it('skips current tag for session only and recalculates next nearest', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
      useNavigationStore.getState().updateUserPosition(14.283500, -91.366500);
    });

    act(() => {
      useNavigationStore.getState().skipCurrentTag();
    });

    const state = useNavigationStore.getState();
    expect(state.skippedTagUuids).toContain('tag-004');
    expect(state.nearestTag?.unique_id).not.toBe('TAG-004');
    expect(state.isArrivalModalVisible).toBe(false);
  });

  it('clears skipped tags when navigation stops', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
      useNavigationStore.getState().skipCurrentTag();
      useNavigationStore.getState().stopNavigation();
    });

    expect(useNavigationStore.getState().skippedTagUuids).toEqual([]);
  });

  it('completeArrivalAction hides modal and recalculates', () => {
    act(() => {
      useNavigationStore.getState().startNavigation(mockTags);
      useNavigationStore.getState().updateUserPosition(14.283500, -91.366500);
    });

    act(() => {
      useNavigationStore.getState().completeArrivalAction();
    });

    const state = useNavigationStore.getState();
    expect(state.isArrivalModalVisible).toBe(false);
    expect(state.lastArrivalPromptedTagUuid).toBeNull();
  });

  it('returns null nearest when all remaining tags are skipped', () => {
    act(() => {
      useNavigationStore.getState().startNavigation([mockTags[0], mockTags[3]]);
      useNavigationStore.getState().updateUserPosition(14.283500, -91.366500);
    });

    act(() => {
      useNavigationStore.getState().skipCurrentTag(); // tag-004
      useNavigationStore.getState().skipCurrentTag(); // tag-001
    });

    expect(useNavigationStore.getState().nearestTag).toBeNull();
  });
});
