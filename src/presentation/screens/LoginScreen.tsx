import React, { useState, useRef } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  AccessibilityInfo,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useAuthStore } from '../../stores';
import { AUTH_DEBUG, genAttemptId, setAttemptId, getAttemptId, maskUsername, sanitizeError } from '../../infrastructure/logging/authDebug';

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
    if (!validateInputs()) {
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
      await login(password);
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
      if (navigation && navigation.replace) {
        if (AUTH_DEBUG) console.warn('[auth] LoginScreen navigating', { attemptId, to: 'Main' });
        navigation.replace('Main');
      }
    } catch (err: any) {
      const msg = err?.message || 'Error de autenticación';
      if (AUTH_DEBUG) {
        const sErr = sanitizeError(err);
        console.warn('[auth] LoginScreen onSubmit:error', { attemptId, username: maskUsername(username), error: sErr });
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
        // Fallback: show an alert for unexpected errors
        Alert.alert('Error', msg);
      }
      focusFirstError();
    } finally {
      // cleanup attempt id after action completes
      setAttemptId(null);
      // keep debugAttemptId visible for a short time (do not clear immediately)
      // optional: leave it so developer can inspect UI; remove in production via AUTH_DEBUG
      setLoading(false);
    }
  };

  // Button press handler: generates an attemptId, logs button press metadata and triggers submit.
  const handleButtonPress = () => {
    const attemptId = genAttemptId();
    // store in-memory only
    setAttemptId(attemptId);
    if (AUTH_DEBUG) {
      console.warn('[auth] LoginButton:press', { attemptId, username: maskUsername(username), canSubmit: !!canSubmit, isDisabled: !!isDisabled });
      setDebugAttemptId(attemptId);
      setDebugMessage('button:press');
    }
    // fire submit (async) and ignore returned promise here
    void onSubmit();
  };

  const canSubmit = !!(username && String(username).trim() && password && password.trim());
  const isDisabled = loading; // disable only while loading; allow validation presses when fields empty

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form} accessibilityLabel="Pantalla de inicio de sesión" accessibilityRole="form">
        <Text style={styles.title} accessibilityRole="header">
          BeanAuditorApp
        </Text>
        <Text style={styles.subtitle}>Inicia sesión</Text>

        <TextInput
          ref={usernameRef}
          style={[styles.input, usernameError ? styles.inputError : null]}
          placeholder="Usuario"
          autoCapitalize="none"
          value={username}
          onChangeText={text => {
            setUsername(text);
            if (usernameError) setUsernameError(null);
          }}
          editable={!loading}
          accessibilityLabel="Campo usuario"
          accessibilityHint="Introduce tu usuario"
          accessibilityState={{ invalid: !!usernameError }}
          returnKeyType="next"
        />
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

        <TextInput
          ref={passwordRef}
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="Contraseña"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={text => {
            setPassword(text);
            if (passwordError) setPasswordError(null);
          }}
          editable={!loading}
          accessibilityLabel="Campo contraseña"
          accessibilityHint="Introduce tu contraseña"
          accessibilityState={{ invalid: !!passwordError }}
          returnKeyType="done"
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <Pressable
          style={[styles.button, !canSubmit ? styles.buttonDisabled : null]}
          onPress={handleButtonPress}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel={loading ? 'Ingresando...' : 'Entrar'}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>
        {AUTH_DEBUG ? (
          <Text accessibilityRole="status" style={styles.debugText}>
            {`DEBUG ${debugAttemptId ? debugAttemptId : ''}${debugMessage ? ' — ' + debugMessage : ''}`}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
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
