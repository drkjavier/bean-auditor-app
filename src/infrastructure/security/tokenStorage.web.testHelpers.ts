/**
 * Helpers for tests when using tokenStorage.web implementation.
 * Allows tests to reset the in-memory fallback token and assert storage mode.
 */
let __inMemoryTokenRef: { value: string | null } | null = null;

export function __setInMemoryRef(ref: { value: string | null }) {
  __inMemoryTokenRef = ref;
}

export function resetInMemoryToken() {
  if (__inMemoryTokenRef) __inMemoryTokenRef.value = null;
}

export function isUsingSessionStorage() {
  return typeof globalThis !== 'undefined' && typeof (globalThis as any).sessionStorage !== 'undefined';
}
