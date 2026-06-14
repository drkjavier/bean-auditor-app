/**
 * NFC Service — Web mock implementation
 *
 * Simulates NFC operations on web platforms for development and testing.
 * This module mirrors the exact same API as nfcService.native.ts but
 * uses mock data and simulated delays to reproduce the real NFC workflow:
 *
 * - initNfc → reports NFC as available (simulated)
 * - readNfcTag → returns a mock tag after simulated scan delay
 * - writeNfcTag → simulates writing NDEF data after delay
 * - lockNfcTagWithPin → simulates PIN lock after delay
 * - lockNfcTagPermanently → simulates permanent lock after delay
 *
 * The mock tracks state (which tag was last scanned, whether it's been
 * written/locked) so the full 4-phase workflow can be tested end-to-end.
 *
 * IMPORTANT: On native platforms, nfcService.native.ts is used instead.
 * This file is only loaded on web via the .ts extension resolution.
 */

import type {
  NfcTagData,
  NfcWritePayload,
  NfcLockResult,
  NfcCapability,
  NdefRecord,
} from '../../domain/nfc/NfcTypes';
import { getMockNfcTagWithDbMatch, simulateScanLatency, simulateWriteLatency } from '../mocks/nfcMock';

// ── Internal State ────────────────────────────────────────────────────────────

let _isInitialized = false;
let _lastScannedTag: NfcTagData | null = null;
let _isTagLocked = false;
let _isTagPermanentlyLocked = false;
let _writtenPayload: NfcWritePayload | null = null;

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Initialize NFC (mock). Always succeeds on web.
 */
export async function initNfc(): Promise<boolean> {
  await simulateScanLatency();
  _isInitialized = true;
  return true;
}

/**
 * Check NFC capability (mock). Reports NFC as available on web.
 */
export async function checkNfcCapability(): Promise<NfcCapability> {
  return {
    isSupported: true,
    isEnabled: true,
    platform: 'web',
  };
}

/**
 * Read an NFC tag (mock). Simulates scanning delay and returns
 * a mock tag that always matches the local database, ensuring
 * a predictable and successful demo flow on web.
 * After a lock operation, the tag reflects the locked state.
 */
export async function readNfcTag(): Promise<NfcTagData> {
  if (!_isInitialized) {
    throw { code: 'NOT_SUPPORTED', message: 'NFC no inicializado' };
  }

  await simulateScanLatency();

  // Always return a tag that matches the local database for a reliable demo flow.
  // After a lock operation, the tag may no longer be writable.
  const mockTag = getMockNfcTagWithDbMatch();

  // Convert mock NDEF records to domain type
  const ndefRecords: NdefRecord[] = mockTag.ndefRecords.map(record => {
    if (record.type === 'text') {
      return { type: 'text' as const, locale: record.locale ?? 'es', text: record.text ?? '' };
    }
    if (record.type === 'uri') {
      return { type: 'uri' as const, uri: record.uri ?? '' };
    }
    return { type: 'mime' as const, mimeType: record.mimeType ?? 'application/json', payload: record.payload ?? '' };
  });

  const tagData: NfcTagData = {
    uid: mockTag.uid,
    techTypes: mockTag.techTypes,
    ndefRecords,
    isWritable: mockTag.isWritable && !_isTagPermanentlyLocked,
    maxSize: mockTag.maxSize,
    readAt: Date.now(),
  };

  // Track the scanned tag for subsequent operations
  _lastScannedTag = tagData;

  return tagData;
}

/**
 * Write NDEF data to an NFC tag (mock). Simulates writing delay.
 * The tag must have been scanned first (readNfcTag).
 * If the tag was previously locked, writing will fail.
 */
export async function writeNfcTag(payload: NfcWritePayload): Promise<void> {
  if (!_isInitialized) {
    throw { code: 'NOT_SUPPORTED', message: 'NFC no inicializado' };
  }

  if (!_lastScannedTag) {
    throw { code: 'TAG_LOST', message: 'No hay tag escaneado. Escanea un tag primero.' };
  }

  if (_isTagPermanentlyLocked) {
    throw { code: 'WRITE_FAILED', message: 'El tag está bloqueado permanentemente y no puede ser escrito.' };
  }

  if (!_lastScannedTag.isWritable) {
    throw { code: 'WRITE_FAILED', message: 'El tag NFC no es escribible' };
  }

  await simulateWriteLatency();

  // Simulate successful write — update the scanned tag's NDEF records
  const newRecords: NdefRecord[] = [
    {
      type: 'mime',
      mimeType: 'application/json',
      payload: JSON.stringify({
        uuid: payload.uuid,
        colorHex: payload.colorHex,
        tagId: payload.tagId,
        lat: payload.lat,
        lon: payload.lon,
      }),
    },
    {
      type: 'text',
      locale: 'es',
      text: `TAG:${payload.tagId}`,
    },
  ];

  _lastScannedTag = {
    ..._lastScannedTag,
    ndefRecords: newRecords,
    readAt: Date.now(),
  };

  _writtenPayload = payload;
}

