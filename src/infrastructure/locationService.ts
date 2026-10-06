import { Platform, Linking } from 'react-native';
// Use react-native-geolocation-service for improved reliability on Android.
// Keep the facade API stable so tests and callers don't need to change.
import Geolocation from 'react-native-geolocation-service';
// Note: consider migrating to 'react-native-geolocation-service' for better Android reliability.
import { check, request, PERMISSIONS, RESULTS, openSettings as rnOpenSettings } from 'react-native-permissions';

const isWeb = Platform.OS === 'web';

// Export a small facade so tests can more easily mock the entire module via jest.mock
export default {
  checkPermission,
  requestPermission,
  openSettings,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  connectExternalReceiver,
  disconnectReceiver,
  onPosition,
  startNtripSession,
  stopNtripSession,
  getStatus,
  RESULTS,
};

/**
 * Check location permission.
 * - Native: uses react-native-permissions
 * - Web: uses Navigator.geolocation API (always GRANTED if available)
 */
export async function checkPermission(): Promise<string> {
  if (isWeb) {
    // On web, the browser handles permissions via prompt
    // If geolocation is available, we consider it "granted"
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return RESULTS.GRANTED;
    }
    return RESULTS.UNAVAILABLE;
  }
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  }) as string;
  return check(permission);
}

/**
 * Request location permission.
 * - Native: uses react-native-permissions
 * - Web: uses browser Geolocation API (permission prompt is triggered by getCurrentPosition)
 */
export async function requestPermission(): Promise<string> {
  if (isWeb) {
    // On web, we need to call getCurrentPosition to trigger the browser permission prompt
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(RESULTS.UNAVAILABLE);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        () => resolve(RESULTS.GRANTED),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve(RESULTS.DENIED);
          } else {
            resolve(RESULTS.GRANTED); // Other errors (timeout, unavailable) - still allow navigation attempt
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
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
  } catch {
    // ignore — fallback to Linking
  }
  return Linking.openSettings();
}

/**
 * Get current position once.
 * - Native: uses react-native-geolocation-service
 * - Web: uses Navigator.geolocation
 */
export function getCurrentPosition(success: (pos: any) => void, error?: (err: any) => void, opts?: any) {
  if (isWeb) {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => success(pos),
        (err) => error?.(err),
        {
          // Web browsers have no GPS; high-accuracy requests often TIMEOUT on
          // desktop, so network-based fixes are the reliable default here.
          enableHighAccuracy: false,
          timeout: opts?.timeout ?? 15000,
          // Accept a recent cached fix to avoid cold-start timeouts.
          maximumAge: opts?.maximumAge ?? 10000,
        }
      );
    } else {
      error?.({ code: 2, message: 'Geolocation not available on this platform' });
    }
    return;
  }
  return Geolocation.getCurrentPosition(success, error, opts);
}

/**
 * Watch position changes continuously.
 * - Native: uses react-native-geolocation-service
 * - Web: uses Navigator.geolocation.watchPosition
 * @param success - Callback for position updates
 * @param error - Callback for errors
 * @param opts - Watch options (enableHighAccuracy, distanceFilter, interval, etc.)
 * @returns Watch ID for clearing the watch
 */
export function watchPosition(
  success: (pos: any) => void,
  error?: (err: any) => void,
  opts?: { enableHighAccuracy?: boolean; distanceFilter?: number; interval?: number; fastestInterval?: number; timeout?: number; maximumAge?: number }
): number {
  if (isWeb) {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return navigator.geolocation.watchPosition(
        (pos) => success(pos),
        (err) => error?.(err),
        {
          // Web browsers have no GPS; high-accuracy requests often TIMEOUT on
          // desktop, so network-based fixes are the reliable default here.
          enableHighAccuracy: false,
          timeout: opts?.timeout ?? 15000,
          // Accept a recent cached fix to avoid cold-start timeouts.
          maximumAge: opts?.maximumAge ?? 10000,
        }
      );
    }
    // Geolocation not available — return -1 to indicate failure
    error?.({ code: 2, message: 'Geolocation not available on this platform' });
    return -1;
  }
  return Geolocation.watchPosition(success, error, {
    enableHighAccuracy: opts?.enableHighAccuracy ?? true,
    distanceFilter: opts?.distanceFilter ?? 1,
    interval: opts?.interval ?? 1000,
    fastestInterval: opts?.fastestInterval ?? 500,
  });
}

/**
 * Clear a position watch.
 * - Native: uses react-native-geolocation-service
 * - Web: uses Navigator.geolocation.clearWatch
 * @param watchId - The watch ID to clear
 */
export function clearWatch(watchId: number): void {
  if (isWeb) {
    if (typeof navigator !== 'undefined' && navigator.geolocation && watchId >= 0) {
      navigator.geolocation.clearWatch(watchId);
    }
    return;
  }
  try {
    Geolocation.clearWatch(watchId);
  } catch {
    // noop — best-effort clearWatch
  }
}

export { RESULTS };

// --- RTK / external receiver stubs and position streaming ---
let watcherId: number | null = null;
let subscribers: Array<(pos: any) => void> = [];
let receiverConnected = false;
let rtkState: 'NO_FIX' | 'FLOAT' | 'FIX' = 'NO_FIX';

export async function connectExternalReceiver(opts?: { transport?: 'ble' | 'usb' | 'mock'; id?: string }) {
  // Stub: in real implementation this will init BLE/USB connection and NMEA stream
  receiverConnected = true;
  rtkState = 'NO_FIX';

  // start watching device GPS as a placeholder stream
  if (watcherId == null) {
    watcherId = Geolocation.watchPosition(
      pos => {
        const payload = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 999,
          timestamp: pos.timestamp ?? Date.now(),
          source: opts?.transport === 'mock' ? 'external-mock' : 'internal',
          raw: undefined,
        };
        // simulate RTK fix progression randomly in stub (for UI testing)
        if (Math.random() > 0.85) rtkState = 'FIX';
        if (Math.random() > 0.7 && Math.random() <= 0.85) rtkState = 'FLOAT';

        subscribers.forEach(s => s({ ...payload, solution: rtkState }));
      },
      err => {
        subscribers.forEach(s => s({ error: true, message: err?.message }));
      },
      { enableHighAccuracy: true, distanceFilter: 0, interval: 1000, fastestInterval: 500 },
    );
  }

  return Promise.resolve({ connected: true, id: opts?.id ?? 'mock-receiver' });
}

export async function disconnectReceiver() {
  receiverConnected = false;
  rtkState = 'NO_FIX';
  if (watcherId != null) {
    try {
      Geolocation.clearWatch(watcherId as number);
    } catch {
      // noop — best-effort clearWatch
    }
    watcherId = null;
  }
  return Promise.resolve();
}

export function onPosition(cb: (pos: any) => void) {
  subscribers.push(cb);
  return () => {
    subscribers = subscribers.filter(s => s !== cb);
  };
}

export async function startNtripSession(_props: { casterUrl: string; mount: string; token?: string }) {
  // Stub: real implementation should request ephemeral token from backend and connect
  // For now simulate by setting rtkState to FLOAT then later FIX
  rtkState = 'FLOAT';
  setTimeout(() => { rtkState = 'FIX'; }, 3000);
  return Promise.resolve({ started: true });
}

export async function stopNtripSession() {
  rtkState = 'NO_FIX';
  return Promise.resolve({ stopped: true });
}

export function getStatus() {
  return { receiverConnected, rtkState };
}
