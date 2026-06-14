/**
 * NFC Domain Types
 *
 * Core types for NFC operations in BeanAuditorApp.
 * These types are platform-agnostic and used across all layers.
 */

// ── NFC Operation States ─────────────────────────────────────────────────────

/** State machine for NFC operations */
export type NfcOperationState =
  | 'idle'
  | 'scanning'
  | 'processing'
  | 'success'
  | 'error';

// ── NFC Tag Data ─────────────────────────────────────────────────────────────

/** Raw data read from an NFC tag */
export type NfcTagData = {
  /** Tag UID (unique identifier) in hex format */
  uid: string;
  /** NFC technology types detected (e.g., 'Ndef', 'NfcA', 'NfcV') */
  techTypes: string[];
  /** NDEF records parsed from the tag, if any */
  ndefRecords: NdefRecord[];
  /** Whether the tag is writable */
  isWritable: boolean;
  /** Maximum NDEF message size in bytes */
  maxSize: number;
  /** Timestamp when the tag was read */
  readAt: number;
};

// ── NDEF Records ──────────────────────────────────────────────────────────────

/** NDEF record types supported by the app */
export type NdefRecord =
  | NdefTextRecord
  | NdefUriRecord
  | NdefMimeRecord;

export type NdefTextRecord = {
  type: 'text';
  /** ISO/IANA language code (e.g., 'es', 'en') */
  locale: string;
  /** Text payload */
  text: string;
};

export type NdefUriRecord = {
  type: 'uri';
  /** URI payload */
  uri: string;
};

export type NdefMimeRecord = {
  type: 'mime';
  /** MIME type (e.g., 'application/json') */
  mimeType: string;
  /** Raw payload as string */
  payload: string;
};

// ── NFC Write Payload ─────────────────────────────────────────────────────────

/** Data to write to an NFC tag */
export type NfcWritePayload = {
  /** Tag UUID from factory (immutable, read from hardware) */
  uuid: string;
  /** Color hex code */
  colorHex: string;
  /** Logical tag identifier in the system */
  tagId: string;
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lon: number;
};

// ── NFC Lock Operations ───────────────────────────────────────────────────────

/** Result of a lock operation */
export type NfcLockResult = {
  success: boolean;
  /** Human-readable message */
  message: string;
  /** Tag UID that was locked */
  uid: string;
};

// ── NFC Errors ────────────────────────────────────────────────────────────────

/** Known NFC error codes */
export type NfcErrorCode =
  | 'NOT_SUPPORTED'
  | 'NFC_DISABLED'
  | 'TAG_LOST'
  | 'CANCELLED'
  | 'TIMEOUT'
  | 'WRITE_FAILED'
  | 'LOCK_FAILED'
  | 'READ_FAILED'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN';

/** Structured NFC error */
export type NfcError = {
  code: NfcErrorCode;
  message: string;
  /** Original error from native layer, if available */
  nativeError?: unknown;
};

// ── NFC Capability Check ──────────────────────────────────────────────────────

/** Result of checking NFC capability on the device */
export type NfcCapability = {
  /** Whether the device supports NFC hardware */
  isSupported: boolean;
  /** Whether NFC is currently enabled */
  isEnabled: boolean;
  /** Platform-specific notes */
  platform: 'ios' | 'android' | 'web';
};

// ── NFC Phase ─────────────────────────────────────────────────────────────────

/** The current NFC operation phase the user is in */
export type NfcPhase =
  | 'read'
  | 'write'
  | 'lock_pin'
  | 'lock_permanent';

// ── NFC Tag Match Result ──────────────────────────────────────────────────────

/** Result of matching a scanned NFC tag against the local database */
export type NfcTagMatchResult =
  | { type: 'found'; tagId: string; uniqueId: string; colorHex: string; auditStatus: string }
  | { type: 'not_found'; uid: string }
  | { type: 'error'; message: string };