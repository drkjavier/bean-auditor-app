const KEY = 'bean_auditor_oauth_dev_token';

// Fallback for environments without sessionStorage (Jest/node)
let __inMemoryToken: string | null = null;
// expose ref for test helpers if needed
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__beanAuditor_inMemoryToken = __inMemoryToken;
} catch (_) {}

const hasSessionStorage = typeof globalThis !== 'undefined' && typeof (globalThis as any).sessionStorage !== 'undefined';
const IS_PROD = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';

export async function saveToken(token: string): Promise<void> {
  try {
    if (IS_PROD) {
      // In production, avoid storing token in JS-accessible storage. Prefer cookies/httpOnly.
      // Keep a no-op to avoid accidental persistence.
      // eslint-disable-next-line no-console
      console.warn('saveToken: skipping web storage in production');
      return;
    }

    if (hasSessionStorage) {
      (globalThis as any).sessionStorage.setItem(KEY, token);
      // eslint-disable-next-line no-console
      if (!IS_PROD) console.debug('[auth] tokenStorage.web: saved token (masked)');
    } else {
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
    if (IS_PROD) return null;
    if (hasSessionStorage) return (globalThis as any).sessionStorage.getItem(KEY);
    // keep the global ref in sync for tests that reference it
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__beanAuditor_inMemoryToken = __inMemoryToken;
    } catch (_) {}
    return __inMemoryToken;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('getToken (web) failed', err);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (IS_PROD) return;
    if (hasSessionStorage) (globalThis as any).sessionStorage.removeItem(KEY);
    __inMemoryToken = null;
    } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('clearToken (web) failed', err);
  }
}
