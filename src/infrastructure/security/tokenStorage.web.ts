const KEY = 'bean_auditor_oauth_dev_token';

// Fallback for environments without sessionStorage (Jest/node)
let __inMemoryToken: string | null = null;
// Do not expose module internals globally to avoid accidental leakage in CI/logs.

const hasSessionStorage = typeof globalThis !== 'undefined' && typeof (globalThis as any).sessionStorage !== 'undefined';
const IS_PROD = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';
// Read config from central module when available; fallback to env for tests
let AUTH_USE_COOKIES = false;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const cfg = require('../api/config');
  AUTH_USE_COOKIES = !!cfg.AUTH_USE_COOKIES;
} catch (_) {
  AUTH_USE_COOKIES = typeof process !== 'undefined' && (process.env.AUTH_USE_COOKIES === 'true' || process.env.REACT_APP_AUTH_USE_COOKIES === 'true');
}

export async function saveToken(token: string): Promise<void> {
  try {
    if (IS_PROD && AUTH_USE_COOKIES) {
      // In production with cookies enabled, avoid storing token in JS-accessible storage.
      // Backend must set HttpOnly Secure cookie. Client should not persist tokens.
      if (typeof globalThis !== 'undefined' && !(globalThis as any).__beanAuditor_inMemoryTokenDisabled) {
        // eslint-disable-next-line no-console
        console.warn('saveToken: skipping web storage in production with AUTH_USE_COOKIES=true');
      }
      return;
    }

    if (hasSessionStorage) {
      (globalThis as any).sessionStorage.setItem(KEY, token);
      // eslint-disable-next-line no-console
      if (!IS_PROD) console.debug('[auth] tokenStorage.web: saved token (masked)');
    } else {
      // keep token in module-private var only
      __inMemoryToken = token;
      // eslint-disable-next-line no-console
      if (!IS_PROD) console.debug('[auth] tokenStorage.web: saved token to memory (masked)');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('saveToken (web) failed', err);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (IS_PROD && AUTH_USE_COOKIES) return null;
    if (hasSessionStorage) return (globalThis as any).sessionStorage.getItem(KEY);
    // Do not expose the in-memory token via global to avoid accidental leakage
    return __inMemoryToken;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('getToken (web) failed', err);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (IS_PROD && AUTH_USE_COOKIES) return;
    if (hasSessionStorage) (globalThis as any).sessionStorage.removeItem(KEY);
    __inMemoryToken = null;
    } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('clearToken (web) failed', err);
  }
}
