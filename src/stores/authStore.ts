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
    const usernameTrim = (username || '').trim().toLowerCase();
    const passwordTrim = (password || '').trim();

    // Basic presence checks with specific error messages
    const usernameEmpty = !usernameTrim;
    const passwordEmpty = !passwordTrim;

    if (usernameEmpty && passwordEmpty) {
      throw new Error('Usuario y contraseña incorrectos');
    }
    if (usernameEmpty) {
      throw new Error('Usuario incorrecto');
    }
    if (passwordEmpty) {
      throw new Error('Contraseña incorrecta');
    }

    // Simulate an async authentication request (replace with real API call)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simple hardcoded validation for now: username 'admin' and password 'admin'
    const usernameValid = usernameTrim === 'admin';
    const passwordValid = passwordTrim === 'admin';

    if (usernameValid && passwordValid) {
      // On success, update auth state (do NOT store password)
      set({ isLoggedIn: true });
      return;
    }

    // Specific messages depending on which field is invalid
    if (!usernameValid && !passwordValid) {
      throw new Error('Usuario y contraseña incorrectos');
    }
    if (!usernameValid) {
      throw new Error('Usuario incorrecto');
    }
    // else password invalid
    throw new Error('Contraseña incorrecta');
  },
  logout: () => set({ isLoggedIn: false, username: '' }),
}));
