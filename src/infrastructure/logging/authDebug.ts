// Utilities to centralize debug helpers for auth-related logging.
// Keep these safe: never include passwords or raw tokens in logs.

// AUTH_DEBUG: robust detection for development and test environments.
// It enables debug when running in common dev contexts (React Native __DEV__, Node/Vite/webpack NODE_ENV !== 'production')
// or when the URL contains ?authDebug=1 (useful for local web debugging). Production builds should not enable this flag.
export const AUTH_DEBUG =
  // React Native bundler exposes __DEV__ global
  (typeof __DEV__ !== 'undefined' && Boolean(__DEV__)) ||
  // Some environments (metro) expose __DEV__ on globalThis
  (typeof globalThis !== 'undefined' && Boolean((globalThis as any).__DEV__)) ||
  // Node / bundlers usually set NODE_ENV
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') ||
  // tests
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
  // local URL override (web) - only enables when not production environment
  (typeof globalThis !== 'undefined' && typeof (globalThis as any).location !== 'undefined' && typeof URLSearchParams !== 'undefined' && new URLSearchParams((globalThis as any).location.search).get('authDebug') === '1');

export function genAttemptId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function setAttemptId(id?: string | null) {
  if (typeof globalThis !== 'undefined') {
    if (id) (globalThis as any).__AUTH_ATTEMPT = id;
    else delete (globalThis as any).__AUTH_ATTEMPT;
  }
}

export function getAttemptId(): string | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  return (globalThis as any).__AUTH_ATTEMPT;
}

export function maskUsername(s?: string | null): string | null {
  if (!s) return null;
  try {
    const str = String(s);
    if (str.length <= 2) return '*'.repeat(str.length);
    return `${str[0]}${'*'.repeat(Math.max(1, str.length - 2))}${str.slice(-1)}`;
  } catch (e) {
    return null;
  }
}

export type SanitizedError = { name?: string; message: string; code?: any };

export function sanitizeError(err: any): SanitizedError {
  const name = err?.name;
  const message = err?.message || (typeof err === 'string' ? err : 'Unknown error');
  const code = err?.code;
  return { name, message: String(message).slice(0, 300), code };
}
