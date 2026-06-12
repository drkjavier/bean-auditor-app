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

jest.mock('../src/infrastructure/api/authApi');
jest.mock('../src/infrastructure/security/tokenStorage.native');

describe('fetchWithAuth refresh concurrency', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (authApi.shouldAttemptRefresh as jest.Mock).mockReturnValue(true);
  });

  it('does not use stale token when refresh occurs', async () => {
    const now = Date.now();
    (tokenStorage.getSession as jest.Mock).mockResolvedValue({ accessToken: 'old', refreshToken: 'r1', expiresAt: now + 1000 });
    // make refreshToken resolve after a tick with new token
    (authApi.refreshToken as jest.Mock).mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 10));
      return { access_token: 'new', refresh_token: 'r2', expires_at: now + 10000 };
    });
    (tokenStorage.saveToken as jest.Mock).mockResolvedValue(undefined);

    // Start two concurrent fetchWithAuth calls
    const p1 = fetchWithAuth('http://example.com', {});
    const p2 = fetchWithAuth('http://example.com', {});

    // Wait both
    await Promise.allSettled([p1, p2]);

    // Ensure saveToken called once with new token
    expect(tokenStorage.saveToken).toHaveBeenCalled();
    // Ensure refreshToken was called at most once
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
  });
});
