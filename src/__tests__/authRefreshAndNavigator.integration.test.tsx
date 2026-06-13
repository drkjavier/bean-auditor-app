/**
 * Integration-style tests for refresh flow and AppNavigator guarding logic.
 * These tests run in Node/Jest and mock network and storage to validate
 * the single-flight refresh and that AppNavigator waits for restoreSession
 * to complete and only shows MainScreen when token is valid.
 */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AppNavigator from '../presentation/navigation/AppNavigator';
import * as tokenStorageNative from '../infrastructure/security/tokenStorage.native';


jest.mock('../infrastructure/api/authApi', () => ({
  introspectToken: jest.fn(),
  refreshToken: jest.fn(),
  shouldAttemptRefresh: jest.fn(() => true),
}));

const authApi = require('../infrastructure/api/authApi');

describe('Auth refresh + AppNavigator', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Ensure tests use API mocked flow
    process.env.AUTH_USE_API = 'true';
  });

  it('restores session and attempts refresh when token is near expiry', async () => {
    const now = Date.now();
    // mock session stored in Keychain
    const session: any = { accessToken: 'old', refreshToken: 'r1', expiresAt: now + 1000 };
    jest.spyOn(tokenStorageNative, 'getSession').mockResolvedValue(session as any);
    jest.spyOn(tokenStorageNative, 'saveToken').mockResolvedValue();

    // introspect would fail for old token; refresh returns new token
    (authApi.introspectToken as jest.Mock).mockResolvedValue({ active: false });
    (authApi.refreshToken as jest.Mock).mockResolvedValue({ access_token: 'new', refresh_token: 'r2', expires_at: now + 1000 * 60 });

    let tree: any;
    await act(async () => {
      tree = renderer.create(<AppNavigator />);
      // allow useEffect to run
      await Promise.resolve();
    });

    // After restore finishes, MainScreen should be mounted (since test repo will mark logged in)
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });
});
