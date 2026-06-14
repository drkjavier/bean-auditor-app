/**
 * NFC Service — Native implementation
 *
 * Handles all NFC operations on native platforms (iOS/Android):
 * - Initialize and check NFC capability
 * - Read NFC tags (UID, NDEF records)
 * - Write NDEF messages to tags
 * - Lock tags with PIN
 * - Lock tags permanently (irreversible)
 *
 * IMPORTANT: This file uses .native.ts extension so it is only
 * bundled on native platforms. The web shim provides a no-op fallback.
 */

import { Platform } from 'react-native';
import NfcManager, { NfcTech, Ndef, NdefStatus } from 'react-native-nfc-manager';
import type { NdefRecord as NdefRecordType } from 'react-native-nfc-manager';
import type {
  NfcTagData,
  NdefRecord,
  NfcWritePayload,
  NfcLockResult,
  NfcErrorCode,
  NfcError,
  NfcCapability,
} from '../../domain/nfc/NfcTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────

function createNfcError(code: NfcErrorCode, message: string, nativeError?: unknown): NfcError {
  return { code, message, nativeError };
}

function classifyError(err: unknown): NfcError {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('cancelled') || msg.includes('CANCELLED')) {
    return createNfcError('CANCELLED', 'Operación cancelada por el usuario', err);
  }
  if (msg.includes('not supported') || msg.includes('NOT_SUPPORTED')) {
    return createNfcError('NOT_SUPPORTED', 'NFC no soportado en este dispositivo', err);
  }
  if (msg.includes('disabled') || msg.includes('NFC_DISABLED')) {
    return createNfcError('NFC_DISABLED', 'NFC está desactivado. Actívalo en Ajustes', err);
  }
  if (msg.includes('tag lost') || msg.includes('TAG_LOST')) {
    return createNfcError('TAG_LOST', 'Tag NFC perdido. Acerca el tag de nuevo', err);
  }
  if (msg.includes('timeout') || msg.includes('TIMEOUT')) {
    return createNfcError('TIMEOUT', 'Tiempo de espera agotado', err);
  }
  if (msg.includes('permission') || msg.includes('PERMISSION')) {
    return createNfcError('PERMISSION_DENIED', 'Permiso NFC denegado', err);
  }

  return createNfcError('UNKNOWN', `Error NFC: ${msg}`, err);
}

/**
 * Parse NDEF records from a raw tag into our domain type.
 */
function parseNdefRecords(tag: any): NdefRecord[] {
  const records: NdefRecord[] = [];

  if (!tag?.ndefMessage || !Array.isArray(tag.ndefMessage)) {
    return records;
  }

  for (const record of tag.ndefMessage) {
    try {
      const tnf = record.tnf;
      const payload = record.payload;

      if (tnf === Ndef.TNF_WELL_KNOWN) {
        const rtdType = record.type;

        // Text record — use Ndef.text.decodePayload for proper decoding
        if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
          try {
            const text = Ndef.text.decodePayload(new Uint8Array(payload));
            // Extract locale from the raw payload
            const statusByte = payload[0];
            const localeLength = statusByte & 0x3f;
            const locale = String.fromCharCode(...payload.slice(1, 1 + localeLength));
            records.push({ type: 'text', locale, text });
          } catch {
            // Fallback: manual decode
            const { text, locale } = parseTextPayload(payload);
            records.push({ type: 'text', locale, text });
          }
          continue;
        }

        // URI record — use Ndef.uri.decodePayload
        if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
          try {
            const uri = Ndef.uri.decodePayload(new Uint8Array(payload));
            records.push({ type: 'uri', uri });
          } catch {
            const uri = parseUriPayload(payload);
            records.push({ type: 'uri', uri });
          }
          continue;
        }
      }

      if (tnf === Ndef.TNF_MIME_MEDIA) {
        const mimeType = Ndef.util.bytesToString(
          typeof record.type === 'string' ? Ndef.util.stringToBytes(record.type) : record.type,
        );
        const payloadStr = Ndef.util.bytesToString(payload);
        records.push({ type: 'mime', mimeType, payload: payloadStr });
      }
    } catch {
      // Skip malformed records
    }
  }

  return records;
}

