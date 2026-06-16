import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import HomeScreen from './HomeScreen';
import SettingsScreen from './SettingsScreen';
import DrawerMenu from '../components/DrawerMenu';
import BottomNavBar from '../components/BottomNavBar';
import SyncBanner from '../components/SyncBanner';
import { useAuthStore } from '../../stores';

// Lazy-load screens that depend on heavy browser-only libraries (react-leaflet,
// leaflet.markercluster). A failed static import of those modules aborts the
// entire module evaluation, preventing constants like ROUTES from being assigned.
// Using React.lazy isolates failures inside a Suspense boundary instead.
const AuditScreen = lazy(() => import('./AuditScreen'));
const NFCScreen = lazy(() => import('./NFCScreen'));

// MainScreen: contenedor con BottomNavigation reutilizable (BottomNavBar)
// - El footer (BottomNavBar) queda estático en todas las pantallas.
// - El contenido se desplaza por encima del footer sin solaparse.
// - Cada escena NO debe agregar su propio paddingBottom para el footer;
//   esa responsabilidad es exclusiva de este componente.
const ROUTES: { key: string; title: string }[] = [
  { key: 'home', title: 'Inicio' },
  { key: 'audit', title: 'Auditoría' },
  { key: 'nfc', title: 'NFC' },
  { key: 'settings', title: 'Ajustes' },
];

export default function MainScreen() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const [index, setIndex] = useState(0);
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
        return <HomeScreen onNavigate={(key) => {
          const idx = ROUTES.findIndex(r => r.key === key);
          if (idx >= 0) setIndex(idx);
        }} />;
      case 'audit':
        return <AuditScreen />;
      case 'nfc':
        return <NFCScreen />;
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
    <>
      <View style={styles.container}>
        {/* Sync status banner */}
        <SyncBanner />

        {/*
          Content area: flex: 1 takes remaining space above the footer.
          The footer sits in normal flow at the bottom — no absolute positioning.
          This avoids react-native-web's default overflow:hidden clipping.
        */}
        <View style={styles.content}>
          <Suspense fallback={<ActivityIndicator size="small" style={styles.loader} />}>
            {renderScene({ routeKey: ROUTES[index].key })}
          </Suspense>
        </View>

        {/* Fixed footer — sits in normal flex flow at the bottom */}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1 },
  loader: { flex: 1 },
});
