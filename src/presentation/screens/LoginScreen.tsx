import React, { useState, useRef } from 'react';
import {
  Alert,
  Text,
  View,
  AccessibilityInfo,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useAuthStore } from '../../stores';
import { AUTH_DEBUG, genAttemptId, setAttemptId, getAttemptId, maskUsername, sanitizeError } from '../../infrastructure/logging/authDebug';
import Button from '../components/Button';
import Input from '../components/Input';
import ErrorBanner from '../components/ErrorBanner';
import AppLayout from '../components/AppLayout';

/**
 * Pantalla de inicio de sesión (LoginScreen) siguiendo buenas prácticas:
 * - Ubicada en src/presentation/screens.
 * - Accesibilidad mejorada (labels, roles, avisos).
 * - Validación de entradas.
 * - Navegación desacoplada.
 * - Lógica de estado centralizada (en store/hook).
 */
interface Props {
  navigation?: { replace?: (screen: string) => void } | any;
}

export default function LoginScreen({ navigation }: Props) {
  const username = useAuthStore(state => state.username);
  const setUsername = useAuthStore(state => state.setUsername);
  const login = useAuthStore(state => state.login);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // debug UI helpers (only shown when AUTH_DEBUG)
  const [debugAttemptId, setDebugAttemptId] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Mejor accesibilidad: enfocar error en primer input inválido
  const usernameRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const focusFirstError = () => {
    // Anuncia el primer error disponible para lectores de pantalla y mueve el foco
    if (usernameError) {
      AccessibilityInfo.announceForAccessibility(usernameError);
      usernameRef.current?.focus && usernameRef.current.focus();
    } else if (passwordError) {
      AccessibilityInfo.announceForAccessibility(passwordError);
      passwordRef.current?.focus && passwordRef.current.focus();
    }
  };

  const validateInputs = () => {
    setUsernameError(null);
    setPasswordError(null);
    const u = (username || '').trim();
    const p = (password || '').trim();
    if (!u && !p) {
      setUsernameError('Usuario requerido');
      setPasswordError('Contraseña requerida');
      return false;
    }
    if (!u) {
      setUsernameError('Usuario requerido');
      return false;
    }
    if (!p) {
      setPasswordError('Contraseña requerida');
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    // Clear any previous general error shown in UI
    setGeneralError(null);

    // Validate inputs locally and log if validation fails
    const u = (username || '').trim();
    const p = (password || '').trim();
    if (!validateInputs()) {
      const attemptIdBefore = getAttemptId();
      if (AUTH_DEBUG) {
        console.warn('[auth] LoginScreen onSubmit:validationFailed', {
          attemptId: attemptIdBefore,
          username: maskUsername(username),
          missingUsername: !u,
          missingPassword: !p,
        });
        setDebugMessage('submit:validationFailed');
      }
      focusFirstError();
      return;
    }

    setLoading(true);
    // Reuse attemptId if already set by the button handler; otherwise generate one.
    let attemptId = getAttemptId();
    if (!attemptId) {
      attemptId = genAttemptId();
      // expose for propagation to fetchWithAuth if needed
      setAttemptId(attemptId);
    }
    if (AUTH_DEBUG) {
      console.warn('[auth] LoginScreen onSubmit:start', { attemptId, username: maskUsername(username) });
      setDebugAttemptId(attemptId);
      setDebugMessage('submit:start');
    }
    try {
      // Cierra el teclado y realiza login
      Keyboard.dismiss();
      if (AUTH_DEBUG) {
        console.warn('[auth] LoginScreen calling login', { attemptId, username: maskUsername(username) });
      }
      const callStart = Date.now();
      // Await the login call and capture duration for diagnostics
      await login(password);
      // clear sensitive data from UI immediately after success
      setPassword('');
      const durationMs = Date.now() - callStart;
      // After login, inspect minimal state without exposing sensitive data
      const isLoggedInAfter = useAuthStore.getState().isLoggedIn;
      const currentUsername = useAuthStore.getState().username;
      if (AUTH_DEBUG) {
        console.warn('[auth] LoginScreen login:returned', { attemptId, durationMs, isLoggedInAfter, username: maskUsername(currentUsername) });
      }
      setUsernameError(null);
      setPasswordError(null);
    if (AUTH_DEBUG) {
      console.warn('[auth] LoginScreen onSubmit:success', { attemptId, username: maskUsername(username) });
      setDebugMessage('submit:success');
    }
      // clear any general error on success
      setGeneralError(null);
      if (navigation && navigation.replace) {
        if (AUTH_DEBUG) console.warn('[auth] LoginScreen navigating', { attemptId, to: 'Main' });
        navigation.replace('Main');
      }
    } catch (err: any) {
      const msg = err?.message || 'Error de autenticación';
      const sErr = sanitizeError(err);
      // Always log sanitized error; use console.error for visibility
      console.error('[auth] LoginScreen onSubmit:error', { attemptId, username: maskUsername(username), error: sErr });
      if (AUTH_DEBUG) {
        setDebugMessage(`submit:error ${sErr.message}`);
      }
      // For authentication failures, show a generic message to avoid user enumeration
      if (msg === 'Credenciales inválidas' || msg === 'Error de autenticación') {
        setPasswordError('Credenciales inválidas');
        setUsernameError(null);
      } else if (msg === 'Usuario y contraseña requeridos') {
        // keep client-side presence validations handled above
        setUsernameError('Usuario requerido');
        setPasswordError('Contraseña requerida');
      } else {
        // Fallback: show an alert for unexpected errors on native and a visible banner on all platforms
        setGeneralError(msg);
        if (Platform.OS !== 'web') Alert.alert('Error', msg);
      }
      focusFirstError();
    } finally {
      // cleanup attempt id after action completes
      setAttemptId(null);
      if (AUTH_DEBUG) console.warn('[auth] LoginScreen onSubmit:finished', { attemptId });
      // keep debugAttemptId visible for a short time (do not clear immediately)
      // optional: leave it so developer can inspect UI; remove in production via AUTH_DEBUG
      setLoading(false);
    }
  };

  // Button press handler: generates an attemptId, logs button press metadata and triggers submit.
  const handleButtonPress = async () => {
    const attemptId = genAttemptId();
    // store in-memory only so fetchWithAuth or other infra can read it
    setAttemptId(attemptId);
    if (AUTH_DEBUG) {
      console.warn('[auth] LoginButton:press', { attemptId, username: maskUsername(username), canSubmit: !!canSubmit, isDisabled: !!isDisabled });
      setDebugAttemptId(attemptId);
      setDebugMessage('button:press');
    }
    try {
      // Await onSubmit so we capture any rejection and can log it here
      await onSubmit();
    } catch (err: any) {
      const sErr = sanitizeError(err);
      console.error('[auth] LoginButton:unhandled', { attemptId, error: sErr });
      if (AUTH_DEBUG) setDebugMessage(`button:unhandled ${sErr.message}`);
      // ensure UI shows something even if onSubmit failed unexpectedly
      setGeneralError(sErr.message || 'Error inesperado');
    }
  };

  const canSubmit = !!(username && String(username).trim() && password && password.trim());
  const isDisabled = loading; // disable only while loading; allow validation presses when fields empty

  return (
    <AppLayout title="BeanAuditorApp">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.form} accessibilityLabel="Pantalla de inicio de sesión" accessibilityRole="form">
          <Text style={styles.title} accessibilityRole="header">BeanAuditorApp</Text>
          <Text style={styles.subtitle}>Inicia sesión</Text>

          <Input
            ref={usernameRef}
            label="Usuario"
            accessibilityLabel="Campo usuario"
            placeholder="Usuario"
            autoCapitalize="none"
            value={username}
            onChangeText={text => {
              setUsername(text);
              if (usernameError) setUsernameError(null);
            }}
            editable={!loading}
            error={usernameError}
            testID="input-username"
          />
          <Input
            ref={passwordRef}
            label="Contraseña"
            accessibilityLabel="Campo contraseña"
            placeholder="Contraseña"
            secure
            autoCapitalize="none"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            editable={!loading}
            error={passwordError}
            testID="input-password"
          />

        <Button onPress={handleButtonPress} loading={loading} disabled={isDisabled} accessibilityLabel={loading ? 'Ingresando...' : 'Entrar'}>
          Entrar
        </Button>

          {generalError ? <ErrorBanner message={generalError} /> : null}

          {AUTH_DEBUG ? (
            <Text accessibilityRole="status" style={styles.debugText}>{`DEBUG ${debugAttemptId ? debugAttemptId : ''}${debugMessage ? ' — ' + debugMessage : ''}`}</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#475569',
  },
  debugText: {
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
  },
  generalErrorText: {
    width: '100%',
    maxWidth: 360,
    color: '#7f1d1d',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    width: '100%',
    maxWidth: 360,
    color: '#dc2626',
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
