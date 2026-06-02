import { create } from 'zustand';

type AuthState = {
  username: string;
  isLoggedIn: boolean;
  setUsername: (username: string) => void;
  login: (password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  username: '',
  isLoggedIn: false,
  setUsername: (username: string) => set({ username }),
  login: async (password: string) => {
    const { username } = get();
    // Normalize inputs
    const usernameTrim = (username || '').trim();
    const passwordTrim = (password || '').trim();

    // Presence checks are allowed to be specific (client-side validation)
    if (!usernameTrim || !passwordTrim) {
      throw new Error('Usuario y contraseña requeridos');
    }

    // Simulate an async authentication request (replace with real API call)
    await new Promise(resolve => setTimeout(resolve, 300));

    // DEV-only stubbed check. Do not rely on this in production.
    // Keep this guarded so production builds won't accidentally use hardcoded creds.
    if (__DEV__) {
      const ok = usernameTrim === 'admin' && passwordTrim === 'admin';
      if (ok) {
        set({ isLoggedIn: true });
        return;
      }
      // Generic auth failure message to avoid user-enumeration
      throw new Error('Credenciales inválidas');
    }

    // In production, the client should call a backend endpoint. For now, always fail.
    throw new Error('Credenciales inválidas');
  },
  logout: () => set({ isLoggedIn: false, username: '' }),
}));
