import { AuthRepository } from '../../domain/auth/AuthRepository';
import { AuthSession } from '../../domain/auth/AuthSession';
import { saveToken, getToken, clearToken } from '../../infrastructure/security/tokenStorage.web';
import { AUTH_DEBUG, getAttemptId, maskUsername } from '../../infrastructure/logging/authDebug';
import { AUTH_USE_COOKIES, AUTH_USE_API } from '../../infrastructure/api/config';
import * as authApi from '../../infrastructure/api/authApi';

const USER_KEY = 'bean_auditor_username';

// Dev bypass flag: AUTH_DEV_BYPASS=true allows admin/admin without API call
const AUTH_DEV_BYPASS =
  import.meta.env?.VITE_AUTH_DEV_BYPASS === 'true' ||
  (typeof process !== 'undefined' && (process as any).env?.AUTH_DEV_BYPASS === 'true') ||
  (typeof globalThis !== 'undefined' && (globalThis as any).__VITE_AUTH_DEV_BYPASS === 'true');

function isDevEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
}

export const AuthRepositoryImpl: AuthRepository = {
  signIn: async (username: string, password: string) => {
    const attemptId = getAttemptId();
    if (AUTH_DEBUG) console.debug('[auth][repo:web] signIn:start', { attemptId, username: maskUsername(username) });

    // DEV bypass: allows admin/admin without calling API (controlled by AUTH_DEV_BYPASS flag)
    if (isDevEnvironment() && AUTH_DEV_BYPASS) {
      if (username === 'admin' && password === 'admin') {
        const now = Date.now();
        const session: AuthSession = {
          username,
          accessToken: 'dev-token-web-123',
          refreshToken: 'dev-refresh-web-123',
          expiresAt: now + 1000 * 60 * 60,
          user: {
            id: 'usr_dev_001',
            username,
            email: 'admin@example.com',
            roles: ['admin', 'user'],
            tenant_id: 'tenant_dev_001',
          },
        };

        // Store username in localStorage (non-sensitive) for session restore
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(USER_KEY, username);
        } catch {
          // ignore in test env
        }

        // Store token using the web token storage
        try {
          if (!AUTH_USE_COOKIES) {
            await saveToken(session.accessToken);
          }
        } catch {
          await saveToken(session.accessToken);
        }

        if (AUTH_DEBUG) console.info('[auth][repo:web] signIn:dev-bypass-stored', { attemptId, username: maskUsername(username) });
        return session;
      }
      throw new Error('Credenciales inválidas');
    }

    // Production: call real API
    if (AUTH_USE_API) {
      try {
        const result = await authApi.login(username, password);
        const session: AuthSession = {
          username: result.user.username,
          accessToken: result.accessToken,
          expiresAt: result.expiresAt,
          user: result.user,
        };

        // Store username in localStorage (non-sensitive) for session restore
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(USER_KEY, session.username);
        } catch {
          // ignore in test env
        }

        // Store token securely
        if (!AUTH_USE_COOKIES) {
          await saveToken(session.accessToken);
        }

        if (AUTH_DEBUG) console.info('[auth][repo:web] signIn:api-success', { attemptId, username: maskUsername(session.username) });
        return session;
      } catch (err: any) {
        // Normalize error messages to avoid user enumeration
        if (err?.status === 401 || err?.status === 403) {
          throw new Error('Credenciales inválidas');
        }
        throw new Error(err?.message || 'Error de autenticación');
      }
    }

    // No API configured and no dev bypass
    throw new Error('Auth API no configurada. Configure AUTH_USE_API=true o AUTH_DEV_BYPASS=true');
  },
  restoreSession: async () => {
    try {
      // If using cookie-based sessions, prefer backend-provided session
      if (AUTH_USE_COOKIES) {
        const cookieSession = await authApi.getSessionFromCookie();
        if (!cookieSession || !cookieSession.access_token) return null;
        if (AUTH_DEBUG) console.debug('[auth][repo:web] restoreSession: cookie session found');
        return {
          username: cookieSession.username || 'unknown',
          accessToken: cookieSession.access_token,
          refreshToken: cookieSession.refresh_token,
          expiresAt: cookieSession.expires_at || Date.now() + 1000 * 60 * 30,
        } as AuthSession;
      }

      const username = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      if (!username) return null;
      const token = await getToken();
      if (!token) return null;
      if (AUTH_DEBUG) console.debug('[auth][repo:web] restoreSession: found', { username: maskUsername(username) });

      // Note: in production this should be replaced by cookie-based sessions or PKCE flows.
      return {
        username,
        accessToken: token,
        expiresAt: Date.now() + 1000 * 60 * 30,
      } as AuthSession;
    } catch (err) {
      console.warn('restoreSession (web) failed', err);
      return null;
    }
  },
  clearSession: async () => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(USER_KEY);
      await clearToken();
    } catch (err) {
      console.warn('clearSession (web) failed', err);
    }
  },
};

export default AuthRepositoryImpl;
