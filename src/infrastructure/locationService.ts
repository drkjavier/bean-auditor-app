import { Platform, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS, openSettings as rnOpenSettings } from 'react-native-permissions';
// Export a small facade so tests can more easily mock the entire module via jest.mock
export default {
  checkPermission,
  requestPermission,
  openSettings,
  getCurrentPosition,
  connectExternalReceiver,
  disconnectReceiver,
  onPosition,
  startNtripSession,
  stopNtripSession,
  getStatus,
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
    } catch (_) {}
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