/**
 * Parse a text NDEF payload into text and locale (fallback).
 */
function parseTextPayload(payload: number[]): { text: string; locale: string } {
  if (!payload || payload.length === 0) {
    return { text: '', locale: '' };
  }

  const statusByte = payload[0];
  const languageCodeLength = statusByte & 0x3f;
  const isUtf8 = (statusByte & 0x80) === 0;

  const localeBytes = payload.slice(1, 1 + languageCodeLength);
  const textBytes = payload.slice(1 + languageCodeLength);

  const locale = String.fromCharCode(...localeBytes);
  const text = isUtf8
    ? Ndef.util.bytesToString(textBytes)
    : new TextDecoder('utf-16le').decode(new Uint8Array(textBytes));

  return { text, locale };
}

/**
 * Parse a URI NDEF payload (fallback).
 */
function parseUriPayload(payload: number[]): string {
  if (!payload || payload.length === 0) return '';

  const identifierCode = payload[0];
  const uriBody = Ndef.util.bytesToString(payload.slice(1));

  const prefixes = Ndef.RTD_URI_PROTOCOLS;
  const prefix = identifierCode < prefixes.length ? prefixes[identifierCode] : '';

  return prefix + uriBody;
}

// ── NFC Service ──────────────────────────────────────────────────────────────

let _isInitialized = false;

/**
 * Initialize NFC manager. Must be called before any NFC operation.
 * Returns true if NFC is available and started, false otherwise.
 */
export async function initNfc(): Promise<boolean> {
  if (_isInitialized) return true;

  try {
    const supported = await NfcManager.isSupported();
    if (!supported) {
      console.warn('[NfcService] NFC not supported on this device');
      return false;
    }

    await NfcManager.start();
    _isInitialized = true;
    return true;
  } catch (err) {
    console.error('[NfcService] Failed to initialize NFC:', err);
    return false;
  }
}

/**
 * Check NFC capability on the current device.
 */
export async function checkNfcCapability(): Promise<NfcCapability> {
  try {
    const isSupported = await NfcManager.isSupported();
    const isEnabled = isSupported ? await NfcManager.isEnabled() : false;

    return {
      isSupported,
      isEnabled,
      platform: Platform.OS as 'ios' | 'android',
    };
  } catch {
    return {
      isSupported: false,
      isEnabled: false,
      platform: Platform.OS as 'ios' | 'android',
    };
  }
}

/**
 * Read an NFC tag. Returns tag data including UID and NDEF records.
 * Throws NfcError on failure.
 */
