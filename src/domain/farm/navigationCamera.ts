/**
 * @module domain/farm/navigationCamera
 *
 * Pure helpers for Waze-like camera behavior during navigation.
 * No UI, no map SDK — only decisions about zoom and follow throttling.
 */

import type { GeoPosition } from './geoUtils';
import { distance } from './geoUtils';

/** Zoom applied when the user is close to the navigation target (< 50 m). */
export const NAV_ZOOM_NEAR = 18;

/** Zoom applied when the user is far from the target or distance is unknown. */
export const NAV_ZOOM_FAR = 16;

/**
 * Zoom used when the camera centers on the USER position.
 * Uses the map's maximum zoom (MapTiler maxZoom = 22) for field detail.
 */
export const NAV_ZOOM_USER_MAX = 22;

/** Distance (m) under which the camera zooms in near the target. */
export const NEAR_TARGET_METERS = 50;

/** Minimum time between camera follow updates. */
export const FOLLOW_MIN_INTERVAL_MS = 2000;

/** Minimum movement (m) that can trigger a follow update before the interval. */
export const FOLLOW_MIN_DISTANCE_METERS = 15;

/**
 * Returns the navigation zoom level based on distance to target.
 * < 50 m → 18; otherwise (or unknown) → 16.
 * Used when recentering on the destination tag.
 */
export function getNavigationZoom(distanceMeters: number | null | undefined): number {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return NAV_ZOOM_FAR;
  }
  return distanceMeters < NEAR_TARGET_METERS ? NAV_ZOOM_NEAR : NAV_ZOOM_FAR;
}

/**
 * Returns the zoom used when centering the camera on the user.
 * Always maximum zoom so the auditor sees ground detail while walking.
 */
export function getUserFollowZoom(maxZoom: number = NAV_ZOOM_USER_MAX): number {
  if (!Number.isFinite(maxZoom) || maxZoom <= 0) {
    return NAV_ZOOM_USER_MAX;
  }
  return maxZoom;
}

export type FollowDecisionInput = {
  /** Timestamp (ms) of the last camera follow, or null if never followed. */
  lastFollowAt: number | null;
  /** Position of the last camera follow, or null if never followed. */
  lastFollowPosition: GeoPosition | null;
  /** Current user position. */
  currentPosition: GeoPosition;
  /** Current time (ms). */
  now: number;
  minIntervalMs?: number;
  minDistanceMeters?: number;
};

/**
 * Decides whether the camera should follow the user now.
 * Follows when: never followed, OR interval elapsed, OR user moved enough.
 */
export function shouldFollowUser(input: FollowDecisionInput): boolean {
  const minIntervalMs = input.minIntervalMs ?? FOLLOW_MIN_INTERVAL_MS;
  const minDistanceMeters = input.minDistanceMeters ?? FOLLOW_MIN_DISTANCE_METERS;

  if (input.lastFollowAt == null || input.lastFollowPosition == null) {
    return true;
  }

  const intervalElapsed = input.now - input.lastFollowAt >= minIntervalMs;
  const movedMeters = distance(input.lastFollowPosition, input.currentPosition);
  const movedEnough = movedMeters >= minDistanceMeters;

  return intervalElapsed || movedEnough;
}
