import { AUTH_BASE_URL, TOKEN_REFRESH_WINDOW_MS, AUTH_USE_API } from './config';

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

export async function refreshToken(refreshToken: string, init?: RequestInit): Promise<RefreshResponse> {
  if (!AUTH_USE_API) throw new Error('Auth API disabled');
  const url = `${AUTH_BASE_URL}/auth/refresh`;
  return fetchJson(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
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
  } catch (err) {
    // network or other issue - return null to indicate no session
    return null;
  }
}

export function shouldAttemptRefresh(expiresAt?: number | null): boolean {
  if (!expiresAt) return false;
  // refresh if within the refresh window
  return expiresAt - Date.now() <= TOKEN_REFRESH_WINDOW_MS;
}
