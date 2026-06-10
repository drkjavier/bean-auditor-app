# Plan de Mejoras Pendientes - BeanAuditorApp

## Estado Actual del Proyecto

### ✅ Completado
- Eliminado código muerto en App.tsx (HomeTab, SettingsTab, MainScreen)
- Corregido bug de runtime: variable `menuAnchor` no definida
- Eliminada clave duplicada en jest.config.js
- Eliminados directorios vacíos (screens/, store/, src/screen/)
- Actualizado AppLayout.tsx para usar SafeAreaView de react-native-safe-area-context
- Creado mock para react-native-quick-sqlite
- Agregado SafeAreaProvider wrapper en todos los tests que lo requerían
- Tests fallidos reducidos de 9 a 2
- Errores de ESLint: algunos corregidos

### 🚧 Estado Actual
- **Tests**: 2 fallidos, 21 pasando (de 23 total)
- **ESLint**: ~164 errores/warnings restantes (reducido desde más de 200)
- **Arquitectura**: Dualidad de stores aún presente (src/stores vs src/state)

---

## FASE 1: Correcciones Críticas de ESLint (Alta Prioridad)

### Objetivo
Eliminar todas las violaciones de ESLint relacionadas con variables no usadas e imports innecesarios.

### Archivos a Corregir

#### 1.1. `src/__mocks__/react-native-keychain.ts`
**Problema**: Parámetro `options` no usado
**Solución**: Renombrar parámetros no usados con prefijo `_`
```typescript
// Línea 10
export const setGenericPassword = async (_username: string, _password: string, _options?: any) => {
  // Línea 15
export const getGenericPassword = async (_options?: any) => {
```

#### 1.2. `src/__tests__/authRefreshAndNavigator.integration.test.tsx`
**Problema**: Imports `AUTH_USE_API` y `AuthSession` no usados
**Solución**: Eliminar líneas 11-12
```typescript
// ELIMINAR:
// import { AUTH_USE_API } from '../infrastructure/api/config';
// import { AuthSession } from '../domain/auth/AuthSession';
```

#### 1.3. `src/data/auth/AuthRepository.native.ts`
**Problemas múltiples**:
- Import `getToken` no usado (línea 3)
- Variables `_` no usadas (líneas 84, 88, 91)
- Comentarios eslint-disable innecesarios (líneas 78, 96, 109, 120)

**Solución**:
```typescript
// Línea 3: Eliminar getToken del import
import { saveToken, getSession } from '../../infrastructure/security/tokenStorage.native';

// Líneas 84, 88, 91: No hace falta acción, ya tienen prefijo _

// Eliminar comentarios eslint-disable que no se usan
```

#### 1.4. `src/data/auth/AuthRepository.web.ts`
**Problema**: Variable `err` no usada (línea 26), comentarios eslint-disable innecesarios
**Solución**:
```typescript
// Línea 26: Renombrar err a _err o eliminar el catch si no se usa
} catch (_err) {
  // ignore in test env
}
```

#### 1.5. `src/data/tagService.ts`
**Problema**: Variables `_` no usadas en líneas 30 y 43
**Solución**: Ya están con prefijo `_`, verificar que el linter los acepte

#### 1.6. `src/infrastructure/api/abortManager.ts`
**Problema**: Variables `_` no usadas (líneas 20, 41)
**Solución**: Ya tienen prefijo correcto, verificar configuración ESLint

#### 1.7. `src/infrastructure/api/authApi.ts`
**Problemas**:
- Parámetro `init` no usado (línea 27)
- Variable `refreshToken` shadowing (línea 27)

**Solución**:
```typescript
// Línea 27: Renombrar parámetro
export async function refreshToken(refreshTokenValue: string, _init?: RequestInit): Promise<RefreshResponse> {
  if (!AUTH_USE_API) throw new Error('Auth API disabled');
  const url = `${AUTH_BASE_URL}/auth/refresh`;
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  }) as Promise<RefreshResponse>;
}
```

