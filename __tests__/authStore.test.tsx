import { useAuthStore } from '../src/stores/authStore';

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
