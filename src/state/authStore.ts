import { create } from 'zustand';
import { AuthRepository } from '../domain/auth/AuthRepository';
import { AUTH_DEBUG, getAttemptId, maskUsername, sanitizeError } from '../infrastructure/logging/authDebug';

// Import platform-specific repository implementations (bundlers will pick the right file)
let authRepo: AuthRepository | null = null;
try {
  // dynamic import so tests can mock if needed
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  authRepo = require('../data/auth/AuthRepository.native').AuthRepositoryImpl;
} catch (err) {
  try {
    // fallback to web implementation when .native is not present (e.g. web)
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    authRepo = require('../data/auth/AuthRepository.web').AuthRepositoryImpl;
  } catch (e) {
    // leave null, tests can inject behavior or require will be mocked
    // eslint-disable-next-line no-console
    console.warn('No AuthRepository implementation found at runtime', e);
  }
}

// Test fallback: simple in-memory repository to keep unit tests stable
if (!authRepo && process.env.NODE_ENV === 'test') {
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
        };
      }
      throw new Error('Credenciales inválidas');
    },
    restoreSession: async () => null,
    clearSession: async () => {},
  };
  authRepo = testRepo;
}

type AuthState = {
  username: string;
  isLoggedIn: boolean;
  isRestoring: boolean;
  error: string | null;
  setUsername: (username: string) => void;
  login: (password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  username: '',
  isLoggedIn: false,
  isRestoring: false,
  error: null,
  setUsername: (username: string) => set({ username }),
  login: async (password: string) => {
    const { username } = get();
    const usernameTrim = (username || '').trim();
    const passwordTrim = (password || '').trim();

    if (!usernameTrim || !passwordTrim) {
      throw new Error('Usuario y contraseña requeridos');
    }

    if (!authRepo) throw new Error('AuthRepository no disponible');

    set({ error: null });

    const attemptId = getAttemptId();
    if (AUTH_DEBUG) console.debug('[auth] store.login:start', { attemptId, username: maskUsername(usernameTrim) });

    try {
      const session = await authRepo.signIn(usernameTrim, passwordTrim);
      // Do NOT store token in global state. Only mark logged in and keep username.
      // Additionally, validate session freshness if expiresAt exists.
      if (session.expiresAt && session.expiresAt < Date.now()) {
        throw new Error('Sesión inválida');
      }
      set({ isLoggedIn: true, username: session.username });
      if (AUTH_DEBUG) console.info('[auth] store.login:success', { attemptId, username: maskUsername(session.username), hasRefresh: !!session.refreshToken, expiresAt: session.expiresAt });
    } catch (err: any) {
      const message = err?.message || 'Error de autenticación';
      set({ error: message });
      if (AUTH_DEBUG) console.warn('[auth] store.login:error', { attemptId, username: maskUsername(usernameTrim), error: sanitizeError(err) });
      // Ensure we do not surface sensitive error details
      throw new Error(message);
    }
  },
  restoreSession: async () => {
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
        // Optional: you may want to validate token server-side before marking logged in
        // but authRepo.restoreSession attempts introspect/refresh when possible.
        set({ isLoggedIn: true, username: session.username });
      } else {
        set({ isLoggedIn: false, username: '' });
      }
      } catch (err: any) {
        // swallow but set a generic error
        set({ isLoggedIn: false, username: '', error: 'No fue posible restaurar sesión' });
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
    set({ isLoggedIn: false, username: '' });

    // Perform cleanup asynchronously (fire-and-forget)
    if (authRepo) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      authRepo.clearSession().catch(() => {
        // ignore cleanup errors
      });
    }
  },
}));

export default useAuthStore;
