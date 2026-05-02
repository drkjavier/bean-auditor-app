import { Platform, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS, openSettings as rnOpenSettings } from 'react-native-permissions';
// Export a small facade so tests can more easily mock the entire module via jest.mock
export default {
  checkPermission,
  requestPermission,
  openSettings,
  getCurrentPosition,
  RESULTS,
};

export async function checkPermission(): Promise<string> {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }) as string;
  return check(permission);
}

export async function requestPermission(): Promise<string> {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }) as string;
  return request(permission);
}

export function openSettings(): Promise<void> {
  // prefer library helper, fallback to Linking
  try {
    if (typeof rnOpenSettings === 'function') return rnOpenSettings();
  } catch (_) {
    // ignore
  }
  return Linking.openSettings();
}

export function getCurrentPosition(success: (pos: any) => void, error?: (err: any) => void, opts?: any) {
  return Geolocation.getCurrentPosition(success, error, opts);
}

export { RESULTS };
