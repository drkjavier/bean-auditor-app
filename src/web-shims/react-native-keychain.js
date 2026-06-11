// Minimal web shim for react-native-keychain
// Provides in-memory fallback so Vite doesn't fail on module resolution.
// Must be plain JavaScript (no TypeScript generics) for .js extension.

export const ACCESSIBLE = {
  WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
};

/** @type {Map<string, string>} */
const storage = new Map();

export async function setGenericPassword(_username, password, _options) {
  storage.set('generic_password', password);
  return true;
}

export async function getGenericPassword(_options) {
  const password = storage.get('generic_password');
  if (!password) return false;
  return { username: 'stored', password };
}

export async function resetGenericPassword(_options) {
  storage.delete('generic_password');
  return true;
}

export default { ACCESSIBLE, setGenericPassword, getGenericPassword, resetGenericPassword };
