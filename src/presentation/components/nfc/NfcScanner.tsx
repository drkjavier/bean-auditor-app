/**
 * NfcScanner — Visual feedback component for NFC scanning state.
 *
 * Shows a visual indicator with contextual messages for each NFC operation
 * phase. Uses simple state-based styling instead of Animated API to
 * ensure compatibility with both native and web (react-native-web).
 *
 * Usage:
 *   <NfcScanner state="scanning" phase="read" />
 *   <NfcScanner state="error" phase="write" error={nfcError} />
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../themes/ThemeContext';
import type { NfcOperationState, NfcPhase, NfcError } from '../../../domain/nfc/NfcTypes';

type Props = {
  /** Current operation state */
  state: NfcOperationState;
  /** Current NFC phase */
  phase: NfcPhase;
  /** Error details, shown when state is 'error' */
  error?: NfcError | null;
  /** Retry callback, shown when state is 'error' */
  onRetry?: () => void;
};

const PHASE_LABELS: Record<NfcPhase, string> = {
  read: 'Lectura',
  write: 'Escritura',
  lock_pin: 'Bloqueo PIN',
  lock_permanent: 'Bloqueo permanente',
};

const STATE_MESSAGES: Record<NfcOperationState, string> = {
  idle: 'Listo para escanear',
  scanning: 'Acerca el tag NFC al dispositivo…',
  processing: 'Procesando tag NFC…',
  success: 'Operación completada exitosamente',
  error: 'Error en la operación NFC',
};

export default function NfcScanner({ state, phase, error, onRetry }: Props) {
  const { colors, typography, spacing, radii } = useTheme();

  const phaseLabel = PHASE_LABELS[phase];
  const stateMessage = STATE_MESSAGES[state];

  const getIndicatorColor = () => {
    switch (state) {
      case 'scanning': return colors.primary;
      case 'processing': return colors.warning;
      case 'success': return colors.success;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  const indicatorColor = getIndicatorColor();

  return (
    <View style={[styles.container, { padding: spacing.lg }]} accessibilityLabel={`NFC ${phaseLabel}: ${stateMessage}`}>
      {/* Phase label */}
      <Text style={[styles.phaseLabel, { color: colors.textSecondary, ...typography.overline }]}>
        NFC · {phaseLabel}
      </Text>

      {/* Scanning indicator — uses simple View with dynamic styles, no Animated */}
      <View style={styles.indicatorContainer}>
        {/* Pulse ring effect via opacity transition */}
        {state === 'scanning' && (
          <View style={[styles.pulseRing, { borderColor: indicatorColor, opacity: 0.4 }]} />
        )}
        <View style={[styles.indicatorCircle, { backgroundColor: indicatorColor }]}>
          {state === 'scanning' || state === 'processing' ? (
            <ActivityIndicator size="large" color={colors.textButton} />
          ) : state === 'success' ? (
            <Text style={[styles.iconText, { color: colors.textButton }]}>✓</Text>
          ) : state === 'error' ? (
            <Text style={[styles.iconText, { color: colors.textButton }]}>✗</Text>
          ) : (
            <Text style={[styles.iconText, { color: colors.textButton, fontSize: 28 }]}>NFC</Text>
          )}
        </View>
      </View>

      {/* State message */}
      <Text style={[styles.stateMessage, { color: colors.textPrimary, ...typography.body }]}>
        {stateMessage}
      </Text>

      {/* Error details */}
      {state === 'error' && error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.dangerTonal, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm }]}>
          <Text style={[styles.errorText, { color: colors.error, ...typography.caption }]}>
            {error.message}
          </Text>
          {error.code !== 'CANCELLED' && onRetry ? (
            <Text
              style={[styles.retryLink, { color: colors.primary, ...typography.caption }]}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Reintentar operación NFC"
            >
              Reintentar
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    marginBottom: 16,
    letterSpacing: 1,
  },
  indicatorContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  indicatorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 32,
    fontWeight: '700',
  },
  stateMessage: {
    textAlign: 'center',
    maxWidth: 280,
  },
  errorBox: {
    width: '100%',
    maxWidth: 300,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  retryLink: {
    textAlign: 'center',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});