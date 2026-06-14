/**
 * ConflictResolutionModal - Manual conflict resolution
 *
 * Displays conflicts that require user decision.
 * Shows local vs server versions and allows choosing which to keep.
 *
 * Features:
 * - Side-by-side comparison
 * - Local vs server version display
 * - One-tap resolution
 * - Batch resolution for multiple conflicts
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { ManualConflict } from '../../domain/sync/ConflictResolver';
import MdiIcon from './MdiIcon';
import Button from './Button';

type ConflictResolutionModalProps = {
  /** Whether modal is visible */
  visible: boolean;
  /** List of conflicts to resolve */
  conflicts: ManualConflict[];
  /** Called when a conflict is resolved */
  onResolve: (conflictId: string, choice: 'local' | 'server') => void;
  /** Called when modal is closed */
  onClose: () => void;
};

export function ConflictResolutionModal({
  visible,
  conflicts,
  onResolve,
  onClose,
}: ConflictResolutionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentConflict = conflicts[currentIndex];
  const hasMoreConflicts = currentIndex < conflicts.length - 1;

  const handleResolve = useCallback(
    (choice: 'local' | 'server') => {
      if (!currentConflict) return;

      onResolve(currentConflict.id, choice);

      if (hasMoreConflicts) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    },
    [currentConflict, hasMoreConflicts, onResolve, onClose]
  );

  const handleClose = useCallback(() => {
    setCurrentIndex(0);
    onClose();
  }, [onClose]);

  const getRecordDisplayName = (record: any) => {
    if (record.unique_id) return record.unique_id;
    if (record.name) return record.name;
    if (record.username) return record.username;
    return record.id || 'Sin nombre';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!visible || !currentConflict) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <MdiIcon name="alert-circle" size={24} color="#FF9800" />
            <Text style={styles.title}>Conflicto de Sincronización</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MdiIcon name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          {conflicts.length > 1 && (
            <Text style={styles.progress}>
              Conflicto {currentIndex + 1} de {conflicts.length}
            </Text>
          )}

          {/* Conflict info */}
          <View style={styles.conflictInfo}>
            <Text style={styles.recordType}>
              {currentConflict.type === 'tag'
                ? 'Tag'
                : currentConflict.type === 'farm'
                ? 'Finca'
                : currentConflict.type === 'user'
                ? 'Usuario'
                : 'Auditoría'}
            </Text>
            <Text style={styles.recordId}>
              {getRecordDisplayName(currentConflict.localVersion)}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{currentConflict.description}</Text>

          {/* Versions comparison */}
          <View style={styles.versionsContainer}>
            {/* Local version */}
            <View style={[styles.versionCard, styles.localVersion]}>
              <View style={styles.versionHeader}>
                <MdiIcon name="cellphone" size={16} color="#2196F3" />
                <Text style={[styles.versionTitle, { color: '#2196F3' }]}>
                  Versión Local
                </Text>
              </View>
              <Text style={styles.versionTime}>
                {formatTimestamp(currentConflict.localVersion.updated_at)}
              </Text>
            </View>

            {/* VS divider */}
            <View style={styles.vsDivider}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* Server version */}
            <View style={[styles.versionCard, styles.serverVersion]}>
              <View style={styles.versionHeader}>
                <MdiIcon name="cloud" size={16} color="#4CAF50" />
                <Text style={[styles.versionTitle, { color: '#4CAF50' }]}>
                  Versión Servidor
                </Text>
              </View>
              <Text style={styles.versionTime}>
                {formatTimestamp(currentConflict.serverVersion.updated_at)}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              onPress={() => handleResolve('local')}
              variant="secondary"
              style={styles.actionButton}
            >
              Mantener Local
            </Button>
            <Button
              onPress={() => handleResolve('server')}
              variant="primary"
              style={styles.actionButton}
            >
              Mantener Servidor
            </Button>
          </View>

          {/* Skip all link */}
          {conflicts.length > 1 && (
            <TouchableOpacity onPress={handleClose} style={styles.skipLink}>
              <Text style={styles.skipText}>Resolver todos después</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  progress: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    paddingTop: 8,
  },
  conflictInfo: {
    padding: 16,
    alignItems: 'center',
  },
  recordType: {
    fontSize: 12,
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  versionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  versionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  localVersion: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  serverVersion: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  versionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  versionTime: {
    fontSize: 11,
    color: '#757575',
  },
  vsDivider: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9E9E',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  skipLink: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#757575',
    textDecorationLine: 'underline',
  },
});

export default ConflictResolutionModal;
