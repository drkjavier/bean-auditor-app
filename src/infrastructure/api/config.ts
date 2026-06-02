export const AUTH_BASE_URL =
  process.env.AUTH_BASE_URL || process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:3000';

export const AUTH_USE_API =
  (typeof process !== 'undefined' && (process.env.AUTH_USE_API === 'true' || process.env.REACT_APP_AUTH_USE_API === 'true')) || false;

// Token refresh window (ms): if token expires within this window, attempt refresh
export const TOKEN_REFRESH_WINDOW_MS = 30 * 1000; // 30 seconds