export async function readNfcTag(): Promise<NfcTagData> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (!tag) {
      throw createNfcError('TAG_LOST', 'No se pudo leer el tag NFC');
    }

    const ndefRecords = parseNdefRecords(tag);

    // Check writability via NDEF status
    let isWritable = false;
    let maxSize = tag.maxSize ?? 0;
    try {
      const status = await NfcManager.ndefHandler.getNdefStatus();
      isWritable = status.status === NdefStatus.ReadWrite;
      maxSize = status.capacity ?? maxSize;
    } catch {
      // If we can't check status, assume not writable
      isWritable = false;
    }

    return {
      uid: tag.id ?? '',
      techTypes: tag.techTypes ?? [],
      ndefRecords,
      isWritable,
      maxSize,
      readAt: Date.now(),
    };
  } catch (err: any) {
    if (err?.code === 'CANCELLED' || (err instanceof Error && err.message?.includes('cancelled'))) {
      throw createNfcError('CANCELLED', 'Operación cancelada', err);
    }
    throw classifyError(err);
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Write NDEF data to an NFC tag.
 * The tag must be writable and have enough space.
 * Throws NfcError on failure.
 */
export async function writeNfcTag(payload: NfcWritePayload): Promise<void> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (!tag) {
      throw createNfcError('TAG_LOST', 'No se detectó el tag NFC');
    }

    // Check writability
    let isWritable = false;
    try {
      const status = await NfcManager.ndefHandler.getNdefStatus();
      isWritable = status.status === NdefStatus.ReadWrite;
    } catch {
      // Assume not writable if we can't check
    }

    if (!isWritable) {
      throw createNfcError('WRITE_FAILED', 'El tag NFC no es escribible');
    }

    // Build NDEF message with tag metadata
    const records = buildNdefMessage(payload);
    const bytes = Ndef.encodeMessage(records);

    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } catch (err: any) {
    if (err?.code === 'CANCELLED' || (err instanceof Error && err.message?.includes('cancelled'))) {
      throw createNfcError('CANCELLED', 'Operación cancelada', err);
    }
    throw classifyError(err);
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Lock an NFC tag with a PIN.
 * This makes the tag read-only until unlocked with the same PIN.
 * Throws NfcError on failure.
 */
export async function lockNfcTagWithPin(uid: string, pin: string): Promise<NfcLockResult> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (!tag) {
      throw createNfcError('TAG_LOST', 'No se detectó el tag NFC');
    }

    if (tag.id !== uid) {
      throw createNfcError('TAG_LOST', 'El tag escaneado no coincide con el esperado');
    }

    // Write NDEF with PIN record, then make read-only
    const pinRecord = Ndef.textRecord(`PIN:${pin}`);
    const bytes = Ndef.encodeMessage([pinRecord]);

    // On Android, use formatNdef with readOnly option for NdefFormatable tags
    if (Platform.OS === 'android' && tag.techTypes?.includes('NdefFormatable')) {
      await NfcManager.ndefFormatableHandlerAndroid.formatNdef(bytes, { readOnly: true });
    } else {
      // For already formatted NDEF tags, write then make read-only
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      await NfcManager.ndefHandler.makeReadOnly();
    }

    return {
      success: true,
      message: 'Tag bloqueado con PIN exitosamente',
      uid,
    };
  } catch (err: any) {
    if (err?.code === 'CANCELLED' || (err instanceof Error && err.message?.includes('cancelled'))) {
      throw createNfcError('CANCELLED', 'Operación cancelada', err);
    }
    throw classifyError(err);
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Permanently lock an NFC tag (irreversible).
 * After this operation, the tag can never be written again.
 * Requires explicit user confirmation before execution.
 * Throws NfcError on failure.
 */
export async function lockNfcTagPermanently(uid: string): Promise<NfcLockResult> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (!tag) {
      throw createNfcError('TAG_LOST', 'No se detectó el tag NFC');
    }

    if (tag.id !== uid) {
      throw createNfcError('TAG_LOST', 'El tag escaneado no coincide con el esperado');
    }

    // Make the tag permanently read-only
    if (Platform.OS === 'android' && tag.techTypes?.includes('NdefFormatable')) {
      await NfcManager.ndefFormatableHandlerAndroid.formatNdef([], { readOnly: true });
    } else {
      await NfcManager.ndefHandler.makeReadOnly();
    }

    return {
      success: true,
      message: 'Tag bloqueado permanentemente. Esta acción es irreversible.',
      uid,
    };
  } catch (err: any) {
    if (err?.code === 'CANCELLED' || (err instanceof Error && err.message?.includes('cancelled'))) {
      throw createNfcError('CANCELLED', 'Operación cancelada', err);
    }
    throw classifyError(err);
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // Best-effort cleanup
    }
  }
}

/**
 * Cancel any ongoing NFC operation.
 */
export async function cancelNfcOperation(): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Best-effort cancellation
  }
}

/**
 * Clean up NFC manager resources.
 */
export async function cleanupNfc(): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Best-effort cleanup
  }
  _isInitialized = false;
}

// ── NDEF Message Builder ─────────────────────────────────────────────────────

/**
 * Build an NDEF message from a write payload.
 * Creates a structured JSON record with tag metadata.
 */
function buildNdefMessage(payload: NfcWritePayload): NdefRecordType[] {
  // Primary record: JSON MIME type with all tag data
  const jsonData = JSON.stringify({
    uuid: payload.uuid,
    colorHex: payload.colorHex,
    tagId: payload.tagId,
    lat: payload.lat,
    lon: payload.lon,
  });

  const mimeRecord = Ndef.record(
    Ndef.TNF_MIME_MEDIA,
    'application/json',
    [],
    Ndef.util.stringToBytes(jsonData),
  );

  // Secondary record: Human-readable text with tag ID
  const textRecord = Ndef.textRecord(`TAG:${payload.tagId}`);

  return [mimeRecord, textRecord];
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
};