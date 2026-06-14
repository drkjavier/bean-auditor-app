/**
 * NfcLockConfirm — Confirmation dialog for NFC lock operations.
 *
 * Provides double-confirmation for lock operations, especially
 * for permanent lock which is irreversible.
 *
 * Usage:
 *   <NfcLockConfirm
 *     visible={showConfirm}
 *     mode="lock_permanent"
 *     uid="04ABC123"
 *     onConfirm={handleLock}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../themes/ThemeContext';
import Button from '../Button';

type LockMode = 'lock_pin' | 'lock_permanent';

type Props = {
  /** Whether the modal is visible */
  visible: boolean;
  /** Type of lock operation */
  mode: LockMode;
  /** UID of the tag to lock */
  uid: string;
  /** Whether a lock operation is in progress */
  isLocking?: boolean;
  /** Callback when the user confirms the lock */
  onConfirm: (pin?: string) => void;
  /** Callback when the user cancels */
  onCancel: () => void;
};

const MODE_CONFIG: Record<LockMode, { title: string; description: string; confirmLabel: string; confirmColor: string; requiresPin: boolean }> = {
  lock_pin: {
    title: 'Bloquear tag con PIN',
    description: 'Esta acción protegerá el tag NFC con un PIN. Necesitarás el PIN para modificar el tag en el futuro.',
    confirmLabel: 'Bloquear con PIN',
    confirmColor: '#F59E0B', // warning
    requiresPin: true,
  },
  lock_permanent: {
    title: '⚠️ Bloqueo permanente',
    description: 'ADVERTENCIA: Esta acción es IRREVERSIBLE. El tag NFC quedará permanentemente protegido contra escritura. No podrás modificar los datos del tag nunca más.',
    confirmLabel: 'Bloquear permanentemente',
    confirmColor: '#EF4444', // error
    requiresPin: false,
  },
};

export default function NfcLockConfirm({ visible, mode, uid, isLocking = false, onConfirm, onCancel }: Props) {
  const { colors, typography, spacing, radii } = useTheme();
  const config = MODE_CONFIG[mode];
  const [pin, setPin] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isPinValid = mode === 'lock_pin' ? pin.length >= 4 : true;
  const isConfirmValid = mode === 'lock_permanent' ? confirmText === 'BLOQUEAR' : true;
  const canConfirm = isPinValid && isConfirmValid && !isLocking;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    onConfirm(mode === 'lock_pin' ? pin : undefined);
  }, [canConfirm, mode, pin, onConfirm]);

  const handleCancel = useCallback(() => {
    setPin('');
    setConfirmText('');
    onCancel();
  }, [onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: colors.card, borderRadius: radii.lg }]} accessibilityRole="alert" accessibilityLabel={config.title}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary, ...typography.subtitle }]}>
            {config.title}
          </Text>

          {/* UID */}
          <View style={[styles.uidBox, { backgroundColor: colors.surface, borderRadius: radii.md, borderColor: colors.border }]}>
            <Text style={[styles.uidLabel, { color: colors.textCaption, ...typography.caption }]}>
              Tag UID
            </Text>
            <Text style={[styles.uidValue, { color: colors.textPrimary, ...typography.body }]} selectable>
              {uid}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary, ...typography.body }]}>
            {config.description}
          </Text>

          {/* PIN input (for lock_pin mode) */}
          {config.requiresPin ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary, ...typography.caption }]}>
                PIN (mínimo 4 caracteres)
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary, borderRadius: radii.md }, pin.length > 0 && pin.length < 4 ? { borderColor: colors.error } : {}]}
                value={pin}
                onChangeText={setPin}
                placeholder="Ingresa el PIN"
                placeholderTextColor={colors.muted}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={16}
                editable={!isLocking}
                accessibilityLabel="PIN de bloqueo NFC"
                accessibilityHint="Mínimo 4 caracteres"
              />
              {pin.length > 0 && pin.length < 4 ? (
                <Text style={[styles.hint, { color: colors.error, ...typography.caption }]}>
                  El PIN debe tener al menos 4 caracteres
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Confirmation input (for lock_permanent mode) */}
          {mode === 'lock_permanent' ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary, ...typography.caption }]}>
                Escribe BLOQUEAR para confirmar
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary, borderRadius: radii.md }]}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="BLOQUEAR"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                editable={!isLocking}
                accessibilityLabel="Confirmación de bloqueo permanente"
                accessibilityHint="Escribe BLOQUEAR para confirmar"
              />
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={[styles.actions, { marginTop: spacing.lg }]}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button
                variant="secondary"
                onPress={handleCancel}
                disabled={isLocking}
                accessibilityLabel="Cancelar bloqueo"
              >
                Cancelar
              </Button>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Button
                onPress={handleConfirm}
                disabled={!canConfirm}
                loading={isLocking}
                accessibilityLabel={config.confirmLabel}
                style={{ backgroundColor: canConfirm ? config.confirmColor : colors.muted }}
              >
                {isLocking ? 'Bloqueando…' : config.confirmLabel}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 340,
    padding: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  uidBox: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  uidLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  uidValue: {
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    marginTop: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
});