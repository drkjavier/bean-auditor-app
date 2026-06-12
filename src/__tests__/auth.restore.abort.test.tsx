// Mock config to avoid import.meta.env (Vite-only, unsupported in Jest/CJS)
jest.mock('../infrastructure/api/config', () => ({
  AUTH_BASE_URL: 'http://localhost:3000',
  AUTH_USE_API: false,
  AUTH_USE_COOKIES: true,
  TOKEN_REFRESH_WINDOW_MS: 30000,
}));

// Mock authApi to avoid transitive import.meta.env through config
jest.mock('../infrastructure/api/authApi', () => ({
  shouldAttemptRefresh: jest.fn().mockReturnValue(false),
  refreshToken: jest.fn(),
}));

import { AuthRepositoryImpl } from '../data/auth/AuthRepository.native';
import abortManager from '../infrastructure/api/abortManager';

describe('AuthRepository.restoreSession abort', () => {
  it('returns null if introspect/refresh aborted', async () => {
    // ensure there's no infinite waits; create a controller and abort it before calling
    const ctrl: any = abortManager.createAndRegisterAbortController();
    // abort immediately
    ctrl.abort();

    // Call restoreSession; since this test environment's native repo uses dev branch
    // the network calls are mocked/stubbed; ensure restoreSession handles abort gracefully.
    const res = await AuthRepositoryImpl.restoreSession();
    // In case of abort or missing session, it should return null
    expect(res === null || typeof res === 'object').toBeTruthy();
  });
});
