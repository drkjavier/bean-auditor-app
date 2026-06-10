# PLAN_MEJORAS_PENDIENTES_v2

Resumen
-------
Versión corregida y segura del plan de mejoras. Incluye:
- Correcciones funcionales detectadas (tests, ESLint, configs).
- Medidas de seguridad priorizadas (token storage, refresh, aborts, mocks, barrels).
- Pasos ejecutables, checkpoints y snippets mínimos para aplicar antes de mergear.

Contexto y objetivo
-------------------
Objetivo: estabilizar la base del frontend (lint/tests), migrar stores a `src/state`, aplicar aliases/barrels de forma segura y preparar refactors (AuditScreen), garantizando que no introducimos riesgos de seguridad (tokens expuestos, race conditions, mocks inseguros).

Resumen de cambios frente al plan original
-----------------------------------------
- Se corrigió un test con tag no cerrado (`__tests__/MapCanvas.native.permission.test.tsx`).
- Se añadieron archivos que faltaban en la FASE 1 (lista más abajo).
- Se añadió control explícito para la migración de imports en tests.
- Se corrigió la estrategia para path aliases en Metro y Vite.
- Se incluyeron medidas de seguridad críticas solicitadas por auditoría frontend (token handling, fetchWithAuth, mocks, barrel exports).

Hallazgos de seguridad (priorizados)
-----------------------------------
- Alto
  - Web: tokens en local/sessionStorage → migrar a cookies HttpOnly/secure (coordinar backend).
  - fetchWithAuth: condiciones de carrera en refresh → re-leer sesión tras refresh y propagar AbortError.
- Medio
  - Keychain: confirmar opciones platform-specific (WHEN_UNLOCKED_THIS_DEVICE_ONLY / AndroidKeyStore).
  - Abort manager: evitar doble registro y asegurar unregister en finally.
  - Barrel files: evitar re-exportar internals de `infrastructure/security`.
- Bajo
  - Mocks: sanitizar valores y evitar exposiciones en snapshots/CI.

Ejecución recomendada (orden y checkpoints)
------------------------------------------
Grupo 1 — Estabilización (obligatorio)
1) FASE 1 — ESLint y tests críticos (1-2 h)
   - Corregir: `__tests__/MapCanvas.native.permission.test.tsx` (tag closure).
   - Añadir al scope ESLint: files detectados por `npm run lint` (ver ANALISIS_MEJORAS_PLAN.md).
   - Checkpoint 1: `npm run lint` → 0 errores.

2) FASE 2 — Migración stores (30-60 min)
   - Cambiar imports `src/stores` → `src/state` en todo el repo (código + tests).
   - Mantener `src/stores/index.ts` sólo como wrapper temporal si se desea backward compatibility;
     preferir commitear la migración completa en una PR pequeña.
   - Checkpoint 2: `npm test` → todos los tests pasan.

Grupo 2 — Seguridad y infra (alto impacto)
3) FASE 3 — Fix crítico fetchWithAuth + abortManager (2-3 h)
   - Implementar: re-lectura de sesión tras refresh, manejo explícito de AbortError y asegurarse
     de registrar/unregister controllers una sola vez.
   - Añadir tests que simulen: concurrent fetches + refresh abort.
   - Checkpoint 3: tests específicos pasan.

4) FASE 4 — Token storage web strategy (2-4 h, coordinar backend)
   - No usar localStorage/sessionStorage en producción para tokens.
   - Implementar flag `AUTH_USE_COOKIES=true|false` (env) para habilitar cookies HttpOnly en producción.
   - Checkpoint 4: con `AUTH_USE_COOKIES=true`, cliente usa `credentials: 'include'` y no escribe tokens en storage.

Grupo 3 — Arquitectura y limpieza
5) FASE 5 — Path aliases y Metro/Vite (0.5-1 h)
   - Metro: usar `extraNodeModules` y `watchFolders` (snippet más abajo).
   - Vite: añadir aliases preservando `extensions` y `optimizeDeps.exclude`.
   - Checkpoint 5: `npm run web` y `npm start` funcionan en dev.

6) FASE 6 — Barrel files (0.5 h)
   - Crear barrel files sólo para exports públicos (components/hooks/screens).
   - NO exportar `infrastructure/security` ni internals sensibles.
   - Añadir ESLint rule `no-restricted-imports` (snippet más abajo).
   - Checkpoint 6: `npm run lint` sin errores y no hay importaciones circulares.

7) FASE 7 — Refactor AuditScreen (1.5-3 h)
   - Extraer componentes (MarkModal, TagDetailCard, TagListView, FilterControls).
   - Hacer commits por componente y tests tras cada extracción.
   - Checkpoint 7: `npm test -- AuditScreen` pasa.

8) FASE 8 — .env.example y sanitización de mocks (0.5-1 h)
   - Mantener placeholders y comentarios. NO valores reales.
   - Sanitizar mocks y snapshots (serializer) para esconder tokens.
   - Checkpoint 8: CI logs y snapshots no contienen tokens.

