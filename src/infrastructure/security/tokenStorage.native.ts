let Keychain: any;
try {
  // require at runtime so web bundler doesn't fail when module absent
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  Keychain = require('react-native-keychain');
} catch (e) {
  // Provide a minimal in-memory fallback for web/dev so imports don't crash
  Keychain = {
    ACCESSIBLE: undefined,
    async setGenericPassword(_u: string, _p: string, _opts?: any) {
      // emulate storing in-memory so tests can function
      try {
        (globalThis as any).__rn_keychain_mock = _p;
        return true;
      } catch (_) {
        throw new Error('Keychain not available in this environment');
      }
    },
    async getGenericPassword(_opts?: any) {
      try {
        const p = (globalThis as any).__rn_keychain_mock;
        if (!p) return false;
        return { username: 'oauth', password: p };
      } catch (_) {
        return false;
      }
    },
    async resetGenericPassword() {
      try { (globalThis as any).__rn_keychain_mock = undefined; return true; } catch (_) { return false; }
    },
  };
}

const SERVICE = 'bean_auditor_oauth';

export type StoredSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

/**
 * Save a token or full session securely in Keychain/Keystore.
 * Accepts either a string (accessToken) or an object {accessToken, refreshToken, expiresAt}.
 */
export async function saveToken(tokenOrSession: string | StoredSession): Promise<void> {
  try {
    const payload: StoredSession = typeof tokenOrSession === 'string' ? { accessToken: tokenOrSession } : tokenOrSession;
    const serialized = JSON.stringify(payload);
    // store under fixed account 'oauth' to simplify retrieval
    await Keychain.setGenericPassword('oauth', serialized, {
      service: SERVICE,
      // Make keychain entry non-backup and device-only when possible
      // @ts-ignore: some RN Keychain versions expose accessible options
      accessible: Keychain.ACCESSIBLE?.WHEN_UNLOCKED_THIS_DEVICE_ONLY || Keychain.ACCESSIBLE, // defensive access
      // for Android ensure use of secure keystore if supported
      // (react-native-keychain may accept 'storage' or platform specific options depending on version)
      // @ts-ignore
      ...(process.env.ANDROID_USE_KEYSTORE === 'true' ? { storage: 'androidKeyStore' } : {}),
    });
    // safe debug: never log raw tokens; only indicate stored
    // eslint-disable-next-line no-console
    if (process.env && process.env.NODE_ENV !== 'production') console.debug('[auth] tokenStorage.native: saved session (masked)');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('saveToken failed', err);
    throw err;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session ? session.accessToken : null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('getToken failed', err);
    return null;
  }
}

export async function getSession(): Promise<StoredSession | null> {
  try {
    let credentials: any;
    try {
      credentials = await Keychain.getGenericPassword({ service: SERVICE });
    } catch (_) {
      // some RN Keychain versions require no options
      credentials = await Keychain.getGenericPassword();
    }
    if (!credentials || !credentials.password) return null;
    try {
      const parsed = JSON.parse(credentials.password) as StoredSession;
      return parsed;
    } catch (parseErr) {
      // If stored value is a raw token string (legacy), convert to object
      return { accessToken: credentials.password };
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('getSession failed', err);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    // Some versions of Keychain resetGenericPassword accept options, others do not
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
    } catch (_) {
      // fallback to calling without options
      await Keychain.resetGenericPassword();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('clearToken failed', err);
  }
}
