/**
 * @module presentation/components/ArrivalActionModal
 *
 * Modal/bottom sheet shown automatically when the user enters the GPS
 * arrival radius of the current navigation target tag.
 *
 * Offers:
 * - Auditar (runs NFC verification then quick audit in the parent screen)
 * - Saltar por ahora (session-only skip; does NOT change audit_status)
 * - Cerrar (dismiss without changing the tag)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';
import ErrorBanner from './ErrorBanner';
import type { Tag } from '../../data/tagService';

export type ArrivalActionModalProps = {
  /** Whether the modal is visible */
  visible: boolean;

  /** Destination tag the user arrived at */
  targetTag: Tag | null;

  /** True while NFC scan / audit is running */
  isProcessing?: boolean;

  /** Error message from the last audit attempt (shown inside the modal) */
  errorMessage?: string | null;

  /** Audit tag (parent runs NFC → quick audit) */
  onAudit: () => void;

  /** Skip tag for this session only */
  onSkip: () => void;

  /** Dismiss without action (navigation continues to same target) */
  onClose: () => void;
};

export default function ArrivalActionModal({
  visible,
  targetTag,
  isProcessing = false,
  errorMessage = null,
  onAudit,
  onSkip,
  onClose,
}: ArrivalActionModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible && !!targetTag} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} accessibilityViewIsModal>
        <View
          style={[styles.container, { backgroundColor: colors.card }]}
          accessibilityRole="alert"
          accessibilityLabel={
            targetTag ? `Has llegado al tag ${targetTag.unique_id}` : 'Has llegado al punto'
          }
        >
          <View style={styles.header}>
            <MdiIcon name="crosshairs-gps" size={28} color={colors.success} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>Has llegado</Text>
            {targetTag ? (
              <Text style={[styles.subtitle, { color: colors.primary }]}>Tag destino: {targetTag.unique_id}</Text>
            ) : null}
            <Text style={[styles.hint, { color: colors.textSecondary }]}>¿Qué acción quieres ejecutar?</Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorWrapper}>
              <ErrorBanner message={errorMessage} />
            </View>
          ) : null}

          {isProcessing ? (
            <View style={styles.processing} accessibilityLabel="Procesando auditoría">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.processingText, { color: colors.primary }]}>Verificando tag NFC…</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, { backgroundColor: colors.success }]}
                onPress={onAudit}
                accessibilityRole="button"
                accessibilityLabel={targetTag ? `Auditar tag ${targetTag.unique_id}` : 'Auditar tag'}
                disabled={isProcessing}
              >
                <MdiIcon name="check-circle-outline" size={18} color={colors.textButton} />
                <Text style={[styles.buttonText, { color: colors.textButton }]}>Auditar</Text>
              </Pressable>

              <Pressable
                style={[styles.button, { backgroundColor: colors.actionSecondaryBg }]}
                onPress={onSkip}
                accessibilityRole="button"
                accessibilityLabel="Saltar tag por ahora en esta sesión"
                disabled={isProcessing}
              >
                <MdiIcon name="skip-next-outline" size={18} color={colors.onActionSecondary} />
                <Text style={[styles.buttonText, { color: colors.onActionSecondary }]}>Saltar por ahora</Text>
              </Pressable>

              <Pressable
                style={[styles.button, { backgroundColor: colors.actionSecondaryBg }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sin ejecutar acción"
                disabled={isProcessing}
              >
                <MdiIcon name="close" size={18} color={colors.onActionSecondary} />
                <Text style={[styles.buttonText, { color: colors.onActionSecondary }]}>Cerrar</Text>
              </Pressable>
            </View>
          )}
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
    padding: 16,
  },
  container: {
    width: 320,
    maxWidth: '100%',
    borderRadius: 12,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorWrapper: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  hint: {
    fontSize: 13,
    marginTop: 8,
  },
  processing: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  processingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
