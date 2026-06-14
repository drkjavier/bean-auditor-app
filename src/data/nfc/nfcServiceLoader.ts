/**
 * NFC Service Loader — Shared dynamic import for NFC service.
 *
 * Ensures both nfcStore and useNfc hook use the same module instance,
 * sharing internal state (_isInitialized, _lastScannedTag, etc.).
 *
 * On native platforms, resolves to nfcService.native.ts (real NFC).
 * On web, resolves to nfcService.ts (mock simulation).
 */

type NfcServiceModule = typeof import('../../data/nfc/nfcService');

let nfcService: NfcServiceModule | null = null;

/**
 * Get the NFC service module (lazy-loaded).
 * Uses dynamic import() for compatibility with both Vite (web) and Metro (native).
 * The module is cached after first load to ensure shared state.
 */
export async function getNfcService(): Promise<NfcServiceModule> {
  if (!nfcService) {
    nfcService = await import('../../data/nfc/nfcService');
  }
  return nfcService;
}