/**
 * Lock an NFC tag with a PIN (mock). Simulates lock delay.
 * The tag must have been scanned first.
 * After locking, the tag becomes read-only (but can be unlocked with PIN
 * in a real scenario — the mock just marks it as locked).
 */
export async function lockNfcTagWithPin(uid: string, pin: string): Promise<NfcLockResult> {
  if (!_isInitialized) {
    throw { code: 'NOT_SUPPORTED', message: 'NFC no inicializado' };
  }

  if (!_lastScannedTag) {
    throw { code: 'TAG_LOST', message: 'No hay tag escaneado. Escanea un tag primero.' };
  }

  if (_lastScannedTag.uid !== uid) {
    throw { code: 'TAG_LOST', message: 'El tag escaneado no coincide con el esperado.' };
  }

  if (_isTagPermanentlyLocked) {
    throw { code: 'LOCK_FAILED', message: 'El tag ya está bloqueado permanentemente.' };
  }

  await simulateWriteLatency();

  // Mark as locked — in the mock, we just track state
  _isTagLocked = true;
  _lastScannedTag = {
    ..._lastScannedTag,
    isWritable: false,
    readAt: Date.now(),
  };

  return {
    success: true,
    message: `Tag bloqueado con PIN exitosamente (PIN: ${'*'.repeat(pin.length)})`,
    uid,
  };
}

/**
 * Permanently lock an NFC tag (mock). Simulates lock delay.
 * This is irreversible — after this, the tag cannot be written again.
 */
export async function lockNfcTagPermanently(uid: string): Promise<NfcLockResult> {
  if (!_isInitialized) {
    throw { code: 'NOT_SUPPORTED', message: 'NFC no inicializado' };
  }

  if (!_lastScannedTag) {
    throw { code: 'TAG_LOST', message: 'No hay tag escaneado. Escanea un tag primero.' };
  }

  if (_lastScannedTag.uid !== uid) {
    throw { code: 'TAG_LOST', message: 'El tag escaneado no coincide con el esperado.' };
  }

  if (_isTagPermanentlyLocked) {
    throw { code: 'LOCK_FAILED', message: 'El tag ya está bloqueado permanentemente.' };
  }

  await simulateWriteLatency();

  // Mark as permanently locked — irreversible
  _isTagPermanentlyLocked = true;
  _isTagLocked = true;
  _lastScannedTag = {
    ..._lastScannedTag,
    isWritable: false,
    readAt: Date.now(),
  };

  return {
    success: true,
    message: 'Tag bloqueado permanentemente. Esta acción es irreversible.',
    uid,
  };
}

/**
 * Cancel any ongoing NFC operation (mock). No-op on web.
 */
export async function cancelNfcOperation(): Promise<void> {
  // No-op in mock — operations complete immediately after delay
}

/**
 * Clean up NFC resources (mock). Resets internal state.
 */
export async function cleanupNfc(): Promise<void> {
  _isInitialized = false;
  _lastScannedTag = null;
  _isTagLocked = false;
  _isTagPermanentlyLocked = false;
  _writtenPayload = null;
}

/**
 * Reset the mock state (useful for testing).
 * This allows re-scanning tags after a lock operation.
 */
export function resetMockState(): void {
  _lastScannedTag = null;
  _isTagLocked = false;
  _isTagPermanentlyLocked = false;
  _writtenPayload = null;
}

/**
 * Get the current mock state (useful for testing/debugging).
 */
export function getMockState(): {
  isInitialized: boolean;
  lastScannedTag: NfcTagData | null;
  isTagLocked: boolean;
  isTagPermanentlyLocked: boolean;
  writtenPayload: NfcWritePayload | null;
} {
  return {
    isInitialized: _isInitialized,
    lastScannedTag: _lastScannedTag,
    isTagLocked: _isTagLocked,
    isTagPermanentlyLocked: _isTagPermanentlyLocked,
    writtenPayload: _writtenPayload,
  };
}

export default {
  initNfc,
  checkNfcCapability,
  readNfcTag,
  writeNfcTag,
  lockNfcTagWithPin,
  lockNfcTagPermanently,
  cancelNfcOperation,
  cleanupNfc,
  resetMockState,
  getMockState,
};