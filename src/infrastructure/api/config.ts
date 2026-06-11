/**
 * API configuration for authentication.
 *
 * NOTE: All access to process.env is guarded with typeof checks to ensure
 * this module works in Vite's ESM browser context where `process` is not
 * available by default. Use VITE_ prefixed vars via import.meta.env when
 * possible, and only fall back to process.env for compatibility.
 */

// Helper to safely read process.env without crashing when process is undefined
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return (process.env as Record<string, string | undefined>)[key];
  }
  return undefined;
};

export const AUTH_BASE_URL =
  getEnv('AUTH_BASE_URL') ||
  getEnv('REACT_APP_AUTH_BASE_URL') ||
  import.meta.env.VITE_AUTH_BASE_URL ||
  'http://localhost:3000';

export const AUTH_USE_API =
  (getEnv('AUTH_USE_API') === 'true' ||
    getEnv('REACT_APP_AUTH_USE_API') === 'true' ||
    import.meta.env.VITE_AUTH_USE_API === 'true') ||
  false;

// Default to cookie-based sessions for web, allow env override
let _AUTH_USE_COOKIES = true;
const cookiesFromEnv =
  getEnv('AUTH_USE_COOKIES') ||
  getEnv('REACT_APP_AUTH_USE_COOKIES') ||
  import.meta.env.VITE_AUTH_USE_COOKIES;
if (cookiesFromEnv !== undefined) {
  _AUTH_USE_COOKIES = cookiesFromEnv === 'true';
}
export const AUTH_USE_COOKIES = _AUTH_USE_COOKIES;

// Token refresh window (ms): if token expires within this window, attempt refresh
export const TOKEN_REFRESH_WINDOW_MS = 30 * 1000; // 30 seconds
