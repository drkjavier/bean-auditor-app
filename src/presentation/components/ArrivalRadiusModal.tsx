/**
 * @module presentation/components/ArrivalRadiusModal
 *
 * Modal shown when the user tries to start navigation but the arrival
 * GPS radius has not been configured yet. Requires a positive value
 * before navigation can activate.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import MdiIcon from './MdiIcon';
import {
  DEFAULT_ARRIVAL_RADIUS_METERS,
  useSettingsStore,
} from '../../state/settingsStore';

export type ArrivalRadiusModalProps = {
  visible: boolean;
  suggestedMeters?: number;
  onCancel: () => void;
  onConfirm: (meters: number) => void;
};

function parseRadius(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export default function ArrivalRadiusModal({
  visible,
  suggestedMeters = DEFAULT_ARRIVAL_RADIUS_METERS,
  onCancel,
  onConfirm,
}: ArrivalRadiusModalProps) {
  const { colors } = useTheme();
  const [value, setValue] = useState(String(suggestedMeters));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      // Prefer an already-configured radius from Settings when opening the modal.
      const existing = useSettingsStore.getState().arrivalRadiusMeters;
      const next = existing != null && Number.isFinite(existing) && existing > 0
        ? String(existing)
        : String(suggestedMeters);
      setValue(next);
      setError(null);
    }
  }, [visible, suggestedMeters]);

  const handleConfirm = () => {
    const parsed = parseRadius(value);
    if (parsed == null) {
      setError('Ingresa un radio válido en metros (mayor a 0).');
      return;
    }
    onConfirm(parsed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} accessibilityViewIsModal>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[styles.container, { backgroundColor: colors.card }]}
            accessibilityRole="alert"
            accessibilityLabel="Configurar radio de llegada"
          >
            <View style={styles.header}>
              <MdiIcon name="crosshairs-gps" size={28} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Radio de llegada</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Define la distancia GPS (en metros) para detectar que llegaste al tag destino.
              </Text>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Radio (metros)</Text>
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background },
                error ? { borderColor: colors.error } : null,
              ]}
              value={value}
              onChangeText={next => {
                setValue(next);
                setError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="Ej: 10"
              accessibilityLabel="Radio de llegada en metros"
              accessibilityHint="Valor numérico mayor a cero"
            />

            {error ? (
              <Text style={[styles.errorText, { color: colors.error }]} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, { backgroundColor: colors.actionSecondaryBg }]}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancelar configuración de radio"
              >
                <Text style={[styles.cancelText, { color: colors.onActionSecondary }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleConfirm}
                accessibilityRole="button"
                accessibilityLabel="Guardar radio y continuar"
              >
                <Text style={[styles.confirmText, { color: colors.textButton }]}>Guardar y navegar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    width: '100%',
    alignItems: 'center',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
    fontSize: 14,
  },
  confirmText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
