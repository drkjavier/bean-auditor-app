/**
 * Expose Vite env vars to shared (Jest-safe) modules.
 *
 * config.ts, maptiler.config.ts and authStore read VITE_* values via
 * globalThis.__VITE_ENV__ instead of the import.meta token (which Jest/CJS
 * cannot parse). Those modules evaluate env reads at MODULE LOAD, so this
 * file MUST be the first import of index.web.jsx — otherwise the app tree
 * captures __VITE_ENV__ as undefined.
 */

type GlobalWithViteEnv = typeof globalThis & {
  __VITE_ENV__?: Record<string, string | boolean | undefined>;
};

(globalThis as GlobalWithViteEnv).__VITE_ENV__ = import.meta.env;

export {};
