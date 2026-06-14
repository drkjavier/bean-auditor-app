/**
 * PullInitScreen - Initial data download screen
 *
 * Shown after first login to download all required data.
 * Displays progress of the pull operation.
 *
 * Features:
 * - Progress bar with percentage
 * - Status messages
 * - Retry on failure
 * - Skip option (for offline-first mode)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSyncStore } from '../../state/syncStore';
import { MdiIcon } from '../components/MdiIcon';
import { Button } from '../components/Button';

type PullInitScreenProps = {
  /** Called when pull is complete */
  onComplete: () => void;
  /** Called when user skips pull */
  onSkip: () => void;
};

export function PullInitScreen({ onComplete, onSkip }: PullInitScreenProps) {
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'downloading' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Preparando descarga...');
  const [error, setError] = useState<string | null>(null);

  const pullNow = useSyncStore((state) => state.pullNow);
  const isConnected = useSyncStore((state) => state.isConnected);

  const startPull = useCallback(async () => {
    if (!isConnected) {
      setPhase('error');
      setError('Sin conexión a internet. Puede continuar sin descargar datos.');
      return;
    }

    setPhase('connecting');
    setProgress(0);
    setMessage('Conectando con el servidor...');
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      const result = await pullNow();

      clearInterval(progressInterval);

      if (result.success) {
        setPhase('complete');
        setProgress(100);
        setMessage('Descarga completada exitosamente');

        // Auto-complete after a short delay
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setPhase('error');
        setError(result.errors[0] || 'Error durante la descarga');
      }
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [isConnected, pullNow, onComplete]);

  // Auto-start pull on mount
  useEffect(() => {
    startPull();
  }, []);

  const getPhaseIcon = () => {
    switch (phase) {
      case 'connecting':
      case 'downloading':
        return 'sync';
      case 'complete':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'cloud-download';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'connecting':
      case 'downloading':
        return '#2196F3';
      case 'complete':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: getPhaseColor() + '20' }]}>
          {phase === 'connecting' || phase === 'downloading' ? (
            <ActivityIndicator size="large" color={getPhaseColor()} />
          ) : (
            <MdiIcon name={getPhaseIcon()} size={64} color={getPhaseColor()} />
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {phase === 'complete' ? '¡Descarga Completa!' : 'Descargando Datos'}
        </Text>

        {/* Message */}
        <Text style={styles.message}>{message}</Text>

        {/* Progress Bar */}
        {(phase === 'connecting' || phase === 'downloading' || phase === 'complete') && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: getPhaseColor(),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: getPhaseColor() }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}

        {/* Error */}
        {phase === 'error' && error && (
          <View style={styles.errorContainer}>
            <MdiIcon name="alert-circle" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {phase === 'error' && (
            <>
              <Button
                onPress={startPull}
                variant="primary"
                style={styles.button}
              >
                Reintentar
              </Button>
              <Button
                onPress={onSkip}
                variant="secondary"
                style={styles.button}
              >
                Continuar sin descargar
              </Button>
            </>
          )}

          {phase === 'idle' && (
            <Button
              onPress={startPull}
              variant="primary"
              style={styles.button}
            >
              Iniciar Descarga
            </Button>
          )}
        </View>

        {/* Skip link for non-error states */}
        {phase !== 'error' && phase !== 'complete' && (
          <TouchableOpacity onPress={onSkip} style={styles.skipLink}>
            <Text style={styles.skipText}>Omitir por ahora</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    minWidth: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
  skipLink: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#757575',
    textDecorationLine: 'underline',
  },
});

export default PullInitScreen;
