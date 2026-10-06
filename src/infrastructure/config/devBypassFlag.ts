/**
 * Native dev-build bypass flag.
 *
 * Sets globalThis.__VITE_AUTH_DEV_BYPASS so authStore/AuthRepository accept
 * the admin/admin dev login without calling the backend. Only active in
 * __DEV__ builds: release bundles replace __DEV__ with false and eliminate
 * this branch, so production never ships with the bypass enabled.
 *
 * Must be imported BEFORE the app tree (first import in index.js) because
 * authStore evaluates AUTH_DEV_BYPASS at module load.
 */

type GlobalWithBypass = typeof globalThis & { __VITE_AUTH_DEV_BYPASS?: string };

// eslint-disable-next-line no-undef
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  (globalThis as GlobalWithBypass).__VITE_AUTH_DEV_BYPASS = 'true';
}

export {};
