/**
 * NFCScreen — Dedicated NFC operations screen.
 *
 * Provides a 4-phase workflow for NFC operations:
 * 1. Read: Scan NFC tags and match against local database
 * 2. Write: Write tag metadata to NFC tags
 * 3. Lock PIN: Protect tags with a PIN
 * 4. Lock Permanent: Irreversibly lock tags (requires double confirmation)
 *
 * On web, shows a message that NFC is not available.
 *
 * Usage:
 *   <NFCScreen />
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { useNfc } from '../hooks/useNfc';
import { useAuthStore } from '../../stores';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import MdiIcon from '../components/MdiIcon';
import { NfcScanner, NfcTagCard, NfcWriteForm, NfcLockConfirm } from '../components/nfc';
import type { NfcPhase, NfcWritePayload } from '../../domain/nfc/NfcTypes';
import type { NdefRecord } from '../../domain/nfc/NfcTypes';

/** Extract lat/lon from scanned tag's MIME NDEF record (JSON payload). */
function extractCoordsFromNdef(records: NdefRecord[]): { lat: number; lon: number } | null {
  for (const r of records) {
    if (r.type === 'mime') {
      try {
        const data = JSON.parse(r.payload);
        if (typeof data.lat === 'number' && typeof data.lon === 'number') {
          return { lat: data.lat, lon: data.lon };
        }
      } catch { /* skip malformed */ }
    }
  }
  return null;
}

const PHASE_CONFIG: Record<NfcPhase, { label: string; icon: string; description: string }> = {
  read: {
    label: 'Leer',
    icon: 'nfc-search-variant',
    description: 'Escanea un tag NFC para leer sus datos y buscarlo en la base de datos.',
  },
  write: {
    label: 'Escribir',
    icon: 'nfc-variant',
    description: 'Escribe datos de un tag en un NFC vírgen o reescribible.',
  },
  lock_pin: {
    label: 'Bloqueo PIN',
    icon: 'lock-outline',
    description: 'Protege el tag NFC con un PIN. Necesitarás el PIN para modificarlo.',
  },
  lock_permanent: {
    label: 'Bloqueo permanente',
    icon: 'lock',
    description: '⚠️ Bloquea el tag NFC permanentemente. Esta acción es IRREVERSIBLE.',
  },
};

