import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import HomeScreen from './HomeScreen';
import SettingsScreen from './SettingsScreen';
import AppLayout from '../components/AppLayout';
import DrawerMenu from '../components/DrawerMenu';
import BottomNavBar, { useBottomBarOffset } from '../components/BottomNavBar';
import { useAuthStore } from '../../stores';

// Lazy-load screens that depend on heavy browser-only libraries (react-leaflet,
// leaflet.markercluster). A failed static import of those modules aborts the
// entire module evaluation, preventing constants like ROUTES from being assigned.
// Using React.lazy isolates failures inside a Suspense boundary instead.
const AuditScreen = lazy(() => import('./AuditScreen'));
const MapZoomTest = lazy(() => import('../components/MapZoomTest'));

// MainScreen: contenedor con BottomNavigation reutilizable (BottomNavBar)
// - El footer (BottomNavBar) queda estático en todas las pantallas.
// - El contenido se desplaza por encima del footer sin solaparse.
// - Cada escena NO debe agregar su propio paddingBottom para el footer;
//   esa responsabilidad es exclusiva de este componente.
const ROUTES = [
  { key: 'home', title: 'Inicio' },
  { key: 'audit', title: 'Auditoría' },
  { key: 'settings', title: 'Ajustes' },
] as const;

export default function MainScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const [index, setIndex] = useState(0);
  const bottomBarOffset = useBottomBarOffset();
  const [visited, setVisited] = useState<Record<string, boolean>>({ home: true });
  const [menuOpen, setMenuOpen] = useState(false);

  // Mark initial route as visited on mount
  useEffect(() => {
    setVisited(v => ({ ...v, [ROUTES[index].key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderScene = useCallback(({ routeKey }: { routeKey: string }) => {
    // Only render scenes that were visited (lazy mount) to reduce initial cost
    if (!visited[routeKey]) return null;

    switch (routeKey) {
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
    setVisited(v => ({ ...v, [ROUTES[index].key]: true }));
  }, [index]);

  // If not logged in, don't render content (the App root will show Login)
  if (!isLoggedIn) return null;

  return (
    <AppLayout title="BeanAuditorApp" onMenuPress={() => setMenuOpen(true)}>
      <View style={styles.container}>
        {/*
          Content area: paddingBottom reserves space so content is never
          obscured by the fixed BottomNavBar (position: absolute).
          Scenes MUST NOT add their own bottom padding for the nav bar.
        */}
        <View style={[styles.content, { paddingBottom: bottomBarOffset + 12 }]}>
          <Suspense fallback={<ActivityIndicator size="small" style={styles.loader} />}>
            {renderScene({ routeKey: ROUTES[index].key })}
          </Suspense>
          {/* Dev helper: mount zoom test when on audit tab (only in dev) */}
          {ROUTES[index].key === 'audit' ? (
            <Suspense fallback={<ActivityIndicator size="small" />}>
              <MapZoomTest />
            </Suspense>
          ) : null}
        </View>

        {/* Fixed footer — stays static across all screens */}
        <BottomNavBar
          routes={ROUTES}
          activeIndex={index}
          onTabPress={setIndex}
        />
      </View>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={ROUTES.map(r => ({
          key: r.key,
          title: r.title,
          onPress: () => {
            const idx = ROUTES.findIndex(rr => rr.key === r.key);
            if (idx >= 0) setIndex(idx);
          },
        }))}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1 },
  loader: { flex: 1 },
});
