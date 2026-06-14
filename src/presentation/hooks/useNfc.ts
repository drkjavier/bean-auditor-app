/**
 * useNfc — React hook for NFC operations.
 *
 * Provides a clean interface for NFC scanning, writing, and locking
 * with automatic state management via the NFC Zustand store.
 *
 * On native platforms, uses the real NFC hardware via nfcService.native.ts.
 * On web, uses the mock service (nfcService.ts) that simulates NFC behavior.
 *
 * Usage:
 *   const { scanTag, writeTag, lockWithPin, lockPermanently, ... } = useNfc();
 */

import { useCallback, useEffect, useRef } from 'react';
import { useNfcStore } from '../../state/nfcStore';
import { fetchTags } from '../../data/tagService';
import { getNfcService } from '../../data/nfc/nfcServiceLoader';
import type {
  NfcTagData,
  NfcWritePayload,
  NfcPhase,
  NfcTagMatchResult,
  NfcError,
} from '../../domain/nfc/NfcTypes';

export type UseNfcReturn = {
  /** Whether NFC is available on this device */
  isNfcAvailable: boolean;

  /** Whether NFC is enabled */
  isNfcEnabled: boolean;

  /** Current operation state */
  operationState: 'idle' | 'scanning' | 'processing' | 'success' | 'error';

  /** Current phase */
  currentPhase: NfcPhase;

  /** Last scanned tag data */
  scannedTag: NfcTagData | null;

  /** Match result from local database */
  matchResult: NfcTagMatchResult | null;

  /** Last error */
  error: NfcError | null;

  /** Whether a write operation is in progress */
  isWriting: boolean;

  /** Whether a lock operation is in progress */
  isLocking: boolean;

  /** Initialize NFC (call on mount) */
  initialize: () => Promise<void>;

  /** Scan an NFC tag (read phase) */
  scanTag: () => Promise<NfcTagData | null>;

  /** Write data to an NFC tag (write phase) */
  writeTag: (payload: NfcWritePayload) => Promise<boolean>;

  /** Lock an NFC tag with a PIN */
  lockWithPin: (pin: string) => Promise<boolean>;

  /** Lock an NFC tag permanently (irreversible) */
  lockPermanently: () => Promise<boolean>;

  /** Set the current phase */
  setPhase: (phase: NfcPhase) => void;

  /** Cancel any ongoing NFC operation */
  cancel: () => Promise<void>;

  /** Reset the NFC state */
  reset: () => void;

  /** Clear operational errors/loading without losing scanned tag or match result */
  clearOperationState: () => void;

  /** Whether running on web (mock mode) */
  isWebPlatform: boolean;
};

