---
name: fetch-with-auth
description: Define cómo implementar llamadas HTTP autenticadas con fetch nativo, AbortController, refresh single-flight y fetchWithAuth, sin usar axios.
license: MIT
compatibility: opencode
---
# HTTP Autenticado con fetch y AbortController

## Propósito
Estandarizar el patrón de comunicación HTTP con autenticación, cancelación coordinada y refresh de tokens, usando `fetch` nativo y el `AbortManager` del proyecto. No usar axios.

## Cuándo usarlo
- Al crear un nuevo servicio de datos que consume APIs autenticadas.
- Al modificar `fetchWithAuth` o el flujo de refresh de tokens.
- Al implementar cancelación de requests por pantalla o por logout.
- Al depurar errores de autenticación, tokens stale o requests colgados.

## Alcance
- Cubre: `fetchWithAuth`, `AbortManager`, refresh single-flight, `tokenStorage` por plataforma, headers de auth.
- No cubre: lógica de negocio de las APIs, validación de respuestas, transformación de datos (eso va en `data/`).

## Patrón principal

### Consumo básico
```ts
import { fetchWithAuth } from '../../infrastructure/api/fetchWithAuth';
import { createAndRegisterAbortController, unregisterAbortController } from '../../infrastructure/api/abortManager';

// Con AbortController propio (recomendado para pantallas)
const ctrl = createAndRegisterAbortController();
try {
  const resp = await fetchWithAuth('/api/tags', { signal: ctrl.signal });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data;
} finally {
  unregisterAbortController(ctrl);
}
```

### fetchWithAuth — flujo interno
```
1. Crea AbortController si el caller no provee uno (y lo registra en AbortManager).
2. doRefreshIfNeeded(): si el token expira dentro de TOKEN_REFRESH_WINDOW_MS,
   ejecuta refresh single-flight (solo un refresh a la vez, demás callers esperan).
3. Re-lee sesión post-refresh para evitar race conditions.
4. Inyecta header Authorization: Bearer <token> (omite si AUTH_USE_COOKIES=true).
5. Ejecuta fetch(input, fetchInit).
6. En finally: desregistra el AbortController local si fue creado internamente.
```

### AbortManager — cancelación global
```ts
import {
  createAndRegisterAbortController,
  registerAbortController,
  unregisterAbortController,
  abortAllControllers,
} from '../../infrastructure/api/abortManager';

// Registrar al montar pantalla
const ctrl = createAndRegisterAbortController();

// Desregistrar al desmontar
useEffect(() => {
  return () => unregisterAbortController(ctrl);
}, []);

// Logout cancela todo automáticamente (authStore ya llama abortAllControllers)
```

### Refresh single-flight
```
Si múltiples requests detectan token por expirar simultáneamente:
- Solo una ejecuta el refresh HTTP.
- Las demás esperan la misma promesa (ongoingRefresh.promise).
- Si un caller se aborta (logout, navegación), su espera se cancela
  sin afectar el refresh compartido.
```

## Restricciones
- Nunca usar `axios`. El proyecto usa `fetch` nativo exclusivamente.
- Siempre registrar AbortControllers en el AbortManager para que logout pueda cancelarlos.
- Siempre desregistrar AbortControllers en `finally` o en cleanup de `useEffect`.
- No almacenar tokens en variables globales. Siempre leer desde `tokenStorage`.
- `AbortError` debe propagarse, no capturarse silenciosamente (evita tokens stale).

## Archivos de referencia
- `src/infrastructure/api/fetchWithAuth.ts` — Implementación principal
- `src/infrastructure/api/abortManager.ts` — Set de AbortControllers
- `src/infrastructure/api/authApi.ts` — refreshToken, shouldAttemptRefresh
- `src/infrastructure/api/config.ts` — AUTH_BASE_URL, AUTH_USE_COOKIES
- `src/infrastructure/security/tokenStorage.native.ts` — Keychain
- `src/infrastructure/security/tokenStorage.web.ts` — sessionStorage