#### 1.8. `src/infrastructure/api/fetchWithAuth.ts`
**Problemas múltiples**:
- Imports no usados: `introspectToken`, `AUTH_USE_API` (líneas 1-2)
- Variables no usadas: `e`, `err` (líneas 13, 114, 117)

**Solución**:
```typescript
// Línea 1: Eliminar introspectToken del import
import { refreshToken, shouldAttemptRefresh } from './authApi';

// Línea 2: Eliminar import completo si AUTH_USE_API no se usa

// Líneas 13, 117: Renombrar a _e
} catch (_e) {

// Línea 114: Renombrar a _err
} catch (_err) {
```

#### 1.9. `src/infrastructure/locationService.ts`
**Problema**: Variables `_` no usadas (líneas 42, 99)
**Solución**: Ya tienen prefijo correcto

#### 1.10. `src/infrastructure/logging/authDebug.ts`
**Problema**: Variable `e` no usada (línea 41)
**Solución**:
```typescript
// Línea 41
} catch (_e) {
  return null;
}
```

#### 1.11. `src/infrastructure/security/tokenStorage.native.ts`
**Problemas**:
- Variable `parseErr` no usada (línea 54)
- Comentarios eslint-disable innecesarios

**Solución**:
```typescript
// Línea 54: Renombrar
} catch (_parseErr) {
```

#### 1.12. `src/infrastructure/security/tokenStorage.web.ts`
**Problemas**:
- Variables `_` no usadas (líneas 9, 47)
- Comentarios eslint-disable innecesarios

**Solución**: Renombrar o usar las variables si son necesarias

#### 1.13. `src/data/mocks/tagsMock.ts`
**Problema**: Uso de operadores bitwise (líneas 26-27)
**Solución**: Agregar comentario eslint-disable específico o refactorizar
```typescript
// eslint-disable-next-line no-bitwise
const h = ((color & 0xFF0000) >>> 16);
```

---

## FASE 2: Migración de Stores y Limpieza Arquitectónica (Alta Prioridad)

### Objetivo
Consolidar la gestión de estado eliminando la dualidad entre `src/stores` y `src/state`.

### 2.1. Migrar imports de `src/stores` a `src/state`

**Archivos que importan desde src/stores**:
1. `src/presentation/screens/AuditScreen.tsx` (línea 11)
2. `src/presentation/screens/MainScreen.tsx` (línea 11)
3. `src/presentation/screens/LoginScreen.tsx` (línea 12)
4. `src/presentation/screens/SettingsScreen.tsx` (línea 3)
5. `src/presentation/navigation/AppNavigator.tsx` (línea 5)

**Cambio necesario**:
```typescript
// ANTES:
import { useAuthStore } from '../../stores';

// DESPUÉS:
import { useAuthStore } from '../../state/authStore';
```

### 2.2. Eliminar directorio `src/stores/`

**Comando**:
```bash
rm -rf src/stores/
```

**Verificar** que no haya imports rotos ejecutando:
```bash
npm run lint
```

---

## FASE 3: TypeScript y Path Aliases (Prioridad Media)

### Objetivo
Mejorar la experiencia de desarrollo con path aliases y configuración TypeScript más estricta.

### 3.1. Actualizar `tsconfig.json`

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["jest"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@presentation/*": ["src/presentation/*"],
      "@domain/*": ["src/domain/*"],
      "@data/*": ["src/data/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@state/*": ["src/state/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/Pods", "**/__tests__", "**/__mocks__"]
}
```

### 3.2. Configurar Metro para path aliases

Actualizar `metro.config.js` para soportar los aliases:
```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          if (name === '@presentation') {
            return `${__dirname}/src/presentation`;
          }
          if (name === '@domain') {
            return `${__dirname}/src/domain`;
          }
          if (name === '@data') {
            return `${__dirname}/src/data`;
          }
          if (name === '@infrastructure') {
            return `${__dirname}/src/infrastructure`;
          }
          if (name === '@state') {
            return `${__dirname}/src/state`;
          }
          return target[name];
        },
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### 3.3. Configurar Vite para path aliases

