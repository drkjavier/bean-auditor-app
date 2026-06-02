const Keychain = {
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
  async setGenericPassword(username: string, password: string, options?: any) {
    // store in memory during tests
    (globalThis as any).__rn_keychain = { username, password, options };
    return true;
  },
  async getGenericPassword(options?: any) {
    const v = (globalThis as any).__rn_keychain;
    if (!v) return false;
    return { username: v.username, password: v.password };
  },
  async resetGenericPassword(options?: any) {
    (globalThis as any).__rn_keychain = null;
    return true;
  },
};

module.exports = Keychain;
