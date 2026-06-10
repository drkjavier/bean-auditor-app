import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_BAR_HEIGHT } from '../themes/layout';
import HomeScreen from './HomeScreen';
import AuditScreen from './AuditScreen';
import MapZoomTest from '../components/MapZoomTest';
import SettingsScreen from './SettingsScreen';
import AppLayout from '../components/AppLayout';
import DrawerMenu from '../components/DrawerMenu';
import { useAuthStore } from '../../stores';

// MainScreen: contenedor con BottomNavigation simple (sin dependencias externas)
// - Renderiza tres pestañas y deja que el contenedor superior maneje la protección de sesión
export default function MainScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);

  // If not logged in, don't render content (the App root will show Login)
  if (!isLoggedIn) return null;

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'home', title: 'Inicio' },
    { key: 'audit', title: 'Auditoría' },
    { key: 'settings', title: 'Ajustes' },
  ] as any[]);

  // Lazy-loading renderScene: solo montar la escena la primera vez que se visita.
  const [visited, setVisited] = useState<Record<string, boolean>>({ home: true });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Mark the initial route as visited
    setVisited(v => ({ ...v, [routes[index].key]: true }));
  }, []);

  const renderScene = useCallback(({ route }: { route: any }) => {
    // Only render scenes that were visited (lazy mount) to reduce initial cost
    if (!visited[route.key]) return null;

    switch (route.key) {
      case 'home':
        return <HomeScreen />;
      case 'audit':
        return <AuditScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  }, [visited]);

  // Update visited when index changes (user navigates)
  useEffect(() => {
    setVisited(v => ({ ...v, [routes[index].key]: true }));
  }, [index, routes]);

  const insets = useSafeAreaInsets();
  // Use central NAV_BAR_HEIGHT

  return (
    <AppLayout title="BeanAuditorApp" onMenuPress={() => setMenuOpen(true)}>
      <View style={styles.container} accessibilityRole="tablist">
        {/*
          Content area: reserve space at the bottom so the bottom navigation
          (positioned absolute) doesn't overlap the scenes. Scenes can scroll
          internally if their content overflows.
        */}
        <View style={[styles.content, { paddingBottom: insets.bottom + NAV_BAR_HEIGHT + 12 }]}>
          {renderScene({ route: routes[index] })}
          {/* Dev helper: mount zoom test when on audit tab (only in dev) */}
          {routes[index].key === 'audit' ? <MapZoomTest /> : null}
        </View>

        {/* Bottom navigation is positioned absolute to remain static on screen */}
        <View
          style={[
            styles.bottomBar,
            { height: NAV_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom, zIndex: 100, elevation: 10 },
          ]}
          accessibilityRole="tablist"
          accessibilityLabel="Navegación inferior"
        >
          {routes.map((r, i) => (
            <Pressable
              key={r.key}
              style={[styles.tabItem, index === i ? styles.tabItemActive : null]}
              onPress={() => setIndex(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === i }}
              accessibilityLabel={r.title}
            >
              <Text style={styles.tabTitle}>{r.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={routes.map(r => ({ key: r.key, title: r.title, onPress: () => { const idx = routes.findIndex(rr => rr.key === r.key); if (idx >= 0) setIndex(idx); } }))}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, paddingBottom: 84 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    zIndex: 20,
    elevation: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tabItemActive: { backgroundColor: '#eef2ff' },
  tabTitle: { fontWeight: '600' },
});