Actualizar `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@presentation': path.resolve(__dirname, 'src/presentation'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@state': path.resolve(__dirname, 'src/state'),
    },
  },
  server: {
    port: 3100,
  },
});
```

### 3.4. Actualizar Jest para path aliases

Actualizar `jest.config.js`:
```javascript
module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-vector-icons/MaterialCommunityIcons$': '<rootDir>/__mocks__/MaterialCommunityIcons.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^react-native-geolocation-service$': '<rootDir>/__mocks__/geolocation.js',
    '^@react-native-community/geolocation$': '<rootDir>/__mocks__/geolocation.js',
    '^react-native-permissions$': '<rootDir>/__mocks__/react-native-permissions.js',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@state/(.*)$': '<rootDir>/src/state/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|react-navigation' +
      '|@react-native-community' +
      '|@react-native-picker' +
      '|@react-native/async-storage' +
      '|react-native-safe-area-context' +
      '|@react-native-masked-view' +
      '|@react-native-segmented-control' +
      '|react-clone-referenced-element' +
      ')/)'
  ],
};
```

---

## FASE 4: Barrel Files y Exports Limpios (Prioridad Media)

### Objetivo
Facilitar imports mediante archivos barrel (index.ts) en cada capa.

### 4.1. Crear `src/presentation/components/index.ts`

```typescript
export { default as AppLayout } from './AppLayout';
export { default as Button } from './Button';
export { default as ColorCombobox } from './ColorCombobox';
export { default as DatePickerInput } from './DatePickerInput';
export { default as DrawerMenu } from './DrawerMenu';
export { default as ErrorBanner } from './ErrorBanner';
export { default as Header } from './Header';
export { default as Input } from './Input';
export { default as MapCanvas } from './MapCanvas';
export { default as TouchableLongPress } from './TouchableLongPress';
```

### 4.2. Crear `src/presentation/screens/index.ts`

```typescript
export { default as AuditScreen } from './AuditScreen';
export { default as HomeScreen } from './HomeScreen';
export { default as LoginScreen } from './LoginScreen';
export { default as MainScreen } from './MainScreen';
export { default as SettingsScreen } from './SettingsScreen';
```

### 4.3. Crear `src/presentation/themes/index.ts`

```typescript
export { default as theme } from './theme';
export { default as layout } from './layout';
export { NAV_BAR_HEIGHT } from './layout';
```

### 4.4. Crear `src/state/index.ts`

```typescript
export { useAuthStore } from './authStore';
export { useSettingsStore } from './settingsStore';
```

### 4.5. Crear `src/domain/index.ts`

```typescript
export type { AuthRepository } from './auth/AuthRepository';
export type { AuthSession } from './auth/AuthSession';
```

---

## FASE 5: Refactorización de AuditScreen (Prioridad Media)

### Objetivo
Dividir AuditScreen.tsx (439 líneas) en componentes más pequeños y manejables.

### 5.1. Extraer `FilterControls.tsx`

**Ubicación**: `src/presentation/components/FilterControls.tsx`

**Responsabilidad**: Renderizar todos los controles de filtrado (color, fecha, auditoría)

**Props**:
```typescript
type FilterControlsProps = {
  colorFilter?: string;
  auditedFilter?: boolean;
  from: string;
  to: string;
  dateRangeError: string | null;
  activeFiltersSummary: string;
  loading: boolean;
  onColorChange: (color?: string) => void;
  onAuditedChange: (audited?: boolean) => void;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onReload: () => void;
};
```

### 5.2. Extraer `TagDetailCard.tsx`

**Ubicación**: `src/presentation/components/TagDetailCard.tsx`

**Responsabilidad**: Mostrar detalles del tag seleccionado

**Props**:
```typescript
type TagDetailCardProps = {
  tag: Tag | null;
};
```

### 5.3. Extraer `TagListView.tsx`

**Ubicación**: `src/presentation/components/TagListView.tsx`

**Responsabilidad**: FlatList de tags con selección y long press

**Props**:
```typescript
type TagListViewProps = {
  items: Tag[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  listRef?: React.RefObject<FlatList<Tag>>;
};
```

