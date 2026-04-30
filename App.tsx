import React from 'react';
import {Alert, Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {create} from 'zustand';

type AuthState = {
  username: string;
  password: string;
  isLoggedIn: boolean;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  login: () => void;
  logout: () => void;
};

const useAuthStore = create<AuthState>()((set, get) => ({
  username: '',
  password: '',
  isLoggedIn: false,
  setUsername: username => set({username}),
  setPassword: password => set({password}),
  login: () => {
    const {username, password} = get();
    if (username.trim() && password.trim()) {
      set({isLoggedIn: true});
      return;
    }

    Alert.alert('Completa usuario y contraseña');
  },
  logout: () => set({isLoggedIn: false, username: '', password: ''}),
}));

function LoginScreen() {
  const username = useAuthStore(state => state.username);
  const password = useAuthStore(state => state.password);
  const setUsername = useAuthStore(state => state.setUsername);
  const setPassword = useAuthStore(state => state.setPassword);
  const login = useAuthStore(state => state.login);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>BeanAuditorApp</Text>
      <Text style={styles.subtitle}>Inicia sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Usuario"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryButton} onPress={login}>
        <Text style={styles.buttonText}>Entrar</Text>
      </Pressable>
    </View>
  );
}

function HomeScreen() {
  const logout = useAuthStore(state => state.logout);
  const username = useAuthStore(state => state.username);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>BeanAuditorApp</Text>
      <Text style={styles.subtitle}>Bienvenido{username ? `, ${username}` : ''}</Text>

      <Pressable style={styles.secondaryButton} onPress={logout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {isLoggedIn ? <HomeScreen /> : <LoginScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  primaryButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
