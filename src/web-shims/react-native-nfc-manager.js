/**
 * Web shim for react-native-nfc-manager
 *
 * NFC is not available on web platforms. This module provides
 * safe no-op implementations so that Vite can resolve the import
 * without bundling native NFC code.
 *
 * All methods return values indicating NFC is unavailable.
 */

const NfcManager = {
  isSupported: async () => false,
  isEnabled: async () => false,
  start: async () => {},
  stop: async () => {},
  requestTechnology: async () => {
    throw new Error('NFC not available on web');
  },
  getTag: async () => null,
  cancelTechnologyRequest: async () => {},
  ndefHandler: {
    getNdefMessage: async () => null,
    writeNdefMessage: async () => {
      throw new Error('NFC not available on web');
    },
    makeReadOnly: async () => {
      throw new Error('NFC not available on web');
    },
  },
  ndefFormatableHandlerAndroid: {
    formatNdef: async () => {
      throw new Error('NFC not available on web');
    },
  },
};

const NfcTech = {
  Ndef: 'Ndef',
  NfcA: 'NfcA',
  NfcB: 'NfcB',
  NfcF: 'NfcF',
  NfcV: 'NfcV',
  IsoDep: 'IsoDep',
  MifareClassic: 'MifareClassic',
  NdefFormatable: 'NdefFormatable',
};

const Ndef = {
  TNF_WELL_KNOWN: 1,
  TNF_MIME_MEDIA: 2,
  RTD_TEXT: [0x54],
  RTD_URI: [0x55],
  textRecord: (text: string) => ({ tnf: 1, type: [0x54], payload: [text.length, ...Buffer.from(text)] }),
  uriRecord: (uri: string) => ({ tnf: 1, type: [0x55], payload: [0, ...Buffer.from(uri)] }),
  record: (tnf: number, type: number[], id: number[], payload: number[]) => ({ tnf, type, id, payload }),
  encodeMessage: (_records: any[]) => [],
  stringToBytes: (str: string) => Array.from(str, (c) => c.charCodeAt(0)),
  textDecoder: new TextDecoder(),
};

export default NfcManager;
export { NfcTech, Ndef };