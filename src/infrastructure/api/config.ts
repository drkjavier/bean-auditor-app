/**
 * API configuration for authentication.
 *
 * NOTE: All environment access is funneled through getEnv() so this module
 * works in every runtime:
 * - Native (Metro): process.env
 * - Web (Vite): globalThis.__VITE_ENV__, injected from import.meta.env in
 *   index.web.jsx at startup (keeps the import.meta token out of shared
 *   modules so Jest/CJS can parse them)
 * - Node/Jest: process.env
 */

// Helper to safely read env vars without crashing when process is undefined.
// Web builds expose VITE_* vars via globalThis.__VITE_ENV__ (see index.web.jsx).
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    const value = (process.env as Record<string, string | undefined>)[key];
    if (value !== undefined) {
      return value;
    }
  }
  const viteEnv = (globalThis as Record<string, unknown>).__VITE_ENV__;
  if (viteEnv && typeof viteEnv === 'object') {
    return (viteEnv as Record<string, string | undefined>)[key];
  }
  return undefined;
};

export const AUTH_BASE_URL =
  getEnv('AUTH_BASE_URL') ||
  getEnv('REACT_APP_AUTH_BASE_URL') ||
  getEnv('VITE_AUTH_BASE_URL') ||
  'http://localhost:3000';

export const AUTH_USE_API =
  (getEnv('AUTH_USE_API') === 'true' ||
    getEnv('REACT_APP_AUTH_USE_API') === 'true' ||
    getEnv('VITE_AUTH_USE_API') === 'true') ||
  false;

// Default to cookie-based sessions for web, allow env override
let _AUTH_USE_COOKIES = true;
const cookiesFromEnv =
  getEnv('AUTH_USE_COOKIES') ||
  getEnv('REACT_APP_AUTH_USE_COOKIES') ||
  getEnv('VITE_AUTH_USE_COOKIES');
if (cookiesFromEnv !== undefined) {
  _AUTH_USE_COOKIES = cookiesFromEnv === 'true';
}
export const AUTH_USE_COOKIES = _AUTH_USE_COOKIES;

// Token refresh window (ms): if token expires within this window, attempt refresh
export const TOKEN_REFRESH_WINDOW_MS = 30 * 1000; // 30 seconds

// ── Sync Configuration ─────────────────────────────────────────────────────

export const SYNC_BASE_URL =
  getEnv('SYNC_BASE_URL') ||
  getEnv('REACT_APP_SYNC_BASE_URL') ||
  getEnv('VITE_SYNC_BASE_URL') ||
  AUTH_BASE_URL; // Default to same as auth

export const SYNC_ENDPOINTS = {
  pull: '/api/sync/pull',
  push: '/api/sync/push',
  health: '/api/sync/health',
} as const;

export const SYNC_CONFIG = {
  /** Auto-sync interval in milliseconds (0 = disabled) */
  autoSyncInterval: 30_000, // 30 seconds

  /** Max retries per sync attempt */
  maxRetries: 3,

  /** Base delay between retries (ms) - increases exponentially */
  retryBaseDelay: 1000,

  /** Batch size for push (max records per request) */
  batchSize: 50,

  /** Timeout for pull requests (ms) */
  pullTimeout: 30_000,

  /** Timeout for push requests (ms) */
  pushTimeout: 30_000,

  /** Enable console logging */
  enableLogging: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
} as const;
