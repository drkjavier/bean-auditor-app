/**
 * NFC Mock Data — Simulated NFC tags for web development
 *
 * Provides realistic mock data that mirrors what the native NFC
 * service would return, enabling full UI testing on web.
 *
 * Tags are based on the existing tagsMock database so that
 * scanned tags can be matched against the local database.
 */

import { TAG_COLORS } from '../../domain/constants/tagColors';

// ── Mock NFC Tags ─────────────────────────────────────────────────────────────

export type MockNfcTag = {
  uid: string;
  techTypes: string[];
  ndefRecords: Array<{
    type: 'text' | 'uri' | 'mime';
    locale?: string;
    text?: string;
    uri?: string;
    mimeType?: string;
    payload?: string;
  }>;
  isWritable: boolean;
  maxSize: number;
};

/**
 * Pre-defined mock NFC tags that correspond to entries in tagsMock.
 * When scanned, the UID matches a tag in the local database.
 */
export const MOCK_NFC_TAGS: MockNfcTag[] = [
  {
    uid: '550e8400-e29b-41d4-a716-000000000001',
    techTypes: ['Ndef', 'NfcA'],
    ndefRecords: [
      {
        type: 'mime',
        mimeType: 'application/json',
        payload: JSON.stringify({
          uuid: '550e8400-e29b-41d4-a716-000000000001',
          colorHex: TAG_COLORS[0].hex,
          uniqueId: 'TAG-TIQ-001',
          lat: 14.2833,
          lon: -91.3667,
        }),
      },
      {
        type: 'text',
        locale: 'es',
        text: 'TAG:TAG-TIQ-001',
      },
    ],
    isWritable: true,
    maxSize: 888,
  },
  {
    uid: '550e8400-e29b-41d4-a716-000000000002',
    techTypes: ['Ndef', 'NfcA'],
    ndefRecords: [
      {
        type: 'mime',
        mimeType: 'application/json',
        payload: JSON.stringify({
          uuid: '550e8400-e29b-41d4-a716-000000000002',
          colorHex: TAG_COLORS[1].hex,
          uniqueId: 'TAG-TIQ-002',
          lat: 14.2834,
          lon: -91.3666,
        }),
      },
      {
        type: 'text',
        locale: 'es',
        text: 'TAG:TAG-TIQ-002',
      },
    ],
    isWritable: true,
    maxSize: 888,
  },
  {
    uid: '550e8400-e29b-41d4-a716-000000000003',
    techTypes: ['Ndef', 'NfcA'],
    ndefRecords: [
      {
        type: 'text',
        locale: 'es',
        text: 'TAG:TAG-TIQ-003',
      },
    ],
    isWritable: true,
    maxSize: 512,
  },
  {
    uid: '04A1B2C3D4E5F6',
    techTypes: ['Ndef', 'NfcV'],
    ndefRecords: [],
    isWritable: true,
    maxSize: 1024,
  },
  {
    uid: '04F7E8D9C0B1A2',
    techTypes: ['Ndef'],
    ndefRecords: [
      {
        type: 'uri',
        uri: 'https://beanauditor.app/tag/unknown',
      },
    ],
    isWritable: false,
    maxSize: 0,
  },
];

/**
 * Get a mock tag for NFC simulation.
 *
 * By default returns the first tag (index 0) which always matches the local
 * database, ensuring a predictable and successful demo flow on web.
 * Pass an index or 'random' for variety.
 */
export function getMockNfcTag(index?: number | 'random'): MockNfcTag {
  if (index === 'random') {
    return MOCK_NFC_TAGS[Math.floor(Math.random() * MOCK_NFC_TAGS.length)];
  }
  const idx = index ?? 0;
  return MOCK_NFC_TAGS[idx % MOCK_NFC_TAGS.length];
}

/**
 * Get a mock tag that is guaranteed to match a tag in the local database.
 * Returns the first writable tag with a matching UUID.
 */
export function getMockNfcTagWithDbMatch(): MockNfcTag {
  // Tags at index 0, 1, 2 have UIDs that match tagsMock entries
  // (550e8400-e29b-41d4-a716-000000000001, 000000000002, 000000000003)
  return MOCK_NFC_TAGS[0];
}

/**
 * Get a mock tag that does NOT match any entry in the local database.
 * Useful for testing the "not found" flow.
 */
export function getMockNfcTagWithoutDbMatch(): MockNfcTag {
  // Tags at index 3 and 4 have UIDs that don't match tagsMock
  return MOCK_NFC_TAGS[3];
}

/**
 * Get a read-only mock tag (not writable).
 * Useful for testing the "tag not writable" flow.
 */
export function getMockNfcTagReadOnly(): MockNfcTag {
  return MOCK_NFC_TAGS[4];
}

/**
 * Simulate latency for NFC operations (realistic delay).
 */
export function simulateLatency(minMs = 300, maxMs = 1200): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Simulate scanning latency (longer, like real NFC).
 */
export function simulateScanLatency(): Promise<void> {
  return simulateLatency(800, 2000);
}

/**
 * Simulate write/lock latency.
 */
export function simulateWriteLatency(): Promise<void> {
  return simulateLatency(500, 1500);
}