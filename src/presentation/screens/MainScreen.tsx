import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import HomeScreen from './HomeScreen';
import AuditScreen from './AuditScreen';
import MapZoomTest from '../components/MapZoomTest';
import SettingsScreen from './SettingsScreen';
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

  return (
    <View style={styles.container} accessibilityRole="tablist">
      <View style={styles.content}>{renderScene({ route: routes[index] })}</View>
      {/* Dev helper: mount zoom test when on audit tab (only in dev) */}
      {routes[index].key === 'audit' ? <MapZoomTest /> : null}

      <View style={styles.bottomBar} accessibilityRole="tablist">
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1 },
  bottomBar: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tabItemActive: { backgroundColor: '#eef2ff' },
  tabTitle: { fontWeight: '600' },
});
