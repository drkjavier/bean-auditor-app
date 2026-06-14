---
name: custom-navigation
description: Gestiona la navegación custom sin react-navigation: AppNavigator, BottomNavBar, useWebHistory y estado de navegación con Zustand.
license: MIT
compatibility: opencode
---
# Navegación Custom (sin react-navigation)

## Propósito
Definir los patrones de navegación del proyecto, que usa un sistema propio basado en estado Zustand y componentes condicionales, sin `react-navigation` ni `@react-navigation/*`.

## Cuándo usarlo
- Al agregar, eliminar o reorganizar pantallas o tabs.
- Al modificar el flujo de autenticación y su impacto en navegación.
- Al implementar sincronización con historial del navegador en web.
- Al crear nuevos flujos de navegación (modales, drawers, sub-rutas).

## Alcance
- Cubre: AppNavigator, BottomNavBar, useWebHistory, estado de navegación con Zustand, restauración de sesión.
- No cubre: deep linking nativo, navegación entre apps, ni react-navigation (prohibido en este proyecto).

## Patrón principal

### Arquitectura de navegación
```
AppNavigator (raíz)
├── isRestoring → Loading spinner
├── isLoggedIn=false → LoginScreen
└── isLoggedIn=true → MainScreen
                      └── BottomNavBar (tabs)
                          ├── HomeScreen
                          ├── AuditScreen
                          └── SettingsScreen
```

### AppNavigator — routing condicional
```tsx
// src/presentation/navigation/AppNavigator.tsx
export default function AppNavigator() {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const isRestoring = useAuthStore(state => state.isRestoring);

  useEffect(() => {
    // restoreSession() con timeout de seguridad
    const store = useAuthStore.getState();
    store.restoreSession();
  }, []);

  if (isRestoring) return <LoadingView />;
  return isLoggedIn ? <MainScreen /> : <LoginScreen />;
}
```

### BottomNavBar — tabs con estado
```tsx
// src/presentation/components/BottomNavBar.tsx
const TABS = ['home', 'audit', 'settings'] as const;
type TabKey = typeof TABS[number];

// Estado de tab activo manejado con useState o Zustand
const [activeTab, setActiveTab] = useState<TabKey>('home');

// Renderizado condicional del contenido
{activeTab === 'home' && <HomeScreen />}
{activeTab === 'audit' && <AuditScreen />}
{activeTab === 'settings' && <SettingsScreen />}
```

### useWebHistory — sincronización con URL
```ts
// src/presentation/navigation/useWebHistory.ts
// Sincroniza el tab activo con la URL del navegador en web.
// No-op en native (Platform.OS !== 'web').

useWebHistory(activeTab, (key) => setActiveTab(key as TabKey));

// Al montar: lee la URL inicial y sincroniza el tab.
// Al cambiar tab: pushState actualiza la URL.
// Al presionar back/forward: popstate actualiza el tab.
```

### Agregar una nueva pantalla/tab
1. Crear el screen en `src/presentation/screens/NewScreen.tsx`.
2. Agregar la key al array `TABS` y al tipo `TabKey`.
3. Agregar el renderizado condicional en `MainScreen`.
4. Agregar el ícono en `BottomNavBar` usando `MdiIcon`.
5. Si aplica, agregar la ruta en `useWebHistory` (mapeo path ↔ key).

## Restricciones
- NO instalar ni importar `react-navigation`, `@react-navigation/native` ni ningún paquete relacionado.
- Toda navegación se resuelve con estado (Zustand o useState) y renderizado condicional.
- El timeout de `restoreSession` en AppNavigator es de 5 segundos. No aumentarlo sin justificación.
- En web, siempre sincronizar con `useWebHistory` para que las URLs sean compartibles.
- No usar `navigation.navigate()` ni APIs imperativas de react-navigation.

## Archivos de referencia
- `src/presentation/navigation/AppNavigator.tsx` — Routing raíz
- `src/presentation/navigation/useWebHistory.ts` — Historial web
- `src/presentation/screens/MainScreen.tsx` — Contenedor de tabs
- `src/presentation/components/BottomNavBar.tsx` — Barra de tabs
- `src/state/authStore.ts` — Estado de autenticación (isLoggedIn, isRestoring)
