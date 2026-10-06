/**
 * Tests for domain/nfc/nfcTagMatcher
 */

import {
  extractNfcTagIdentity,
  doesNfcTagMatchDestination,
} from '../../../domain/nfc/nfcTagMatcher';
import type { NfcTagData } from '../../../domain/nfc/NfcTypes';

const destination = {
  uuid: '550e8400-e29b-41d4-a716-000000000001',
  unique_id: 'TAG-TIQ-001',
};

function makeTagData(overrides: Partial<NfcTagData>): NfcTagData {
  return {
    uid: '550e8400-e29b-41d4-a716-000000000001',
    techTypes: ['Ndef'],
    ndefRecords: [],
    isWritable: true,
    maxSize: 888,
    readAt: Date.now(),
    ...overrides,
  };
}

describe('extractNfcTagIdentity', () => {
  it('extracts uuid and uniqueId from MIME JSON payload', () => {
    const tagData = makeTagData({
      ndefRecords: [
        {
          type: 'mime',
          mimeType: 'application/json',
          payload: JSON.stringify({
            uuid: destination.uuid,
            uniqueId: destination.unique_id,
          }),
        },
      ],
    });

    expect(extractNfcTagIdentity(tagData)).toEqual({
      uuid: destination.uuid,
      uniqueId: destination.unique_id,
    });
  });

  it('extracts uniqueId from TAG: text record', () => {
    const tagData = makeTagData({
      ndefRecords: [
        { type: 'text', locale: 'es', text: 'TAG:TAG-TIQ-001' },
      ],
    });

    expect(extractNfcTagIdentity(tagData).uniqueId).toBe('TAG-TIQ-001');
  });

  it('uses hardware UID as uuid when it looks like a UUID', () => {
    const tagData = makeTagData({ uid: destination.uuid, ndefRecords: [] });

    expect(extractNfcTagIdentity(tagData).uuid).toBe(destination.uuid);
  });

  it('ignores non-uuid hardware UIDs', () => {
    const tagData = makeTagData({ uid: '04A1B2C3D4E5F6', ndefRecords: [] });

    expect(extractNfcTagIdentity(tagData).uuid).toBeNull();
  });
});

describe('doesNfcTagMatchDestination', () => {
  it('matches on uuid', () => {
    expect(
      doesNfcTagMatchDestination({ uuid: destination.uuid, uniqueId: null }, destination),
    ).toBe(true);
  });

  it('matches on unique_id', () => {
    expect(
      doesNfcTagMatchDestination({ uuid: null, uniqueId: destination.unique_id }, destination),
    ).toBe(true);
  });

  it('returns false when neither uuid nor unique_id match', () => {
    expect(
      doesNfcTagMatchDestination(
        { uuid: 'other-uuid', uniqueId: 'OTHER' },
        destination,
      ),
    ).toBe(false);
  });

  it('returns false for empty identity', () => {
    expect(doesNfcTagMatchDestination({ uuid: null, uniqueId: null }, destination)).toBe(false);
  });
});
