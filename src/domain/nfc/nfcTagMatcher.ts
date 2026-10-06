/**
 * @module domain/nfc/nfcTagMatcher
 *
 * Pure helpers to extract tag identity from NFC NDEF data and match it
 * against a destination tag used by the Waze-like navigation flow.
 */

import type { NfcTagData } from './NfcTypes';

/** Identity extracted from a scanned NFC tag. */
export type NfcTagIdentity = {
  /** Physical/system UUID when available (from NDEF JSON or UID). */
  uuid: string | null;
  /** Logical tag id (unique_id / TAG:{id} text record). */
  uniqueId: string | null;
};

/** Destination tag shape required for matching (avoids data-layer imports). */
export type NfcMatchDestination = {
  uuid: string;
  unique_id: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extract uuid / unique_id from NDEF records and hardware UID.
 */
export function extractNfcTagIdentity(tagData: NfcTagData): NfcTagIdentity {
  let uuid: string | null = null;
  let uniqueId: string | null = null;

  for (const record of tagData.ndefRecords) {
    if (record.type === 'mime' && record.mimeType === 'application/json') {
      try {
        const parsed = JSON.parse(record.payload) as {
          uuid?: string;
          uniqueId?: string;
          tagId?: string;
        };
        if (parsed.uuid) uuid = String(parsed.uuid);
        if (parsed.uniqueId) uniqueId = String(parsed.uniqueId);
        else if (parsed.tagId) uniqueId = String(parsed.tagId);
      } catch {
        // ignore malformed JSON payloads
      }
    }

    if (record.type === 'text' && record.text?.startsWith('TAG:')) {
      uniqueId = record.text.slice(4);
    }
  }

  if (!uuid && tagData.uid && UUID_REGEX.test(tagData.uid)) {
    uuid = tagData.uid;
  }

  return { uuid, uniqueId };
}

/**
 * Returns true when the scanned NFC identity matches the destination tag.
 * Match succeeds on UUID or logical unique_id.
 */
export function doesNfcTagMatchDestination(
  identity: NfcTagIdentity,
  destination: NfcMatchDestination,
): boolean {
  if (identity.uuid && identity.uuid === destination.uuid) {
    return true;
  }
  if (identity.uniqueId && identity.uniqueId === destination.unique_id) {
    return true;
  }
  return false;
}
