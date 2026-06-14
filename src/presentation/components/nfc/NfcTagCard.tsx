/**
 * NfcTagCard — Displays scanned NFC tag data.
 *
 * Shows UID, NDEF records, and tag metadata in a card layout.
 * Supports both found and not-found match results.
 *
 * Usage:
 *   <NfcTagCard tagData={scannedTag} matchResult={match} />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../themes/ThemeContext';
import Card from '../Card';
import MdiIcon from '../MdiIcon';
import type { NfcTagData, NfcTagMatchResult, NdefRecord } from '../../../domain/nfc/NfcTypes';

type Props = {
  /** Scanned tag data */
  tagData: NfcTagData;
  /** Match result from local database lookup */
  matchResult: NfcTagMatchResult | null;
};

function renderNdefRecord(record: NdefRecord, index: number): string {
  switch (record.type) {
    case 'text':
      return `[Texto] ${record.locale ? `[${record.locale}] ` : ''}${record.text}`;
    case 'uri':
      return `[URI] ${record.uri}`;
    case 'mime':
      return `[${record.mimeType}] ${record.payload.substring(0, 50)}${record.payload.length > 50 ? '…' : ''}`;
    default:
      return `[Registro ${index + 1}]`;
  }
}

export default function NfcTagCard({ tagData, matchResult }: Props) {
  const { colors, typography, spacing, radii } = useTheme();

  const matchLabel = (() => {
    if (!matchResult) return null;
    if (matchResult.type === 'found') {
      return { text: `Tag encontrado: ${matchResult.uniqueId}`, color: colors.success };
    }
    if (matchResult.type === 'not_found') {
      return { text: 'Tag no registrado en la base de datos', color: colors.warning };
    }
    return { text: matchResult.message, color: colors.error };
  })();

  return (
    <Card variant="outlined" accessibilityLabel="Datos del tag NFC escaneado">
      {/* UID */}
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>UID</Text>
        <Text style={[styles.value, { color: colors.textPrimary, ...typography.body }]} selectable>
          {tagData.uid || 'Desconocido'}
        </Text>
      </View>

      {/* Match result */}
      {matchLabel ? (
        <View style={[styles.matchBanner, { backgroundColor: matchLabel.color === colors.success ? 'rgba(26, 188, 156, 0.1)' : matchLabel.color === colors.warning ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: radii.md, marginTop: spacing.sm, padding: spacing.sm }]}>
          <Text style={[styles.matchText, { color: matchLabel.color, ...typography.caption }]}>
            {matchLabel.text}
          </Text>
        </View>
      ) : null}

      {/* NDEF Records */}
      {tagData.ndefRecords.length > 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, ...typography.overline }]}>
            REGISTROS NDEF
          </Text>
          {tagData.ndefRecords.map((record, i) => (
            <View key={i} style={[styles.recordRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.recordText, { color: colors.textPrimary, ...typography.caption }]} selectable>
                {renderNdefRecord(record, i)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[styles.emptyText, { color: colors.muted, ...typography.caption }]}>
            Sin registros NDEF
          </Text>
        </View>
      )}

      {/* Tag metadata */}
      <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
        <View style={styles.metaCell}>
          <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>Escribible</Text>
          <Text style={[styles.value, { color: tagData.isWritable ? colors.success : colors.error, ...typography.caption }]}>
            {tagData.isWritable ? 'Sí' : 'No'}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>Tamaño máx.</Text>
          <Text style={[styles.value, { color: colors.textPrimary, ...typography.caption }]}>
            {tagData.maxSize > 0 ? `${tagData.maxSize} bytes` : 'N/A'}
          </Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={[styles.label, { color: colors.textCaption, ...typography.caption }]}>Tecnologías</Text>
          <Text style={[styles.value, { color: colors.textPrimary, ...typography.caption }]}>
            {tagData.techTypes.length > 0 ? tagData.techTypes.join(', ') : 'N/A'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
  value: {
    fontWeight: '500',
  },
  matchBanner: {
    // Dynamic styles from theme
  },
  matchText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  recordRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  recordText: {
    fontWeight: '400',
  },
  emptyText: {
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCell: {
    flex: 1,
    alignItems: 'center',
  },
});