/**
 * Tests for domain/farm/navigationCamera — Waze-like zoom + follow throttle
 */

import {
  getNavigationZoom,
  getUserFollowZoom,
  shouldFollowUser,
  NAV_ZOOM_NEAR,
  NAV_ZOOM_FAR,
  NAV_ZOOM_USER_MAX,
  FOLLOW_MIN_INTERVAL_MS,
  FOLLOW_MIN_DISTANCE_METERS,
} from '../../../domain/farm/navigationCamera';

describe('getNavigationZoom', () => {
  it('returns near zoom when distance is under 50m', () => {
    expect(getNavigationZoom(20)).toBe(NAV_ZOOM_NEAR);
    expect(getNavigationZoom(49.9)).toBe(NAV_ZOOM_NEAR);
  });

  it('returns far zoom when distance is 50m or more', () => {
    expect(getNavigationZoom(50)).toBe(NAV_ZOOM_FAR);
    expect(getNavigationZoom(120)).toBe(NAV_ZOOM_FAR);
  });

  it('returns far zoom when distance is null or invalid', () => {
    expect(getNavigationZoom(null)).toBe(NAV_ZOOM_FAR);
    expect(getNavigationZoom(undefined)).toBe(NAV_ZOOM_FAR);
    expect(getNavigationZoom(Number.NaN)).toBe(NAV_ZOOM_FAR);
  });
});

describe('getUserFollowZoom', () => {
  it('returns max zoom by default', () => {
    expect(getUserFollowZoom()).toBe(NAV_ZOOM_USER_MAX);
  });

  it('uses provided map max zoom', () => {
    expect(getUserFollowZoom(20)).toBe(20);
  });

  it('falls back to default for invalid max zoom', () => {
    expect(getUserFollowZoom(0)).toBe(NAV_ZOOM_USER_MAX);
    expect(getUserFollowZoom(Number.NaN)).toBe(NAV_ZOOM_USER_MAX);
  });
});

describe('shouldFollowUser', () => {
  const base = {
    lastFollowAt: 1000,
    lastFollowPosition: { lat: 14.2833, lon: -91.3667 },
    currentPosition: { lat: 14.2833, lon: -91.3667 },
    now: 1500,
  };

  it('follows when never followed before', () => {
    expect(
      shouldFollowUser({
        ...base,
        lastFollowAt: null,
        lastFollowPosition: null,
      }),
    ).toBe(true);
  });

  it('does not follow when interval not elapsed and barely moved', () => {
    // 500ms later, same position
    expect(shouldFollowUser(base)).toBe(false);
  });

  it('follows when interval elapsed', () => {
    expect(
      shouldFollowUser({
        ...base,
        now: base.lastFollowAt + FOLLOW_MIN_INTERVAL_MS,
      }),
    ).toBe(true);
  });

  it('follows when user moved enough even before interval', () => {
    // ~0.001 deg lat ≈ 111m > 15m, only 500ms later
    expect(
      shouldFollowUser({
        ...base,
        currentPosition: { lat: 14.2843, lon: -91.3667 },
        now: base.lastFollowAt + 500,
      }),
    ).toBe(true);
  });

  it('respects custom thresholds', () => {
    expect(
      shouldFollowUser({
        ...base,
        now: base.lastFollowAt + 100,
        minIntervalMs: 50,
        minDistanceMeters: FOLLOW_MIN_DISTANCE_METERS,
      }),
    ).toBe(true);
  });
});
