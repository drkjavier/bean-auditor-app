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

// Use centralized debug toggle
const AUTH_DEBUG = CENTRAL_AUTH_DEBUG;

// Coordinated single-flight refresh with per-caller abort race and global abort
let ongoingRefresh: { promise: Promise<void>; ctrl: AbortController } | null = null;

async function doRefreshIfNeeded(callerSignal?: AbortSignal): Promise<void> {
  // If there's an ongoing refresh, wait on it but allow the caller to abort locally
  if (!ongoingRefresh) {
    const ctrl = typeof globalThis !== 'undefined' && (globalThis as any).AbortController ? new (globalThis as any).AbortController() : new AbortController();
    const promise = (async () => {
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

        // forward refresh call; allow global ctrl to cancel the HTTP call
        const resp = await refreshToken(session.refreshToken, { signal: ctrl.signal });
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
        ongoingRefresh = null;
        if (AUTH_DEBUG) console.info('[auth] doRefreshIfNeeded: finished');
      }
    })();

    ongoingRefresh = { promise, ctrl };
    // register refresh controller so logout can abort the request
    try {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      const abortManager = require('./abortManager');
      if (abortManager && typeof abortManager.registerAbortController === 'function') abortManager.registerAbortController(ongoingRefresh.ctrl);
    } catch (_) {
      // ignore if abort manager not available
    }
  }

  // If caller provided a signal, allow it to reject this waiter early without cancelling the shared refresh
  if (callerSignal) {
    if (callerSignal.aborted) {
      const e: any = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    }
    return await Promise.race([
      ongoingRefresh.promise,
      new Promise((_res, rej) => callerSignal.addEventListener('abort', () => {
        const e: any = new Error('aborted');
        e.name = 'AbortError';
        rej(e);
      }, { once: true }))
    ] as any);
  }

  return ongoingRefresh.promise;
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
    // createAndRegisterAbortController already registers the controller, avoid double registration
    // registerAbortController(ctrl);
    init = { ...init, signal: (ctrl as any).signal };
  }

  try {
    // Ensure possible refresh before sending request, forwarding the signal so
    // refreshToken/introspect can be cancelled together with the main request.
    try {
      await doRefreshIfNeeded(init?.signal as AbortSignal | undefined);
    } catch (err) {
      // If refresh was explicitly aborted (e.g. logout), propagate AbortError
      if (err?.name === 'AbortError') throw err;
      // For other errors, don't silently continue with a possibly stale token.
      // We'll re-read session and only use a token if present.
      if (AUTH_DEBUG) console.warn('[auth] fetchWithAuth: refresh failed, continuing without refresh');
    }
  } catch (e) {
    // noop
  }

  // Re-read session AFTER refresh completes (or fails) to avoid race conditions
  const session = await _getSessionLike();
  const headers = new Headers(init?.headers as any || {});
  // If config indicates cookies-based auth on web, do not set Authorization header
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const cfg = require('./config');
    if (!cfg.AUTH_USE_COOKIES && session && session.accessToken) {
      headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
  } catch (_) {
    // fallback: set header only if token present
    if (session && session.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
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
    // If using cookie-based auth, ensure credentials included
    let fetchInit = { ...init, headers } as RequestInit;
    try {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      const cfg = require('./config');
      if (cfg.AUTH_USE_COOKIES) fetchInit = { ...fetchInit, credentials: (fetchInit.credentials as RequestCredentials) || 'include' };
    } catch (_) {}

    const resp = await fetch(input, fetchInit);
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
