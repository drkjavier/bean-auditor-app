/**
 * NfcWriteForm — Form to configure data for writing to an NFC tag.
 *
 * Collects color, tag ID, and coordinates for the NDEF payload.
 * The uuid (UID de fábrica) is read-only and comes from the scanned tag.
 *
 * Usage:
 *   <NfcWriteForm uuid="04:AB:CD:12:34:56:80" onSubmit={handleWrite} isWriting={false} />
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../../themes/ThemeContext';
import Card from '../Card';
import Button from '../Button';
import type { NfcWritePayload } from '../../../domain/nfc/NfcTypes';

type Props = {
  /** Tag UUID from factory (read-only, comes from scanned tag) */
  uuid: string;
  /** Pre-filled data from a scanned tag or existing tag */
  initialData?: Partial<Omit<NfcWritePayload, 'uuid'>>;
  /** Callback when the user confirms the write */
  onSubmit: (payload: NfcWritePayload) => void;
  /** Whether a write operation is in progress */
  isWriting: boolean;
  /** Whether the form is disabled */
  disabled?: boolean;
};

export default function NfcWriteForm({ uuid, initialData, onSubmit, isWriting, disabled = false }: Props) {
  const { colors, typography, spacing, radii } = useTheme();

  const [colorHex, setColorHex] = useState(initialData?.colorHex ?? '#FF0000');
  const [tagId, setTagId] = useState(initialData?.tagId ?? '');
  const [lat, setLat] = useState(String(initialData?.lat ?? ''));
  const [lon, setLon] = useState(String(initialData?.lon ?? ''));

  const isValid = uuid.trim() && tagId.trim() && lat && lon && !isNaN(Number(lat)) && !isNaN(Number(lon));

  const handleSubmit = useCallback(() => {
    if (!isValid || disabled) return;
    onSubmit({
      uuid: uuid.trim(),
      colorHex: colorHex.trim() || '#FF0000',
      tagId: tagId.trim(),
      lat: Number(lat),
      lon: Number(lon),
    });
  }, [uuid, colorHex, tagId, lat, lon, isValid, disabled, onSubmit]);

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.sm,
    ...typography.body,
  };

  return (
    <Card variant="outlined" accessibilityLabel="Formulario de escritura NFC">
      <Text style={[styles.title, { color: colors.textPrimary, ...typography.subtitle }]}>
        Escribir datos en tag NFC
      </Text>

      <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>
        UUID (fábrica)
      </Text>
      <View style={[styles.readOnlyField, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.md }]}>
        <Text style={[styles.readOnlyText, { color: colors.textSecondary, ...typography.body }]} selectable>
          {uuid || 'Escanea un tag primero'}
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.textCaption, ...typography.caption, marginTop: spacing.sm }]}>
        Color (hex)
      </Text>
      <View style={styles.colorRow}>
        <TextInput
          style={[inputStyle, { flex: 1 }]}
          value={colorHex}
          onChangeText={setColorHex}
          placeholder="#FF0000"
          placeholderTextColor={colors.muted}
          editable={!disabled && !isWriting}
          accessibilityLabel="Color del tag en formato hex"
        />
        <View style={[styles.colorSwatch, { backgroundColor: colorHex, marginLeft: spacing.sm }]} />
      </View>

      <Text style={[styles.label, { color: colors.textCaption, ...typography.caption, marginTop: spacing.sm }]}>
        Tag ID
      </Text>
      <TextInput
        style={inputStyle}
        value={tagId}
        onChangeText={setTagId}
        placeholder="Ej: TAG-TIQ-001"
        placeholderTextColor={colors.muted}
        editable={!disabled && !isWriting}
        accessibilityLabel="Identificador del tag"
      />

      <View style={styles.coordinateRow}>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>
            Latitud
          </Text>
          <TextInput
            style={inputStyle}
            value={lat}
            onChangeText={setLat}
            placeholder="14.2833"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            editable={!disabled && !isWriting}
            accessibilityLabel="Latitud del tag"
          />
        </View>
        <View style={[styles.halfField, { marginLeft: spacing.sm }]}>
          <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>
            Longitud
          </Text>
          <TextInput
            style={inputStyle}
            value={lon}
            onChangeText={setLon}
            placeholder="-91.3667"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            editable={!disabled && !isWriting}
            accessibilityLabel="Longitud del tag"
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.md }}>
        <Button
          onPress={handleSubmit}
          disabled={!isValid || disabled || isWriting}
          loading={isWriting}
          accessibilityLabel="Escribir datos en tag NFC"
        >
          {isWriting ? 'Escribiendo…' : 'Escribir en tag'}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
  },
  readOnlyField: {
    borderWidth: 1,
    padding: 12,
  },
  readOnlyText: {
    fontFamily: 'monospace',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  coordinateRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  halfField: {
    flex: 1,
  },
});