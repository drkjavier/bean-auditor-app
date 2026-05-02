import React, {useState} from 'react';
import {Pressable, StatusBar, StyleSheet, Text, View, Platform} from 'react-native';
import {useAuthStore} from './src/stores/authStore';
import LoginScreen from './src/presentation/screens/LoginScreen';


function HomeTab() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Inicio</Text>
      <Text style={styles.subtitle}>Aquí va el contenido principal</Text>
    </View>
  );
}

function SettingsTab() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Ajustes</Text>
      <Text style={styles.subtitle}>Configuraciones de la aplicación</Text>
    </View>
  );
}

function MainScreen() {
  const logout = useAuthStore(state => state.logout);
  const username = useAuthStore(state => state.username);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');

  // simple app bar state handled in this component for web/native

  const onLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <View style={styles.mainRoot}>
      {menuOpen ? (
        <View style={[styles.menuDropdown, menuAnchor === 'right' ? styles.menuDropdownRight : styles.menuDropdownLeft]}>
          <Pressable style={styles.menuItem} onPress={() => setMenuOpen(false)}>
            <Text>Perfil</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              onLogout();
            }}
          >
            <Text>Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.appBar}>
        <Pressable accessibilityLabel="Abrir menú" style={styles.headerIcon} onPress={() => setMenuOpen(v => !v)}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <View style={styles.appBarTitleContainer}>
          <Text style={styles.appBarTitle}>BeanAuditorApp</Text>
        </View>
        <Pressable accessibilityLabel="Abrir perfil" style={styles.avatar} onPress={() => setMenuOpen(v => !v)}>
          <Text style={styles.avatarText}>{username ? username.charAt(0).toUpperCase() : 'U'}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {activeTab === 'home' ? <HomeTab /> : <SettingsTab />}
      </View>

      <View style={styles.bottomNav}>
        <Pressable style={[styles.navItem, activeTab === 'home' ? styles.navItemActive : null]} onPress={() => setActiveTab('home')}>
          <Text style={styles.navText}>Inicio</Text>
        </Pressable>
        <Pressable style={[styles.navItem, activeTab === 'settings' ? styles.navItemActive : null]} onPress={() => setActiveTab('settings')}>
          <Text style={styles.navText}>Ajustes</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  return (
    <View style={[styles.root, Platform.OS === 'web' ? {minHeight: '100vh'} : undefined]}>
      <StatusBar barStyle="dark-content" />
      {isLoggedIn ? <MainScreen /> : <LoginScreen />}
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
  fieldError: {
    width: '100%',
    maxWidth: 360,
    color: '#dc2626',
    marginBottom: 8,
    marginLeft: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  /* Main view / app bar / bottom nav styles */
  mainRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  appBar: {
    height: 56,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBarTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 8,
  },
  appBarTitleContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  appBarUser: {
    color: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerIcon: {
    paddingHorizontal: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  menuDropdown: {
    position: 'absolute',
    top: 72,
    backgroundColor: '#fff',
    borderRadius: 8,
    // Use CSS boxShadow on web; elevation kept for android
    boxShadow: '0 8px 24px rgba(2,6,23,0.08)',
    elevation: 6,
    paddingVertical: 8,
    minWidth: 140,
    zIndex: 999,
  },
  menuDropdownRight: {
    right: 12,
  },
  menuDropdownLeft: {
    left: 12,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
  },
  tabBar: {
    height: 64,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: '#eef2ff',
  },
  navText: {
    fontWeight: '600',
  },
});
