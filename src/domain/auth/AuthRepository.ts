import { AuthSession } from './AuthSession';

export interface AuthRepository {
  signIn: (username: string, password: string) => Promise<AuthSession>;
  restoreSession: () => Promise<AuthSession | null>;
  clearSession: () => Promise<void>;
}
