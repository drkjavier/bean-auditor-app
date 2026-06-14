import { create } from 'zustand';
import { AuthRepository } from '../domain/auth/AuthRepository';
import { AuthUser } from '../domain/auth/AuthSession';
import { AUTH_DEBUG, getAttemptId, maskUsername, sanitizeError } from '../infrastructure/logging/authDebug';
import abortManager from '../infrastructure/api/abortManager';
import { syncApi } from '../infrastructure/api/syncApi';
import { PullUseCase } from '../domain/sync/PullUseCase';
import { saveToken } from '../infrastructure/security/tokenStorage';

// Lazy-load platform-specific AuthRepository implementations to avoid runtime
// "require is not defined" errors in ESM/web environments. Call ensureAuthRepo()
// from async store actions before using authRepo.
let authRepo: AuthRepository | null = null;

async function ensureAuthRepo(): Promise<void> {
  if (authRepo) return;
  // Try native implementation first, then fallback to web. Use dynamic import
  // so bundlers can split chunks and avoid top-level require() in the browser.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('../data/auth/AuthRepository.native');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authRepo = (mod as any).AuthRepositoryImpl;
    return;
  } catch {
    // ignore
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('../data/auth/AuthRepository.web');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authRepo = (mod as any).AuthRepositoryImpl;
    return;
  } catch (e) {
    // If tests running, provide a minimal in-memory repo to avoid crashes
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testRepo: any = {
        signIn: async (username: string, password: string) => {
          if (username === 'admin' && password === 'admin') {
            const now = Date.now();
            return {
              username,
              accessToken: 'test-token',
              refreshToken: 'test-refresh',
              expiresAt: now + 1000 * 60 * 60,
              user: {
                id: 'usr_test_001',
                username,
                email: 'admin@example.com',
                roles: ['admin', 'user'],
                tenant_id: 'tenant_test_001',
              },
            };
          }
          throw new Error('Credenciales inválidas');
        },
        restoreSession: async () => null,
        clearSession: async () => {},
      };
      authRepo = testRepo;
      return;
    }

    // eslint-disable-next-line no-console
    console.warn('No AuthRepository implementation found at runtime', e);
    authRepo = null;
  }
}

// Dev bypass flag: controls whether admin/admin bypass is allowed
// Reads from Vite's import.meta.env (browser) and process.env (Node/test)
const AUTH_DEV_BYPASS =
  import.meta.env?.VITE_AUTH_DEV_BYPASS === 'true' ||
  (typeof process !== 'undefined' && (process as any).env?.AUTH_DEV_BYPASS === 'true') ||
  (typeof globalThis !== 'undefined' && (globalThis as any).__VITE_AUTH_DEV_BYPASS === 'true');

