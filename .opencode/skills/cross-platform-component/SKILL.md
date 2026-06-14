---
name: cross-platform-component
description: Guía la creación de componentes multiplataforma con extensiones .native/.web, selector de plataforma y fallback, asegurando coherencia entre Metro y Vite.
license: MIT
compatibility: opencode
---
# Componentes Multiplataforma (.native / .web)

## Propósito
Definir el patrón estándar para crear componentes que requieren implementaciones distintas en native (Metro) y web (Vite), usando extensiones de archivo por plataforma, un selector común y un fallback graceful.

## Cuándo usarlo
- Al crear un componente que depende de APIs nativas sin equivalente directo en web (mapas, SQLite, Keychain, safe-area).
- Al agregar una nueva variante de plataforma a un componente existente.
- Al auditar si un componente debería separarse en implementaciones por plataforma.

## Alcance
- Cubre: patrón de 3-4 archivos (selector, .native, .web, fallback), resolución por bundler, lazy loading.
- No cubre: lógica interna de cada implementación (usar skills específicos de la capa correspondiente).

## Patrón principal

### Estructura de archivos
```
src/presentation/components/
├── MyComponent.tsx           # Selector de plataforma (carga dinámica)
├── MyComponent.native.tsx    # Implementación Metro (Android/iOS)
├── MyComponent.web.tsx       # Implementación Vite (browser)
└── MyComponent.fallback.tsx  # Fallback graceful (opcional)
```

### Selector de plataforma (MyComponent.tsx)
```tsx
import React, { useState, useEffect } from 'react';
import { Platform, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type ImplType = React.ComponentType<any> | null;
let cachedImpl: ImplType = null;

function loadImpl(): ImplType {
  if (cachedImpl) return cachedImpl;

  if (Platform.OS === 'web') {
    cachedImpl = () => (
      <View style={styles.placeholder}>
        <Text>Component not available on web</Text>
      </View>
    );
    return cachedImpl;
  }

  try {
    const mod = require('./MyComponent.native');
    cachedImpl = mod.default;
    return cachedImpl;
  } catch {
    try {
      const Fallback = require('./MyComponent.fallback').default;
      cachedImpl = (props: any) => React.createElement(Fallback, props);
      return cachedImpl;
    } catch {
      cachedImpl = () => (
        <View style={styles.placeholder}>
          <Text>Component failed to load</Text>
        </View>
      );
      return cachedImpl;
    }
  }
}

export default function MyComponent(props: any) {
  const [Impl, setImpl] = useState<ImplType>(null);
  useEffect(() => { setImpl(loadImpl()); }, []);

  if (!Impl) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="small" />
      </View>
    );
  }
  return <Impl {...props} />;
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
});
```

### Resolución por bundler
- **Vite**: resuelve `.web.tsx` automáticamente via `resolve.extensions` en `vite.config.ts`. El selector `.tsx` nunca se carga en web.
- **Metro**: resuelve `.native.tsx` automáticamente. El selector `.tsx` actúa como cargador dinámico con fallback.

### Lazy loading para componentes pesados en web
```tsx
// En MainScreen.tsx u otro contenedor
const HeavyMap = React.lazy(() => import('../components/MapCanvas.web'));

<Suspense fallback={<ActivityIndicator />}>
  <HeavyMap {...props} />
</Suspense>
```

## Restricciones
- No importar directamente `.native.tsx` o `.web.tsx` desde código común. Dejar que el bundler resuelva.
- El selector debe ser `.tsx` (sin sufijo de plataforma) para que ambos bundlers lo ignoren cuando existe la variante específica.
- El fallback nunca debe lanzar errores no capturados. Siempre mostrar UI graceful.
- No duplicar lógica de negocio entre `.native` y `.web`. Extraer a `domain/` o `infrastructure/` si es compartida.

## Ejemplos en el proyecto
- `MapCanvas.tsx` / `MapCanvas.native.tsx` / `MapCanvas.web.tsx` / `MapCanvas.fallback.tsx`
- `AuthRepository.native.ts` / `AuthRepository.web.ts` (con interfaz en `domain/`)
- `tokenStorage.native.ts` / `tokenStorage.web.ts`
