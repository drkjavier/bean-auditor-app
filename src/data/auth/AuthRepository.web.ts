import { AuthRepository } from '../../domain/auth/AuthRepository';
import { AuthSession } from '../../domain/auth/AuthSession';
import { saveToken, getToken, clearToken } from '../../infrastructure/security/tokenStorage.web';
import { AUTH_DEBUG, getAttemptId, maskUsername } from '../../infrastructure/logging/authDebug';

const USER_KEY = 'bean_auditor_username';

export const AuthRepositoryImpl: AuthRepository = {
  signIn: async (username: string, password: string) => {
    const attemptId = getAttemptId();
    if (AUTH_DEBUG) console.debug('[auth][repo:web] signIn:start', { attemptId, username: maskUsername(username) });
    // DEV-only stubbed authentication
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      if (username === 'admin' && password === 'admin') {
        const now = Date.now();
        const session: AuthSession = {
          username,
          accessToken: 'dev-token-web-123',
          refreshToken: 'dev-refresh-web-123',
          expiresAt: now + 1000 * 60 * 60,
        };

        // Store username in localStorage (non-sensitive) for web dev
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(USER_KEY, username);
        } catch (err) {
          // ignore in test env
        }

        // store token using the web token storage (in-memory/sessionStorage fallback)
        await saveToken(session.accessToken);
        if (AUTH_DEBUG) console.info('[auth][repo:web] signIn:stored', { attemptId, username: maskUsername(username) });
        return session;
      }
      throw new Error('Credenciales inválidas');
    }

    throw new Error('Not implemented');
  },
  restoreSession: async () => {
    try {
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
      // eslint-disable-next-line no-console
      console.warn('restoreSession (web) failed', err);
      return null;
    }
  },
  clearSession: async () => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(USER_KEY);
      await clearToken();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('clearSession (web) failed', err);
    }
  },
};

export default AuthRepositoryImpl;
