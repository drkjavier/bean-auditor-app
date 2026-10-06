// Mock the native AuthRepository so the login flow runs against an
// in-memory implementation. The real module pulls the auth API/config
// chain, which is not the subject of this unit test.
jest.mock('../src/data/auth/AuthRepository.native', () => ({
  AuthRepositoryImpl: {
    signIn: jest.fn(async (username: string, password: string) => {
      if (username === 'admin' && password === 'admin') {
        return {
          username,
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          expiresAt: Date.now() + 1000 * 60 * 60,
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
    }),
    restoreSession: jest.fn(async () => null),
    clearSession: jest.fn(async () => {}),
  },
}));

import { useAuthStore } from '../src/stores';

describe('authStore (unit)', () => {
  it('initial state and login/logout flow', async () => {
    const { username, isLoggedIn } = useAuthStore.getState();
    expect(username).toBe('');
    expect(isLoggedIn).toBe(false);

    // set username and attempt login with wrong password
    useAuthStore.getState().setUsername('admin');
    await expect(useAuthStore.getState().login('wrong')).rejects.toThrow();

    // correct password
    useAuthStore.getState().setUsername('admin');
    await expect(useAuthStore.getState().login('admin')).resolves.toBeUndefined();
    expect(useAuthStore.getState().isLoggedIn).toBe(true);

    // logout
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });
});
