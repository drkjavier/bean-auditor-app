export const AUTH_BASE_URL =
  process.env.AUTH_BASE_URL || process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:3000';

export const AUTH_USE_API =
  (typeof process !== 'undefined' && (process.env.AUTH_USE_API === 'true' || process.env.REACT_APP_AUTH_USE_API === 'true')) || false;

// Default to cookie-based sessions for user request, but allow explicit env override.
// If an env var is provided, respect it; otherwise default to true for web user flows.
let _AUTH_USE_COOKIES = true;
if (typeof process !== 'undefined') {
  const hasExplicit = typeof process.env.AUTH_USE_COOKIES !== 'undefined' || typeof process.env.REACT_APP_AUTH_USE_COOKIES !== 'undefined';
  if (hasExplicit) {
    _AUTH_USE_COOKIES = (process.env.AUTH_USE_COOKIES === 'true' || process.env.REACT_APP_AUTH_USE_COOKIES === 'true');
  }
}
export const AUTH_USE_COOKIES = _AUTH_USE_COOKIES;

// Token refresh window (ms): if token expires within this window, attempt refresh
export const TOKEN_REFRESH_WINDOW_MS = 30 * 1000; // 30 seconds
