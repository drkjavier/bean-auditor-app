/**
 * NFC Data Layer — Barrel export
 *
 * Re-exports the platform-appropriate NFC service.
 * On native platforms, uses nfcService.native.ts.
 * On web, falls back to the no-op shim in nfcService.ts.
 */

export {
  initNfc,
  checkNfcCapability,
  readNfcTag,
  writeNfcTag,
  lockNfcTagWithPin,
  lockNfcTagPermanently,
  cancelNfcOperation,
  cleanupNfc,
} from './nfcService';