export function useNfc(): UseNfcReturn {
  const store = useNfcStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Detect platform from the capability info after initialization
  const isWebPlatform = store.capability?.platform === 'web';

  const initialize = useCallback(async () => {
    await store.initialize();
  }, [store]);

  const scanTag = useCallback(async (): Promise<NfcTagData | null> => {
    store.setOperationState('scanning');
    store.setScannedTag(null);
    store.setMatchResult(null);

    try {
      const service = await getNfcService();
      const tagData = await service.readNfcTag();

      if (!mountedRef.current) return null;

      store.setScannedTag(tagData);
      store.setOperationState('success');

      // Try to match against local database
      try {
        const tags = await fetchTags();
        const match = tags.find(t => t.uuid === tagData.uid);
        if (match) {
          store.setMatchResult({
            type: 'found',
            tagId: match.uuid,
            uniqueId: match.unique_id,
            colorHex: match.colorHex,
            auditStatus: match.audit_status ?? 'not_audited',
          });
        } else {
          store.setMatchResult({
            type: 'not_found',
            uid: tagData.uid,
          });
        }
      } catch {
        // If database lookup fails, still show the tag data
        store.setMatchResult({
          type: 'error',
          message: 'No se pudo buscar en la base de datos local',
        });
      }

      return tagData;
    } catch (err: any) {
      if (!mountedRef.current) return null;

      const nfcError: NfcError = err?.code
        ? err
        : { code: 'UNKNOWN', message: err?.message || 'Error desconocido', nativeError: err };

      store.setError(nfcError);

      // If cancelled, go back to idle instead of error
      if (nfcError.code === 'CANCELLED') {
        store.setOperationState('idle');
      }

      return null;
    }
  }, [store]);

  const writeTag = useCallback(async (payload: NfcWritePayload): Promise<boolean> => {
    store.setWriting(true);
    store.setOperationState('processing');

    try {
      const service = await getNfcService();
      await service.writeNfcTag(payload);

      if (!mountedRef.current) return false;

      // Update scanned tag with written data so the UI reflects the change
      const updatedTag = service.getMockState?.()?.lastScannedTag ?? null;
      if (updatedTag) {
        store.setScannedTag(updatedTag);
      }

      store.setOperationState('success');
      store.setWriting(false);
      return true;
    } catch (err: any) {
      if (!mountedRef.current) return false;

      const nfcError: NfcError = err?.code
        ? err
        : { code: 'UNKNOWN', message: err?.message || 'Error desconocido', nativeError: err };

      store.setError(nfcError);
      store.setWriting(false);

      if (nfcError.code === 'CANCELLED') {
        store.setOperationState('idle');
      }

      return false;
    }
  }, [store]);

  const lockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const scannedTag = store.scannedTag;
    if (!scannedTag) {
      store.setError({ code: 'UNKNOWN', message: 'No hay tag escaneado' });
      return false;
    }

    store.setLocking(true);
    store.setOperationState('processing');

    try {
      const service = await getNfcService();
      const result = await service.lockNfcTagWithPin(scannedTag.uid, pin);

      if (!mountedRef.current) return false;

      // Update scanned tag to reflect locked state (isWritable = false)
      const updatedTag = service.getMockState?.()?.lastScannedTag ?? null;
      if (updatedTag) {
        store.setScannedTag(updatedTag);
      }

      store.setOperationState('success');
      store.setLocking(false);
      return result.success;
    } catch (err: any) {
      if (!mountedRef.current) return false;

      const nfcError: NfcError = err?.code
        ? err
        : { code: 'UNKNOWN', message: err?.message || 'Error desconocido', nativeError: err };

      store.setError(nfcError);
      store.setLocking(false);

      if (nfcError.code === 'CANCELLED') {
        store.setOperationState('idle');
      }

      return false;
    }
  }, [store]);

  const lockPermanently = useCallback(async (): Promise<boolean> => {
    const scannedTag = store.scannedTag;
    if (!scannedTag) {
      store.setError({ code: 'UNKNOWN', message: 'No hay tag escaneado' });
      return false;
    }

    store.setLocking(true);
    store.setOperationState('processing');

    try {
      const service = await getNfcService();
      const result = await service.lockNfcTagPermanently(scannedTag.uid);

      if (!mountedRef.current) return false;

      // Update scanned tag to reflect permanently locked state (isWritable = false)
      const updatedTag = service.getMockState?.()?.lastScannedTag ?? null;
      if (updatedTag) {
        store.setScannedTag(updatedTag);
      }

      store.setOperationState('success');
      store.setLocking(false);
      return result.success;
    } catch (err: any) {
      if (!mountedRef.current) return false;

      const nfcError: NfcError = err?.code
        ? err
        : { code: 'UNKNOWN', message: err?.message || 'Error desconocido', nativeError: err };

      store.setError(nfcError);
      store.setLocking(false);

      if (nfcError.code === 'CANCELLED') {
        store.setOperationState('idle');
      }

      return false;
    }
  }, [store]);

  const cancel = useCallback(async () => {
    try {
      const service = await getNfcService();
      await service.cancelNfcOperation();
    } catch {
      // Best-effort cancellation
    }
    store.setOperationState('idle');
  }, [store]);

  const reset = useCallback(() => {
    // Also reset mock state on web so tags can be re-scanned
    if (isWebPlatform) {
      getNfcService().then(service => {
        if ('resetMockState' in service) {
          service.resetMockState();
        }
      }).catch(() => {});
    }
    store.resetOperation();
  }, [isWebPlatform, store]);

  return {
    isNfcAvailable: store.isNfcAvailable,
    isNfcEnabled: store.capability?.isEnabled ?? false,
    operationState: store.operationState,
    currentPhase: store.currentPhase,
    scannedTag: store.scannedTag,
    matchResult: store.matchResult,
    error: store.error,
    isWriting: store.isWriting,
    isLocking: store.isLocking,
    initialize,
    scanTag,
    writeTag,
    lockWithPin,
    lockPermanently,
    setPhase: store.setPhase,
    cancel,
    reset,
    clearOperationState: store.clearOperationState,
    isWebPlatform,
  };
}

export default useNfc;