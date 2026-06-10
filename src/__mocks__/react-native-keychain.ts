// Minimal mock for react-native-keychain used in tests
let _token: string | null = null;

export async function setGenericPassword(username: string, password: string, options?: any) {
  _token = password;
  return true;
}

export async function getGenericPassword(options?: any) {
  if (!_token) return false as any;
  // Return masked value to avoid leaking tokens in snapshots/logs
  return { username: 'oauth', password: _token ? '<REDACTED>' : null } as any;
}

export async function resetGenericPassword(options?: any) {
  _token = null;
  return true;
}

// Test helper: set a mock token (not exported to production)
export function __setMockToken(token: string | null) {
  _token = token;
}

export default {
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  __setMockToken,
};
