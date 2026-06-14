---
name: posthog-telemetry
description: Integra PostHog (open-source) para analytics de eventos, identificación de usuarios y telemetría en React Native + Vite, con deny-list de PII y compatibilidad multiplataforma.
license: MIT
compatibility: opencode
---
# Telemetría con PostHog (Open-Source)

## Propósito
Integrar PostHog como plataforma de analytics open-source en BeanAuditor, capturando eventos de usuario, identificación y telemetría de forma segura y multiplataforma.

## Cuándo usarlo
- Al agregar nuevos eventos de telemetría a la app.
- Al modificar el flujo de identificación de usuarios (login/logout).
- Al auditar qué eventos se capturan y si contienen PII.
- Al configurar PostHog en un nuevo entorno (dev, staging, producción).

## Alcance
- Cubre: captura de eventos, identificación de usuarios, super properties, flush de eventos, deny-list de PII.
- No cubre: feature flags, A/B testing, session replay (funcionalidades adicionales de PostHog).

## Patrón principal

### Uso básico
```ts
import { logEvent, identifyUser, resetUser } from '../../infrastructure/telemetry';

// Capturar evento
logEvent('tag scanned', { tag_id: '123', method: 'nfc' });

// Identificar usuario después del login
identifyUser('user@example.com', { name: 'Juan', plan: 'free' });

// Resetear en logout
resetUser();
```

### Deny-list de PII
El módulo `telemetry.ts` incluye una deny-list automática que elimina:
- Credenciales: `password`, `pass`, `pwd`, `token`, `access_token`, `refresh_token`
- Datos personales: `email`, `uuid`, `unique_id`
- Ubicación: `lat`, `lng`, `lon`, `latitude`, `longitude`, `coords`, `position`

Los valores se truncan a 256 caracteres máximo.

### Configuración por plataforma

**Native (React Native)**:
- Archivo: `src/infrastructure/analytics/posthog.native.ts`
- Variables: `POSTHOG_API_KEY`, `POSTHOG_HOST`
- En `__DEV__`: PostHog deshabilitado (no envía eventos de test)

**Web (Vite)**:
- Archivo: `src/infrastructure/analytics/posthog.web.ts`
- Variables: `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_HOST`
- En `import.meta.env.DEV`: opt-out de captura

### Variables de entorno
```bash
# .env (native)
POSTHOG_API_KEY=phc_xxxxx
POSTHOG_HOST=https://us.i.posthog.com

# .env (web)
VITE_POSTHOG_API_KEY=phc_xxxxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

## Restricciones
- Nunca enviar PII en eventos (usar deny-list o sanitizar manualmente).
- Nunca capturar tokens, credenciales o datos sensibles.
- Deshabilitar PostHog en desarrollo para no contaminar datos de producción.
- Usar formato "objeto accion" para nombres de eventos (ej: "tag scanned", "user signed up").
- Verificar que las variables de entorno estén configuradas antes de usar PostHog.

## Archivos de referencia
- `src/infrastructure/telemetry.ts` — Wrapper principal con deny-list
- `src/infrastructure/analytics/posthog.native.ts` — Configuración native
- `src/infrastructure/analytics/posthog.web.ts` — Configuración web
- `src/web-shims/posthog-react-native.js` — Shim para Vite
- `vite.config.ts` — Alias de resolución
- `.env.example` — Variables de entorno documentadas
