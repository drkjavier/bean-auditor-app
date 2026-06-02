import * as Keychain from 'react-native-keychain';

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
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
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
    const credentials = await Keychain.getGenericPassword({ service: SERVICE });
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
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('clearToken failed', err);
  }
}