### 5.4. Extraer `MarkModal.tsx`

**Ubicación**: `src/presentation/components/MarkModal.tsx`

**Responsabilidad**: Modal para marcar/desmarcar auditoría

**Props**:
```typescript
type MarkModalProps = {
  visible: boolean;
  onClose: () => void;
  onMarkAudited: () => void;
  onMarkUnaudited: () => void;
};
```

### 5.5. Refactorizar `AuditScreen.tsx`

Después de extraer componentes, `AuditScreen.tsx` debe quedar en ~150 líneas, enfocado en:
- Gestión de estado
- Lógica de filtrado
- Coordinación entre componentes hijos

---

## FASE 6: Archivos de Configuración (Prioridad Baja)

### 6.1. Crear `.env.example`

```env
# API Configuration
AUTH_BASE_URL=http://localhost:3000
AUTH_USE_API=false

# React App (for web with Vite)
REACT_APP_AUTH_BASE_URL=http://localhost:3000
REACT_APP_AUTH_USE_API=false

# Environment
NODE_ENV=development

# Token Configuration
TOKEN_REFRESH_WINDOW_MS=30000
```

### 6.2. Crear `.env` (no commitearlo)

```bash
cp .env.example .env
```

Agregar `.env` a `.gitignore` si no está:
```
.env
.env.local
```

---

## FASE 7: Mejoras de Accesibilidad y UX (Prioridad Baja)

### 7.1. Mejorar `Input.tsx`

Agregar `accessibilityRole`:
```typescript
<TextInput
  {...rest}
  ref={ref}
  secureTextEntry={!visible}
  style={[styles.input, style as any]}
  accessibilityLabel={a11yLabel}
  accessibilityRole="text"
  testID={testID}
/>
```

### 7.2. Remover `MapZoomTest` de producción

En `src/presentation/screens/MainScreen.tsx`, línea 72:
```typescript
// ELIMINAR O ENVOLVER EN __DEV__:
{__DEV__ && routes[index].key === 'audit' ? <MapZoomTest /> : null}
```

---

## FASE 8: Verificación Final (Crítico)

### 8.1. Ejecutar linter

```bash
npm run lint
```

**Esperado**: 0 errores, 0 warnings

### 8.2. Ejecutar tests

```bash
npm test
```

**Esperado**: Todos los tests pasando

### 8.3. Verificar builds

```bash
# Web
npm run web

# Metro (React Native)
npm start
```

---

## Orden de Ejecución Recomendado

1. **FASE 1** (1-2 horas): Corregir todos los errores de ESLint
2. **FASE 2** (30 min): Migrar stores
3. **Verificar tests**: `npm test`
4. **FASE 3** (1 hora): Configurar path aliases
5. **FASE 4** (30 min): Crear barrel files
6. **Actualizar imports** para usar barrel files (opcional pero recomendado)
7. **FASE 5** (2 horas): Refactorizar AuditScreen
8. **FASE 6** (15 min): Archivos de configuración
9. **FASE 7** (30 min): Mejoras de accesibilidad
10. **FASE 8** (15 min): Verificación final completa

---

## Notas Importantes

- **No modificar lógica de negocio** durante las refactorizaciones
- **Ejecutar tests después de cada fase** para detectar regresiones temprano
- **Commitear después de cada fase completada** para facilitar rollback si es necesario
- **Los path aliases son opcionales** pero mejoran significativamente la DX
- **Priorizar las fases 1 y 2** para estabilizar el proyecto antes de optimizaciones

---

## Comandos Útiles

```bash
# Linter
npm run lint

# Tests
npm test

# Tests en watch mode
npm test -- --watch

# Tests con cobertura
npm test -- --coverage

# Web dev server
npm run web

# Metro bundler
npm start

# Android
npm run android

# iOS
npm run ios
```

---

## Contacto y Soporte

Este plan fue generado después de un análisis profundo del proyecto.
Para dudas o aclaraciones, consultar `AGENTS.md` y la documentación en `/docs`.
