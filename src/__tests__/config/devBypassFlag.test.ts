/**
 * devBypassFlag tests — native dev builds activate the auth bypass global
 * so admin/admin login works without the backend.
 */

describe('devBypassFlag (native dev builds)', () => {
  it('sets globalThis.__VITE_AUTH_DEV_BYPASS when __DEV__ is true', () => {
    // Jest (RN preset) runs with __DEV__ = true, mirroring dev bundles
    jest.isolateModules(() => {
      jest.requireActual('../../infrastructure/config/devBypassFlag');
    });

    expect((globalThis as { __VITE_AUTH_DEV_BYPASS?: string }).__VITE_AUTH_DEV_BYPASS).toBe('true');
  });
});
