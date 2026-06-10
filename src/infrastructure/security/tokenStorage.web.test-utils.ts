// Test utilities for tokenStorage.web to allow setting in-memory token in tests only
import * as webStore from './tokenStorage.web';

export function __setTestTokenForWeb(token: string | null) {
  // @ts-ignore - use internal var (module scope)
  (webStore as any).__inMemoryToken = token;
}

export function __clearTestTokenForWeb() {
  // @ts-ignore
  (webStore as any).__inMemoryToken = null;
}

export default { __setTestTokenForWeb, __clearTestTokenForWeb };
