---
name: environment-config
description: >
  Gestiona variables de entorno de forma segura y consistente entre Metro (native) y Vite (web).
  Trigger: Al agregar, modificar o auditar variables de entorno en el proyecto.
license: MIT
compatibility: opencode
---
# Environment Config

## Propósito
Administrar variables de entorno de forma segura y consistente entre el bundler nativo (Metro) y el bundler web (Vite), asegurando compatibilidad multiplataforma sin exponer secretos.

## Cuándo usarlo
- Al agregar una nueva variable de entorno al proyecto.
- Al modificar o eliminar una variable de entorno existente.
- Al auditar si una variable está correctamente configurada para ambas plataformas.
- Cuando se requiere leer una variable de entorno en código compartido (native + web).
- Al migrar de `process.env` a `import.meta.env` o viceversa.

## Alcance
- Lectura segura de variables de entorno con patrón `getEnv()`.
- Prefijos permitidos: `VITE_*` (Vite) y `REACT_APP_*` / sin prefijo (Metro).
- Validación de tipos y valores por defecto.
- Nunca incluir secretos reales en `.env` ni en el código fuente.
- Solo aplica a `src/infrastructure/api/config.ts` y archivos que consuman envs.

## Patrón principal

### Patrón `getEnv()` (referencia: `src/infrastructure/api/config.ts`)

```typescript
// Helper to safely read process.env without crashing when process is undefined
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return (process.env as Record<string, string | undefined>)[key];
  }
  return undefined;
};

// Lectura multi-bundler: intenta process.env → import.meta.env → default
export const AUTH_BASE_URL =
  getEnv('AUTH_BASE_URL') ||
  getEnv('REACT_APP_AUTH_BASE_URL') ||
  import.meta.env.VITE_AUTH_BASE_URL ||
  'http://localhost:3000';
```

**Por qué se necesitan los guards `typeof process !== 'undefined'`**:
- En el contexto ESM de Vite (browser), `process` no existe por defecto.
- Sin el guard, el código crashea al evaluar `process.env` en web.
- Metro (Node.js) sí tiene `process` disponible, pero el guard es inocuo.

### Reglas de lectura

| Bundler | Fuente | Prefijo |
|---------|--------|---------|
| Metro (native) | `process.env` | `REACT_APP_*` o sin prefijo |
| Vite (web) | `import.meta.env` | `VITE_*` |

### Variables del proyecto

| Variable | Propósito | Default |
|----------|-----------|---------|
| `AUTH_BASE_URL` | URL base de la API de autenticación | `http://localhost:3000` |
| `AUTH_USE_API` | Habilitar llamadas a API real | `false` |
| `AUTH_USE_COOKIES` | Usar cookies HttpOnly en producción web | `true` |
| `TOKEN_REFRESH_WINDOW_MS` | Ventana de refresh en ms | `30000` |

### Checklist al agregar una variable
1. ¿Necesita ser accesible en ambas plataformas? → Agregar en ambos `getEnv()` e `import.meta.env`
2. ¿Solo es nativa? → Solo `process.env` con guard `getEnv()`
3. ¿Solo es web? → Solo `import.meta.env.VITE_*`
4. ¿El valor por defecto es seguro? → No exponer URLs internas ni credenciales

## Restricciones
- **NUNCA** incluir secretos, tokens o credenciales reales en `.env` ni en el código fuente.
- **NUNCA** hardcodear valores por defecto sensibles (URLs de producción, API keys).
- **SIEMPRE** usar guards `typeof process !== 'undefined'` al acceder a `process.env`.
- **SIEMPRE** registrar la variable en la tabla de variables de AGENTS.md.
- No usar `require()` para acceder a envs en ESM — usar `getEnv()` o `import.meta.env`.
