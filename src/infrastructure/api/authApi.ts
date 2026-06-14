import { AUTH_BASE_URL, TOKEN_REFRESH_WINDOW_MS, AUTH_USE_API } from './config';

// ── Types ─────────────────────────────────────────────────────────────────

/** User data returned by POST /api/v1/auth/login */
type LoginUserResponse = {
  id: string;
  username: string;
  email: string;
  roles: string[];
  tenant_id: string;
};

/** Raw response from POST /api/v1/auth/login */
type LoginApiResponse = {
  token: string;
  expires_at: string; // ISO 8601
  user: LoginUserResponse;
};

/** Normalized login result used by repositories */
export type LoginResult = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  user: LoginUserResponse;
};

type RefreshResponse = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // epoch ms
};

type IntrospectResponse = {
  active: boolean;
  exp?: number; // epoch seconds
  [key: string]: any;
};

async function fetchJson(input: string, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`HTTP ${res.status} ${res.statusText} ${body}`);
    // @ts-ignore
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Authenticate user against POST /api/v1/auth/login
 *
 * Request:
 *   { username: string, password: string }
 *
 * Response:
 *   { token: string, expires_at: string (ISO), user: { id, username, email, roles, tenant_id } }
 *
 * The ISO expires_at string is converted to epoch milliseconds for internal use.
 * The token field is mapped to accessToken.
 *
 * @throws {Error} On network error or invalid credentials (HTTP 401/403)
 */
export async function login(
  username: string,
  password: string,
  init?: RequestInit
): Promise<LoginResult> {
  if (!AUTH_USE_API) throw new Error('Auth API disabled');

  const url = `${AUTH_BASE_URL}/api/v1/auth/login`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: LoginApiResponse = (await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    ...(init || {}),
  })) as any;

  // Convert ISO expires_at to epoch ms
  const expiresAt = new Date(body.expires_at).getTime();

  // Validate conversion
  if (Number.isNaN(expiresAt)) {
    throw new Error('Invalid expires_at format from auth API');
  }

  return {
    accessToken: body.token,
    expiresAt,
    user: body.user,
  };
}

export async function refreshToken(token: string, init?: RequestInit): Promise<RefreshResponse> {
  if (!AUTH_USE_API) throw new Error('Auth API disabled');
  const url = `${AUTH_BASE_URL}/auth/refresh`;
  return fetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
      ...(init || {}),
    }
  ) as Promise<RefreshResponse>;
}

export async function introspectToken(token: string, init?: RequestInit): Promise<IntrospectResponse> {
  if (!AUTH_USE_API) throw new Error('Auth API disabled');
  const url = `${AUTH_BASE_URL}/auth/introspect`;
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    ...(init || {}),
  }) as Promise<IntrospectResponse>;
}

// When using cookie-based sessions on web, ask backend for current session using credentials
export async function getSessionFromCookie(init?: RequestInit): Promise<{ username?: string; access_token?: string; refresh_token?: string; expires_at?: number } | null> {
  if (!AUTH_USE_API) throw new Error('Auth API disabled');
  const url = `${AUTH_BASE_URL}/auth/session`;
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'include', ...(init || {}) });
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    // network or other issue - return null to indicate no session
    return null;
  }
}

export function shouldAttemptRefresh(expiresAt?: number | null): boolean {
  if (!expiresAt) return false;
  // refresh if within the refresh window
  return expiresAt - Date.now() <= TOKEN_REFRESH_WINDOW_MS;
}
