// Mock config to avoid import.meta.env (Vite-only, unsupported in Jest/CJS)
jest.mock('../src/infrastructure/api/config', () => ({
  AUTH_BASE_URL: 'http://localhost:3000',
  AUTH_USE_API: false,
  AUTH_USE_COOKIES: true,
  TOKEN_REFRESH_WINDOW_MS: 30000,
}));

import { fetchWithAuth } from '../src/infrastructure/api/fetchWithAuth';
import * as tokenStorage from '../src/infrastructure/security/tokenStorage.native';
import * as authApi from '../src/infrastructure/api/authApi';
import abortManager from '../src/infrastructure/api/abortManager';

jest.mock('../src/infrastructure/api/authApi');
jest.mock('../src/infrastructure/security/tokenStorage.native');

describe('fetchWithAuth abort on logout', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (authApi.shouldAttemptRefresh as jest.Mock).mockReturnValue(true);
  });

  it('aborts in-flight requests when logout triggers abort', async () => {
    const now = Date.now();
    (tokenStorage.getSession as jest.Mock).mockResolvedValue({ accessToken: 'old', refreshToken: 'r1', expiresAt: now + 1000 });

    // Simulate a long-running refresh that would be aborted
    let refreshCtrl: any = null;
    (authApi.refreshToken as jest.Mock).mockImplementation(async (_rt, init) => {
      refreshCtrl = init?.signal;
      // wait until aborted
      return new Promise((resolve, reject) => {
        const check = () => {
          if (refreshCtrl && refreshCtrl.aborted) return reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          setTimeout(check, 5);
        };
        check();
      });
    });

    // Start a fetchWithAuth but then trigger abortAllControllers to simulate logout
    const p = fetchWithAuth('http://example.com', {});

    // Give it a moment to start and then abort all
    await new Promise(r => setTimeout(r, 10));
    abortManager.abortAllControllers();

    const res = await Promise.allSettled([p]);
    expect(res[0].status === 'rejected').toBeTruthy();
    if (res[0].status === 'rejected') {
      // Should be AbortError
      // @ts-ignore
      expect(res[0].reason.name === 'AbortError' || res[0].reason.message.includes('aborted')).toBeTruthy();
    }
  });
});