Snippets y cambios críticos (implementación mínima)
-------------------------------------------------
1) Metro config (safe aliases)
```js
// metro.config.js (fragmento)
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  watchFolders: [path.resolve(__dirname, 'src')],
  resolver: {
    extraNodeModules: {
      '@presentation': path.resolve(__dirname, 'src/presentation'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@state': path.resolve(__dirname, 'src/state'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

2) Vite config (preservar settings existentes)
```ts
// vite.config.ts (fragmento)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
      '@presentation': path.resolve(__dirname, 'src/presentation'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@state': path.resolve(__dirname, 'src/state'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  optimizeDeps: {
    exclude: ['@react-navigation/native', '@react-navigation/native-stack', '@react-navigation/bottom-tabs'],
  },
  server: { port: 3100 },
});
```

3) fetchWithAuth: re-lectura de sesión y manejo de AbortError (mínimo)
```ts
// fragmento de fetchWithAuth (conceptual)
try {
  await doRefreshIfNeeded(init?.signal);
} catch (err) {
  if (err?.name === 'AbortError') throw err; // logout/abort -> stop request
  // si falló refresh por otra razón, no usar token antiguo
}

const session = await _getSessionLike();
if (session?.accessToken) {
  headers.set('Authorization', `Bearer ${session.accessToken}`);
}

// ensure abort controller registered only once and unregister in finally
```

4) Token storage web: usar cookies HttpOnly en producción
```ts
// tokenStorage.web.ts (conceptual)
export async function saveTokensWeb(tokens) {
  if (process.env.AUTH_USE_COOKIES === 'true') {
    // no guardar en storage, backend debe Set-Cookie
    return;
  }
  // fallback para dev/tests: sessionStorage
  sessionStorage.setItem('__bean_token', JSON.stringify(tokens));
}

// fetchWithAuth: cuando AUTH_USE_COOKIES=true usar credentials include
fetch(url, { ...opts, credentials: process.env.AUTH_USE_COOKIES === 'true' ? 'include' : 'same-origin' })
```

Nota: migración a cookies requiere coordinar backend para emitir Set-Cookie con flags: HttpOnly; Secure; SameSite=Strict/ Lax según flujo.

5) Token storage native: Keychain example
```ts
// tokenStorage.native.ts (ejemplo mínimo)
import * as Keychain from 'react-native-keychain';
await Keychain.setGenericPassword('oauth', JSON.stringify(tokens), {
  service: 'com.company.app.tokens',
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});
```

6) Abort manager: registro limpio
```ts
// fetchWithAuth pseudocode
const controller = abortManager.createAndRegisterAbortController();
try {
  const resp = await fetch(url, { signal: controller.signal, headers });
  return resp;
} finally {
  abortManager.unregister(controller);
}
```

7) Mocks sanitizados (Jest serializer ejemplo)
```js
// jest.setup.js
expect.addSnapshotSerializer({
  test: val => typeof val === 'string' && /Bearer\s+[A-Za-z0-9\-_.]+/.test(val),
  print: val => val.replace(/Bearer\s+[A-Za-z0-9\-_.]+/, 'Bearer <REDACTED_TOKEN>'),
});

// __mocks__/react-native-keychain.ts -> usar tokens ficticios y no exponer global
export const setTestToken = (t)=>{/* store in module-private var */};
```

8) Barrel files: ESLint rule (no-restricted-imports)
```json
// .eslintrc.json snippet
"no-restricted-imports": [
  "error",
  {
    "paths": [
      { "name": "src/infrastructure/security", "message": "Do not import or re-export security internals." }
    ]
  }
]
```

.env.example mínimo seguro
-------------------------
AUTH_BASE_URL=https://api.example.com # REQUIRED - configurar en CI/entorno
AUTH_USE_COOKIES=false # Set to true when backend supports HttpOnly cookies
TOKEN_REFRESH_WINDOW_MS=30000
NODE_ENV=development
# DO NOT add secrets or real tokens here

Pruebas y linters de seguridad recomendados
-----------------------------------------
- Tests unitarios: simulate concurrent fetch + refresh; assert no stale token used.
- Tests de integración (jest): snapshots con token redaction.
- Lint: rule `no-restricted-imports` y scan de codebase para `localStorage`/`sessionStorage` usos.
- CI: fail if `.env` committed or if snapshots contain token patterns.

PR checklist antes de merge
--------------------------
- [ ] npm run lint -> 0 errors
- [ ] npm test -> all passing
- [ ] Security tests (refresh race, aborts) pass
- [ ] No tokens in snapshots/CI logs
- [ ] .env.example reviewed (no secrets)
- [ ] Metro/Vite dev servers run locally
- [ ] Barrel files do not export infra/security

Estimación de tiempos (por fase)
--------------------------------
- FASE 1 (ESLint/tests): 1-2 h
- FASE 2 (migración stores): 0.5-1 h
- FASE 3 (fetchWithAuth + aborts): 2-3 h
- FASE 4 (web token cookie migration + backend coord): 2-4 h (depende del backend)
- FASE 5 (aliases): 0.5-1 h
- FASE 6 (barrels+ESLint rules): 0.5 h
- FASE 7 (refactor AuditScreen): 1.5-3 h
- FASE 8 (env + mocks sanit): 0.5-1 h

Total estimado: 9-16 horas (dependiente de backend work para cookies)

Bloqueos y riesgos a evaluar antes de proceder
----------------------------------------------
- Si se decide migrar a cookies HttpOnly, es necesario coordinar con backend: Set-Cookie y rutas de refresh; esto puede bloquear cambios web (FASE 4).
- Habilitar `strict` en tsconfig puede generar muchos errores: hacerlo en etapas.

Siguiente paso propuesto
------------------------
1) Aprobas que aplique los cambios críticos de código: fetchWithAuth (re-lectura de sesión + AbortError handling), abortManager unregister en finally y tests asociados (recomendado inmediato).
2) Opcionalmente, aplicar sanitización de mocks y regla ESLint para barrels.

Si apruebas, implemento los parches críticos en una PR pequeña y te doy el diff para revisión.