type AuthState = {
  username: string;
  isLoggedIn: boolean;
  isRestoring: boolean;
  isDevBypass?: boolean;
  error: string | null;
  /** Authenticated user profile (roles, tenant, email) */
  user: AuthUser | null;
  /** Access token from login (for API calls that need it explicitly) */
  accessToken: string | null;
  /** Whether initial pull has been completed */
  hasCompletedInitialPull: boolean;
  setUsername: (username: string) => void;
  login: (password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  /** Trigger initial pull after login */
  triggerInitialPull: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  username: '',
  isLoggedIn: false,
  isDevBypass: false,
  isRestoring: false,
  error: null,
  user: null,
  accessToken: null,
  hasCompletedInitialPull: false,
  setUsername: (username: string) => set({ username }),

  triggerInitialPull: async () => {
    const { hasCompletedInitialPull } = get();
    if (hasCompletedInitialPull) return;

    try {
      const pullUseCase = new PullUseCase(syncApi);
      await pullUseCase.execute({ forceFullSync: true });
      set({ hasCompletedInitialPull: true });
    } catch (err) {
      console.warn('[auth] Initial pull failed:', err);
      // Don't block login flow if pull fails
    }
  },
  login: async (password: string) => {
    const { username } = get();
    const usernameTrim = (username || '').trim();
    const passwordTrim = (password || '').trim();

    if (!usernameTrim || !passwordTrim) {
      throw new Error('Usuario y contraseña requeridos');
    }

    // Dev bypass: allowed only when AUTH_DEV_BYPASS=true
    if (AUTH_DEV_BYPASS && usernameTrim === 'admin' && passwordTrim === 'admin') {
      const attemptId = getAttemptId();
      if (AUTH_DEBUG) console.info('[auth] store.login:dev-bypass admin accepted', { attemptId, username: maskUsername(usernameTrim) });
      const devUser: AuthUser = {
        id: 'usr_dev_001',
        username: usernameTrim,
        email: 'admin@example.com',
        roles: ['admin', 'user'],
        tenant_id: 'tenant_dev_001',
      };
      const devToken = 'dev-token-web-123';
      set({ isLoggedIn: true, username: usernameTrim, isDevBypass: true, error: null, user: devUser, accessToken: devToken });
      // Persist dev token so SettingsScreen/SessionSection can access it
      try {
        await saveToken(devToken);
      } catch {
        // ignore storage errors in dev bypass
      }
      return;
    }

    await ensureAuthRepo();
    if (!authRepo) {
      if (AUTH_DEBUG) console.warn('[auth] store.login: AuthRepository no disponible');
      throw new Error('AuthRepository no disponible');
    }

    set({ error: null });

    const attemptId = getAttemptId();
    if (AUTH_DEBUG) console.debug('[auth] store.login:start', { attemptId, username: maskUsername(usernameTrim) });

    try {
      const session = await authRepo.signIn(usernameTrim, passwordTrim);
      // Validate session freshness
      if (session.expiresAt && session.expiresAt < Date.now()) {
        throw new Error('Sesión inválida');
      }
      // Store user data and token from API response
      set({
        isLoggedIn: true,
        username: session.username,
        user: session.user || null,
        accessToken: session.accessToken || null,
        isDevBypass: false,
      });
      if (AUTH_DEBUG) console.info('[auth] store.login:success', { attemptId, username: maskUsername(session.username), hasUser: !!session.user, expiresAt: session.expiresAt });
    } catch (err: any) {
      const message = err?.message || 'Error de autenticación';
      set({ error: message });
      if (AUTH_DEBUG) console.warn('[auth] store.login:error', { attemptId, username: maskUsername(usernameTrim), error: sanitizeError(err) });
      // Ensure we do not surface sensitive error details
      throw new Error(message);
    }
  },
  restoreSession: async () => {
    await ensureAuthRepo();
    if (!authRepo) return;
    set({ isRestoring: true, error: null });
    if (AUTH_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug('[auth] restoreSession: starting');
    }
    try {
      const session = await authRepo.restoreSession();
      if (AUTH_DEBUG) {
        // eslint-disable-next-line no-console
        console.debug('[auth] restoreSession: result', { sessionPresent: !!session, username: maskUsername(session?.username), expiresAt: session?.expiresAt });
      }
      if (session) {
        set({
          isLoggedIn: true,
          username: session.username,
          user: session.user || null,
        });
      } else {
        set({ isLoggedIn: false, username: '', user: null });
      }
    } catch (err: any) {
      // swallow but set a generic error
      set({ isLoggedIn: false, username: '', user: null, error: 'No fue posible restaurar sesión' });
      if (AUTH_DEBUG) {
        // eslint-disable-next-line no-console
        console.warn('[auth] restoreSession: error', sanitizeError(err));
      }
    } finally {
      set({ isRestoring: false });
      if (AUTH_DEBUG) {
        // eslint-disable-next-line no-console
        console.debug('[auth] restoreSession: finished');
      }
    }
  },
  logout: () => {
    // Clear client state synchronously so callers/tests observe immediate effect
    set({ isLoggedIn: false, username: '', user: null, accessToken: null });

    // Perform cleanup asynchronously (fire-and-forget)
    if (authRepo) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      authRepo.clearSession().catch(() => {
        // ignore cleanup errors
      });
    }
    // Abort any outstanding requests registered for the session
    try {
      if (abortManager && typeof abortManager.abortAllControllers === 'function') {
        // best-effort abort
        abortManager.abortAllControllers();
      }
    } catch {
      // noop — best-effort abort
    }
  },
}));

export default useAuthStore;
