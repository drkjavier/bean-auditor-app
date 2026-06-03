import { refreshToken, introspectToken, shouldAttemptRefresh } from './authApi';
import { AUTH_USE_API } from './config';
import { getAttemptId, AUTH_DEBUG as CENTRAL_AUTH_DEBUG } from '../logging/authDebug';

// Dynamically pick token storage implementation so the web bundle doesn't
// accidentally import native-only modules (react-native-keychain).
// The native implementation exposes getSession/saveToken (session object),
// while the web implementation exposes getToken/saveToken (string token).
let tokenStorage: any = null;
try {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  tokenStorage = require('../security/tokenStorage.native');
} catch (e) {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  tokenStorage = require('../security/tokenStorage.web');
}

const hasGetSession = typeof tokenStorage.getSession === 'function';
const hasGetToken = typeof tokenStorage.getToken === 'function';

// Helper accessors that work for both storage shapes
async function _getSessionLike() {
  if (hasGetSession) return tokenStorage.getSession();
  if (hasGetToken) {
    const t = await tokenStorage.getToken();
    return t ? { accessToken: t } : null;
  }
  return null;
}

async function _saveSessionLike(session: any) {
  // native saveToken expects a session object; web saveToken expects an accessToken string
  try {
    if (hasGetSession) {
      return await tokenStorage.saveToken(session);
    }
    if (typeof tokenStorage.saveToken === 'function') {
      return await tokenStorage.saveToken(session.accessToken);
    }
  } catch (err) {
    // bubble up - callers may ignore refresh errors
    throw err;
  }
}

// Simple single-flight refresh guard
// Use centralized debug toggle
const AUTH_DEBUG = CENTRAL_AUTH_DEBUG;

// Simple single-flight refresh guard
let refreshingPromise: Promise<void> | null = null;

async function doRefreshIfNeeded(signal?: AbortSignal): Promise<void> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      if (AUTH_DEBUG) console.info('[auth] doRefreshIfNeeded: start');
      const session = await _getSessionLike();
      if (AUTH_DEBUG) console.info('[auth] current session', { hasSession: !!session, hasRefresh: !!(session && session.refreshToken), expiresAt: session?.expiresAt });

      // If there's no refreshToken available (common on web) skip refresh
      if (!session || !session.refreshToken) {
        if (AUTH_DEBUG) console.debug('[auth] doRefreshIfNeeded: skipping refresh (no refresh token)');
        return;
      }
      if (!shouldAttemptRefresh(session.expiresAt)) {
        if (AUTH_DEBUG) console.debug('[auth] doRefreshIfNeeded: skipping refresh (not within window)');
        return;
      }

      // forward optional signal to refresh APIs so refresh can be cancelled
      const resp = await refreshToken(session.refreshToken, signal ? { signal } : undefined);
      const newSession = {
        accessToken: resp.access_token,
        refreshToken: resp.refresh_token || session.refreshToken,
        expiresAt: resp.expires_at || Date.now() + 1000 * 60 * 60,
      };
      if (AUTH_DEBUG) console.info('[auth] doRefreshIfNeeded: refresh result', { expiresAt: newSession.expiresAt });
      await _saveSessionLike(newSession);
    } catch (err) {
      if (AUTH_DEBUG) console.warn('[auth] doRefreshIfNeeded: error', err);
      throw err;
    } finally {
      refreshingPromise = null;
      if (AUTH_DEBUG) console.info('[auth] doRefreshIfNeeded: finished');
    }
  })();

  return refreshingPromise;
}

import { createAndRegisterAbortController, registerAbortController, unregisterAbortController } from './abortManager';

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  // Prepare an AbortSignal to pass to refresh and the eventual fetch.
  // If the caller provided one, forward it; otherwise create and register a local one.
  let localCtrl: AbortController | null = null;
  const callerSignal = init?.signal as AbortSignal | undefined;
  if (!callerSignal) {
    // create and register
    // @ts-ignore
    const ctrl: any = createAndRegisterAbortController();
    localCtrl = ctrl as AbortController;
    registerAbortController(ctrl);
    init = { ...init, signal: (ctrl as any).signal };
  }

  try {
    // Ensure possible refresh before sending request, forwarding the signal so
    // refreshToken/introspect can be cancelled together with the main request.
    try {
      await doRefreshIfNeeded(init?.signal as AbortSignal | undefined);
    } catch (err) {
      // ignore refresh errors here; the request will likely fail and be handled by caller
    }
  } catch (e) {
    // noop
  }

  const session = await _getSessionLike();
  const headers = new Headers(init?.headers as any || {});
  if (session && session.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  // Propagate client attempt id to backend for easier correlation (no sensitive data)
  try {
    const attemptId = getAttemptId();
    if (attemptId) headers.set('X-Client-Log-Id', String(attemptId));
  } catch (e) {
    if (AUTH_DEBUG) console.warn('[auth] fetchWithAuth: failed to set X-Client-Log-Id', e);
  }

  try {
    // If auth API disabled, just send request without Authorization header
    const resp = await fetch(input, { ...init, headers });
    return resp;
  } finally {
    // cleanup registration for locally-created controller
    if (localCtrl) {
      try {
        unregisterAbortController(localCtrl);
      } catch (_) {}
    }
  }
}
