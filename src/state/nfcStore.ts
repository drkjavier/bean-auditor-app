/**
 * NFC Store — Zustand global state for NFC operations
 *
 * Manages NFC operation state, scanned tag data, errors,
 * and the current phase of the NFC workflow.
 */

import { create } from 'zustand';
import type {
  NfcOperationState,
  NfcTagData,
  NfcPhase,
  NfcError,
  NfcCapability,
  NfcTagMatchResult,
} from '../domain/nfc/NfcTypes';
import { getNfcService } from '../data/nfc/nfcServiceLoader';

// ── Store Types ──────────────────────────────────────────────────────────────

export type NfcStoreState = {
  /** Whether NFC is available and initialized on this device */
  isNfcAvailable: boolean;

  /** NFC capability info */
  capability: NfcCapability | null;

  /** Current operation state */
  operationState: NfcOperationState;

  /** Current phase in the NFC workflow */
  currentPhase: NfcPhase;

  /** Last scanned tag data */
  scannedTag: NfcTagData | null;

  /** Result of matching scanned tag against local database */
  matchResult: NfcTagMatchResult | null;

  /** Last error, if any */
  error: NfcError | null;

  /** Whether a write operation is in progress */
  isWriting: boolean;

  /** Whether a lock operation is in progress */
  isLocking: boolean;
};

export type NfcStoreActions = {
  /** Initialize NFC and check capability */
  initialize: () => Promise<void>;

  /** Set the current phase */
  setPhase: (phase: NfcPhase) => void;

  /** Set the operation state */
  setOperationState: (state: NfcOperationState) => void;

  /** Set scanned tag data and clear previous error */
  setScannedTag: (tag: NfcTagData | null) => void;

  /** Set match result */
  setMatchResult: (result: NfcTagMatchResult | null) => void;

  /** Set error and transition to error state */
  setError: (error: NfcError | null) => void;

  /** Set writing state */
  setWriting: (isWriting: boolean) => void;

  /** Set locking state */
  setLocking: (isLocking: boolean) => void;

  /** Reset all state to initial values */
  reset: () => void;

  /** Reset only the operation state (keep capability info) */
  resetOperation: () => void;

  /** Clear operational errors/loading without losing scanned tag or match result */
  clearOperationState: () => void;
};

export type NfcStore = NfcStoreState & NfcStoreActions;

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState: NfcStoreState = {
  isNfcAvailable: false,
  capability: null,
  operationState: 'idle',
  currentPhase: 'read',
  scannedTag: null,
  matchResult: null,
  error: null,
  isWriting: false,
  isLocking: false,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useNfcStore = create<NfcStore>((set, get) => ({
  ...initialState,

  initialize: async () => {
    try {
      // Use dynamic import() — same mechanism as useNfc hook
      // to ensure shared module instance and internal state.
      const service = await getNfcService();

      const available = await service.initNfc();
      const capability = await service.checkNfcCapability();

      set({
        isNfcAvailable: available,
        capability,
      });
    } catch (err) {
      set({
        isNfcAvailable: false,
        capability: {
          isSupported: false,
          isEnabled: false,
          platform: 'web',
        },
      });
    }
  },

  setPhase: (phase) => set({ currentPhase: phase }),

  setOperationState: (operationState) => set({ operationState }),

  setScannedTag: (tag) => set({ scannedTag: tag, error: tag ? null : get().error }),

  setMatchResult: (matchResult) => set({ matchResult }),

  setError: (error) => set({
    error,
    operationState: error ? 'error' : get().operationState,
  }),

  setWriting: (isWriting) => set({ isWriting }),

  setLocking: (isLocking) => set({ isLocking }),

  reset: () => set({ ...initialState, capability: get().capability, isNfcAvailable: get().isNfcAvailable }),

  /** Reset only the operation state — preserves scannedTag, matchResult, and currentPhase. */
  resetOperation: () => set({
    operationState: 'idle',
    scannedTag: null,
    matchResult: null,
    error: null,
    isWriting: false,
    isLocking: false,
    currentPhase: 'read',
  }),

  /**
   * Clear operational errors/loading without losing the scanned tag or match result.
   * Used when switching phases so the user can operate on the same tag in a different mode.
   */
  clearOperationState: () => set({
    operationState: 'idle',
    error: null,
    isWriting: false,
    isLocking: false,
  }),
}));