import { AuthRepository } from '../../domain/auth/AuthRepository';
import { AuthSession } from '../../domain/auth/AuthSession';
import { saveToken, clearToken, getSession } from '../../infrastructure/security/tokenStorage.native';
import { refreshToken, introspectToken, shouldAttemptRefresh, login as apiLogin } from '../../infrastructure/api/authApi';
import { AUTH_USE_API } from '../../infrastructure/api/config';
import { createAndRegisterAbortController, unregisterAbortController } from '../../infrastructure/api/abortManager';
import { execute, queryRows } from '../sqlite/db.native';
import runMigrations from '../sqlite/migrations.native';
import { AUTH_DEBUG, getAttemptId, maskUsername } from '../../infrastructure/logging/authDebug';

async function ensure() {
  await runMigrations();
}

const TABLE = 'user_session';

// Dev bypass flag: AUTH_DEV_BYPASS=true allows admin/admin without API call
const AUTH_DEV_BYPASS =
  (typeof process !== 'undefined' && process.env?.AUTH_DEV_BYPASS === 'true') ||
  (typeof globalThis !== 'undefined' && (globalThis as any).__VITE_AUTH_DEV_BYPASS === 'true');

function isDevOrTest(): boolean {
  // __DEV__ is a React Native global, may not exist in web/Vite context
  // eslint-disable-next-line no-undef
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  return isDev || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');
}

export const AuthRepositoryImpl: AuthRepository = {
  signIn: async (username: string, password: string) => {
    await ensure();

    const attemptId = getAttemptId();
    if (AUTH_DEBUG) console.debug('[auth][repo:native] signIn:start', { attemptId, username: maskUsername(username) });

    // DEV bypass: allows admin/admin without calling API (controlled by AUTH_DEV_BYPASS flag)
    if (isDevOrTest() && AUTH_DEV_BYPASS) {
      if (username === 'admin' && password === 'admin') {
        const now = Date.now();
        const session: AuthSession = {
          username,
          accessToken: 'dev-token-123',
          refreshToken: 'dev-refresh-123',
          expiresAt: now + 1000 * 60 * 60,
          user: {
            id: 'usr_dev_001',
            username,
            email: 'admin@example.com',
            roles: ['admin', 'user'],
            tenant_id: 'tenant_dev_001',
          },
        };

        // Persist username in sqlite (non-sensitive)
        execute(`INSERT OR REPLACE INTO ${TABLE} (id, username, updated_at) VALUES (1, ?, ?);`, [username, now]);

        // Persist token securely (store full session object)
        await saveToken({ accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt });
        if (AUTH_DEBUG) console.info('[auth][repo:native] signIn:dev-bypass-stored', { attemptId, username: maskUsername(username) });

        return session;
      }

      throw new Error('Credenciales inválidas');
    }

    // Production: call real API
    if (AUTH_USE_API) {
      try {
        const result = await apiLogin(username, password);
        const now = Date.now();
        const session: AuthSession = {
          username: result.user.username,
          accessToken: result.accessToken,
          expiresAt: result.expiresAt,
          user: result.user,
        };

        // Persist username in sqlite (non-sensitive)
        execute(`INSERT OR REPLACE INTO ${TABLE} (id, username, updated_at) VALUES (1, ?, ?);`, [session.username, now]);

        // Persist token securely (store full session object)
        await saveToken({ accessToken: session.accessToken, refreshToken: session.refreshToken, expiresAt: session.expiresAt });

        if (AUTH_DEBUG) console.info('[auth][repo:native] signIn:api-success', { attemptId, username: maskUsername(session.username) });
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
      await ensure();
      const rows = queryRows(`SELECT username, updated_at FROM ${TABLE} WHERE id = 1;`);
      if (rows.length === 0) return null;
      const { username, updated_at } = rows[0] as any;
      const sessionObj = await getSession();
      if (!sessionObj || !sessionObj.accessToken) return null;
      if (AUTH_DEBUG) console.debug('[auth][repo:native] restoreSession: found', { username: maskUsername(String(username)), updated_at });

      // If expiresAt is present, validate it: if expired or near expiry, attempt introspect/refresh
      try {
        if (sessionObj.expiresAt && shouldAttemptRefresh(sessionObj.expiresAt)) {
          // attempt introspect first
            // create an abort controller for this restore attempt so it can be
            // cancelled if the app logs out while restoring session
            const ctrl: any = createAndRegisterAbortController();
            try {
              const intros = await introspectToken(sessionObj.accessToken, { signal: ctrl.signal });
              if (!intros.active && sessionObj.refreshToken) {
                const resp = await refreshToken(sessionObj.refreshToken, { signal: ctrl.signal });
                const newSession = {
                  accessToken: resp.access_token,
                  refreshToken: resp.refresh_token || sessionObj.refreshToken,
                  expiresAt: resp.expires_at || Date.now() + 1000 * 60 * 60,
                };
                await saveToken(newSession);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.assign(sessionObj, newSession as any);
              }
            } catch (e: any) {
              if (e && (e.name === 'AbortError' || e.message === 'Aborted')) {
                // aborted due to logout/unmount; treat as no session
                try { unregisterAbortController(ctrl); } catch (_) {}
                return null;
              }
              // refresh failed - proceed to return null (will require login)
              try { unregisterAbortController(ctrl); } catch (_) {}
              return null;
            } finally {
              try { unregisterAbortController(ctrl); } catch (_) {}
            }
        }
    } catch (insErr) {
      // ignore introspect errors and return null to force login
      console.warn('introspect/refresh failed during restoreSession', insErr);
        return null;
      }

      const session: AuthSession = {
        username: String(username),
        accessToken: sessionObj.accessToken,
        refreshToken: sessionObj.refreshToken,
        expiresAt: sessionObj.expiresAt || Date.now() + 1000 * 60 * 30,
      };
      return session;
    } catch (err) {
      console.warn('restoreSession (native) failed', err);
      return null;
    }
  },
  clearSession: async () => {
    try {
      await ensure();
      execute(`DELETE FROM ${TABLE} WHERE id = 1;`);
      await clearToken();
    } catch (err) {
      console.warn('clearSession (native) failed', err);
    }
  },
};

export default AuthRepositoryImpl;
