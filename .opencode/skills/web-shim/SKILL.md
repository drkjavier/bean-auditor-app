---
name: web-shim
description: Define cómo crear shims web para módulos nativos de React Native, mapeándolos en vite.config.ts para que Vite no falle en resolución de módulos.
license: MIT
compatibility: opencode
---
# Web Shims para Módulos Nativos

## Propósito
Estandarizar la creación de shims mínimos que reemplazan módulos nativos de React Native cuando el código se ejecuta en web (Vite), evitando errores de resolución de módulos y permitiendo que la app web funcione sin las dependencias nativas.

## Cuándo usarlo
- Al agregar una dependencia nativa que no tiene equivalente en web.
- Al crear un componente que usa APIs nativas y necesita un stub para web.
- Al depurar errores de resolución de módulos en Vite dev server.
- Al auditar si un shim existente es correcto o necesita actualización.

## Alcance
- Cubre: creación de shims en `src/web-shims/`, registro en `vite.config.ts`, stubs mínimos funcionales.
- No cubre: implementaciones completas de APIs nativas en web (usar `.web.tsx` para eso).

## Patrón principal

### Crear un nuevo shim

**1. Crear el archivo shim en `src/web-shims/`**
```js
// src/web-shims/react-native-new-module.js
// Minimal web shim for react-native-new-module
// Provides stub/fallback so Vite doesn't fail on module resolution.
// Must be plain JavaScript (.js) for Vite compatibility.

export const SomeConstant = {
  VALUE_A: 'value_a',
  VALUE_B: 'value_b',
};

export async function doSomething(_param) {
  // In-memory stub or no-op
  return null;
}

export async function getSomething(_options) {
  return false; // or null, depending on expected return type
}

export default { SomeConstant, doSomething, getSomething };
```

**2. Registrar en `vite.config.ts`**
```ts
// vite.config.ts → resolve.alias
// IMPORTANTE: alias específicos ANTES que genéricos.
// react-native → react-native-web va SIEMPRE al final.
{
  find: 'react-native-new-module',
  replacement: path.resolve(__dirname, 'src/web-shims/react-native-new-module.js'),
},
```

**3. Orden de alias en vite.config.ts**
```
1. Alias más específicos primero (codegenNativeComponent)
2. Alias de módulos nativos individuales (keychain, maps, sqlite, etc.)
3. react-native → react-native-web SIEMPRE al final
```

### Reglas para shims efectivos
- **JavaScript puro** (`.js`), no TypeScript. Vite los consume directamente.
- **Exportar solo lo que el módulo nativo exporta**. No agregar APIs inventadas.
- **Stubs mínimos**: devolver `null`, `false`, `[]` o no-op según el tipo de retorno esperado.
- **In-memory si aplica**: para storage, usar `Map()` como fallback temporal.
- **Comentar el propósito**: primera línea del archivo debe explicar qué módulo reemplaza.

## Restricciones
- No instalar la dependencia nativa como dependencia de producción web. El shim reemplaza la necesidad.
- No crear shims que repliquen lógica compleja. Si se necesita comportamiento real en web, usar `.web.tsx` con la librería web correspondiente (ej: `react-leaflet` en vez de shim de `react-native-maps`).
- No modificar el orden de alias en `vite.config.ts` sin validar que los más específicos sigan antes que los genéricos.
- No usar TypeScript en shims. Siempre `.js` plano.

## Shims existentes en el proyecto
| Shim | Reemplaza | Tipo |
|---|---|---|
| `codegenNativeComponent.js` | `react-native/Libraries/Utilities/codegenNativeComponent` | Stub vacío |
| `react-native-keychain.js` | `react-native-keychain` | In-memory Map |
| `react-native-maps.js` | `react-native-maps` | Stub (web usa react-leaflet) |
| `react-native-quick-sqlite.js` | `react-native-quick-sqlite` | Stub (solo native usa SQLite) |
| `react-native-safe-area-context.js` | `react-native-safe-area-context` | Passthrough |

## Archivos de referencia
- `src/web-shims/` — Directorio de shims
- `vite.config.ts` — Registro de alias
- `src/presentation/components/MapCanvas.web.tsx` — Ejemplo de implementación web real (no shim)
