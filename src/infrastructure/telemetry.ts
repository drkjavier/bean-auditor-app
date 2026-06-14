// Lightweight telemetry helper for frontend events. Intentionally minimal to
// avoid shipping PII. Events should never include coordinates or other sensitive
// data. This module provides a single logEvent function which currently routes
// to console.debug in development and is a no-op in production. It can be
// extended to integrate with Sentry/analytics with filtering rules.

export function logEvent(eventName: string, payload?: Record<string, any>) {
  try {
    // avoid leaking PII: enforce deny-list on keys and truncate values
    const DENY_KEYS = ['password', 'pass', 'pwd', 'email', 'lat', 'lng', 'lon', 'latitude', 'longitude', 'coords', 'position', 'uuid', 'unique_id'];
    const safePayload: Record<string, any> = {};
    if (payload) {
      Object.keys(payload).forEach(k => {
        const lower = k.toLowerCase();
        if (DENY_KEYS.some(d => lower.includes(d))) return; // skip sensitive keys
        try {
          const v = payload[k];
          let str = typeof v === 'string' ? v : JSON.stringify(v);
          // truncate long strings
          if (str.length > 256) str = str.slice(0, 256) + '...';
          safePayload[k] = str;
        } catch {
          try { safePayload[k] = String(payload[k]).slice(0, 256); } catch { /* ignore */ }
        }
      });
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[telemetry]', eventName, safePayload);
    }
    // production: this is a no-op placeholder. Integrate actual backend with
    // care: do not send PII, apply sampling and rate limits.
    return true;
  } catch {
    return false;
  }
}

export default { logEvent };