export default function NFCScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const { colors, typography, spacing, radii } = useTheme();
  const nfc = useNfc();

  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [writePayload, setWritePayload] = useState<NfcWritePayload | null>(null);

  // Initialize NFC on mount (works on both native and web)
  useEffect(() => {
    if (isLoggedIn) {
      nfc.initialize();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScan = useCallback(async () => {
    await nfc.scanTag();
  }, [nfc]);

  const handleWrite = useCallback(async (payload: NfcWritePayload) => {
    setWritePayload(payload);
    const success = await nfc.writeTag(payload);
    if (success) {
      // Optionally refresh or show success
    }
  }, [nfc]);

  const handleLockPin = useCallback(async (pin?: string) => {
    if (!pin) return;
    setShowLockConfirm(false);
    const success = await nfc.lockWithPin(pin);
    if (success) {
      // Lock succeeded
    }
  }, [nfc]);

  const handleLockPermanent = useCallback(async () => {
    setShowLockConfirm(false);
    const success = await nfc.lockPermanently();
    if (success) {
      // Permanent lock succeeded
    }
  }, [nfc]);

  const handleLockConfirm = useCallback(() => {
    setShowLockConfirm(true);
  }, []);

  const handleLockCancel = useCallback(() => {
    setShowLockConfirm(false);
  }, []);

  // Not logged in
  if (!isLoggedIn) {
    return null;
  }

  // NFC not available (only shown on native when hardware is missing)
  if (!nfc.isNfcAvailable && !nfc.isWebPlatform) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]} accessibilityLabel="NFC no soportado">
        <EmptyState
          icon="nfc-variant"
          title="NFC no soportado"
          description="Tu dispositivo no soporta NFC o está desactivado. Verifica la configuración de NFC en Ajustes."
          actionLabel="Reintentar"
          onAction={() => nfc.initialize()}
        />
      </View>
    );
  }

  const currentConfig = PHASE_CONFIG[nfc.currentPhase];

  // Pre-fill write form with data from scanned tag
  const writeInitialData = nfc.scannedTag && nfc.matchResult?.type === 'found'
    ? {
        colorHex: nfc.matchResult.colorHex,
        tagId: nfc.matchResult.uniqueId,
        ...(extractCoordsFromNdef(nfc.scannedTag.ndefRecords) ?? { lat: 0, lon: 0 }),
      }
    : undefined;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surface }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }}
      accessibilityLabel="Pantalla NFC"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Text style={[styles.title, { color: colors.textPrimary, ...typography.h2 }]}>
        NFC
      </Text>

      {/* ── Demo mode banner (web only) ─────────────────────────────────── */}
      {nfc.isWebPlatform && (
        <View style={[styles.demoBanner, { backgroundColor: colors.primaryTonal, borderRadius: radii.md, padding: spacing.sm, marginTop: spacing.sm }]} accessibilityLabel="Modo demostración">
          <Text style={[styles.demoBannerText, { color: colors.primary, ...typography.caption }]}>
            🖥️ Modo demostración — Los datos NFC son simulados en web
          </Text>
        </View>
      )}

      {/* ── Phase selector ─────────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.md }}>
        <SectionHeader title="Operación" />
        <View style={[styles.phaseRow, { gap: spacing.sm }]}>
          {(Object.keys(PHASE_CONFIG) as NfcPhase[]).map((phase) => {
            const config = PHASE_CONFIG[phase];
            const isActive = nfc.currentPhase === phase;
            return (
              <Pressable
                key={phase}
                style={[
                  styles.phaseBtn,
                  {
                    borderColor: isActive ? colors.primary : colors.border,
                    backgroundColor: isActive ? colors.primaryTonal : colors.card,
                    borderRadius: radii.md,
                  },
                ]}
                onPress={() => {
                  nfc.setPhase(phase);
                  nfc.clearOperationState();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Fase: ${config.label}`}
              >
                <Text style={[
                  styles.phaseLabel,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    ...typography.caption,
                  },
                ]}>
                  {config.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Phase description ──────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.md }}>
        <Card variant="outlined" accessibilityLabel={`Descripción: ${currentConfig.description}`}>
          <Text style={[styles.phaseDescription, { color: colors.textSecondary, ...typography.body }]}>
            {currentConfig.description}
          </Text>
        </Card>
      </View>

      {/* ── Scanner indicator ───────────────────────────────────────────── */}
      <View style={{ marginTop: spacing.lg }}>
        <NfcScanner
          state={nfc.operationState}
          phase={nfc.currentPhase}
          error={nfc.error}
          onRetry={handleScan}
        />
      </View>

      {/* ── Phase-specific content ─────────────────────────────────────── */}

      {/* READ PHASE */}
      {nfc.currentPhase === 'read' && (
        <>
          <View style={{ marginTop: spacing.lg }}>
            <Pressable
              style={[styles.scanBtn, { backgroundColor: colors.primary, borderRadius: radii.md }]}
              onPress={handleScan}
              disabled={nfc.operationState === 'scanning' || nfc.operationState === 'processing'}
              accessibilityRole="button"
              accessibilityLabel="Escanear tag NFC"
            >
              <Text style={[styles.scanBtnText, { color: colors.textButton, ...typography.button }]}>
                {nfc.operationState === 'scanning' ? 'Escaneando…' : 'Escanear tag'}
              </Text>
            </Pressable>
          </View>

          {/* Scanned tag data */}
          {nfc.scannedTag && (
            <View style={{ marginTop: spacing.lg }}>
              <SectionHeader title="Datos del tag" />
              <NfcTagCard tagData={nfc.scannedTag} matchResult={nfc.matchResult} />
            </View>
          )}
        </>
      )}

      {/* WRITE PHASE */}
      {nfc.currentPhase === 'write' && (
        <View style={{ marginTop: spacing.lg }}>
          <SectionHeader title="Datos a escribir" />
          {nfc.scannedTag ? (
            <NfcWriteForm
              key={nfc.scannedTag.uid}
              uuid={nfc.scannedTag.uid}
              initialData={writeInitialData}
              onSubmit={handleWrite}
              isWriting={nfc.isWriting}
              disabled={nfc.operationState === 'processing'}
            />
          ) : (
            <EmptyState
              icon="nfc-search-variant"
              title="Escanea un tag primero"
              description="Debes escanear un tag NFC antes de escribir datos."
              actionLabel="Escanear"
              onAction={() => {
                nfc.setPhase('read');
                nfc.clearOperationState();
              }}
            />
          )}
        </View>
      )}

      {/* LOCK PIN PHASE */}
      {nfc.currentPhase === 'lock_pin' && (
        <View style={{ marginTop: spacing.lg }}>
          {nfc.scannedTag ? (
            <>
              <NfcTagCard tagData={nfc.scannedTag} matchResult={nfc.matchResult} />
              <View style={{ marginTop: spacing.md }}>
                <Pressable
                  style={[styles.lockBtn, { backgroundColor: colors.warning, borderRadius: radii.md }]}
                  onPress={handleLockConfirm}
                  disabled={nfc.isLocking}
                  accessibilityRole="button"
                  accessibilityLabel="Bloquear tag con PIN"
                >
                  <Text style={[styles.scanBtnText, { color: colors.textButton, ...typography.button }]}>
                    {nfc.isLocking ? 'Bloqueando…' : 'Bloquear con PIN'}
                  </Text>
                </Pressable>
              </View>

              <NfcLockConfirm
                visible={showLockConfirm}
                mode="lock_pin"
                uid={nfc.scannedTag.uid}
                isLocking={nfc.isLocking}
                onConfirm={handleLockPin}
                onCancel={handleLockCancel}
              />
            </>
          ) : (
            <EmptyState
              icon="nfc-search-variant"
              title="Escanea un tag primero"
              description="Debes escanear un tag NFC antes de bloquearlo."
              actionLabel="Escanear"
              onAction={() => {
                nfc.setPhase('read');
                nfc.clearOperationState();
              }}
            />
          )}
        </View>
      )}

      {/* LOCK PERMANENT PHASE */}
      {nfc.currentPhase === 'lock_permanent' && (
        <View style={{ marginTop: spacing.lg }}>
          {nfc.scannedTag ? (
            <>
              <NfcTagCard tagData={nfc.scannedTag} matchResult={nfc.matchResult} />

              {/* Warning banner */}
              <View style={[styles.warningBanner, { backgroundColor: colors.dangerTonal, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md }]}>
                <Text style={[styles.warningText, { color: colors.error, ...typography.caption }]}>
                  ⚠️ ADVERTENCIA: El bloqueo permanente es IRREVERSIBLE. El tag NFC no podrá ser modificado nunca más.
                </Text>
              </View>

              <View style={{ marginTop: spacing.md }}>
                <Pressable
                  style={[styles.lockBtn, { backgroundColor: colors.error, borderRadius: radii.md }]}
                  onPress={handleLockConfirm}
                  disabled={nfc.isLocking}
                  accessibilityRole="button"
                  accessibilityLabel="Bloquear tag permanentemente"
                >
                  <Text style={[styles.scanBtnText, { color: colors.textButton, ...typography.button }]}>
                    {nfc.isLocking ? 'Bloqueando…' : 'Bloquear permanentemente'}
                  </Text>
                </Pressable>
              </View>

              <NfcLockConfirm
                visible={showLockConfirm}
                mode="lock_permanent"
                uid={nfc.scannedTag.uid}
                isLocking={nfc.isLocking}
                onConfirm={handleLockPermanent}
                onCancel={handleLockCancel}
              />
            </>
          ) : (
            <EmptyState
              icon="nfc-search-variant"
              title="Escanea un tag primero"
              description="Debes escanear un tag NFC antes de bloquearlo permanentemente."
              actionLabel="Escanear"
              onAction={() => {
                nfc.setPhase('read');
                nfc.clearOperationState();
              }}
            />
          )}
        </View>
      )}

      {/* ── Reset button ────────────────────────────────────────────────── */}
      {(nfc.operationState === 'success' || nfc.operationState === 'error') && (
        <View style={{ marginTop: spacing.lg }}>
          <Pressable
            style={[styles.resetBtn, { borderColor: colors.border, borderRadius: radii.md }]}
            onPress={nfc.reset}
            accessibilityRole="button"
            accessibilityLabel="Nueva operación NFC"
          >
            <Text style={[styles.resetBtnText, { color: colors.textSecondary, ...typography.button }]}>
              Nueva operación
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  phaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  phaseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  phaseLabel: {
    fontWeight: '600',
  },
  phaseDescription: {
    lineHeight: 22,
  },
  scanBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    fontWeight: '700',
  },
  lockBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    // Dynamic styles from theme
  },
  warningText: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  resetBtnText: {
    fontWeight: '600',
  },
  demoBanner: {
    // Dynamic styles from theme
  },
  demoBannerText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});