# AGENTS.md — Bean Auditor App (Frontend)

> Documento de contexto y reglas para agentes que operan **exclusivamente** sobre el frontend de Bean Auditor.
> Idioma de trabajo del documento: **español**. Idioma del código (identificadores, comentarios, commits): **inglés**.

## Propósito del Proyecto

Aplicación React Native con soporte web vía Vite, que proporciona una app multiplataforma (móvil y web) con código base compartido. Mantiene una arquitectura limpia y escalable basada en separación de responsabilidades por capas.

## Propósito de este Archivo

Establecer las directrices de configuración, arquitectura, clean code y comportamiento para todos los agentes OpenCode que interactúen con este proyecto, permitiendo:
1. **Localizar archivos rápido** (mapa de rutas + índice de búsqueda por intención).
2. **Generar código coherente** con las convenciones de TypeScript/React y la arquitectura de capas.
3. **Respetar las reglas no negociables** (sección "Instrucciones Restringidas").

Para decisiones transversales del workspace (SDD general, estructura global), ver `../AGENTS.md`.

---

## Mapa de rutas (búsqueda rápida)

```
BeanAuditorApp/
├── App.tsx                         # [ENTRY RN] Componente raíz React Native
├── index.js                        # Registro de app (Metro)
├── index.web.jsx                   # Entry web (Vite)
├── vite.config.ts                  # [CONFIG WEB] Alias cross-platform, puerto 3100
├── metro.config.js                 # Config bundler nativo
├── jest.config.js                  # [CONFIG TESTS] preset RN, moduleNameMapper, mocks
├── tsconfig.json                   # Extiende @react-native/typescript-config
├── .eslintrc.js                    # Extiende @react-native
├── .prettierrc.js                  # arrowParens: avoid, singleQuote, trailingComma: all
├── package.json                    # Scripts y dependencias (Node >=22.11.0)
├── android/ · ios/                 # Proyectos nativos
├── public/                         # Estáticos web (sql-wasm.wasm, index)
├── docs/                           # Planes, propuestas, guides
├── specs/                          # [SDD] api/, features/, ui/, _templates/, PROGRESS.md
├── __mocks__/                      # [TESTS] Mocks de módulos nativos
├── __tests__/                      # [TESTS] Tests de la app raíz
└── src/
    ├── presentation/               # CAPA UI
    │   ├── components/             # Componentes reutilizables (Button, Card, MapCanvas, ...)
    │   │   └── nfc/                # Componentes NFC (NfcScanner, NfcTagCard, ...)
    │   ├── screens/                # Pantallas (Login, Home, Audit, NFC, Settings, Main, PullInit)
    │   ├── hooks/                  # Hooks de presentación (useAudit, useNfc, useSync, useTags, useDatabase)
    │   ├── navigation/             # AppNavigator.tsx, useWebHistory.ts
    │   └── themes/                 # theme.ts, ThemeContext.tsx, layout.ts (design tokens)
    ├── domain/                     # CAPA LÓGICA DE NEGOCIO (sin UI, sin frameworks)
    │   ├── audit/                  # AuditRecord.ts, AuditRepository.ts (interfaces)
    │   ├── auth/                   # AuthRepository.ts, AuthSession.ts
    │   ├── farm/                   # Farm.ts, geoUtils.ts, plantingPattern.ts, tagGenerator.ts
    │   ├── nfc/                    # NfcTypes.ts
    │   ├── session/                # SessionInfo.ts, SessionService.ts
    │   ├── sync/                   # PullUseCase, PushUseCase, ConflictResolver, SyncOrchestrator, ISyncApi
    │   ├── user/                   # User.ts
    │   └── constants/              # tagColors.ts
    ├── data/                       # CAPA ACCESO A DATOS (implementaciones por plataforma)
    │   ├── audit/ · auth/ · farm/ · user/    # Repositorios .native.ts / .web.ts
    │   ├── nfc/                    # nfcService(.native).ts, nfcServiceLoader.ts
    │   ├── session/                # SessionRepository.ts
    │   ├── sqlite/                 # db.native.ts, migrations.native.ts
    │   ├── sync/                   # SyncRepository.native.ts / .web.ts
    │   └── mocks/                  # nfcMock.ts, tagsMock.ts
    ├── infrastructure/             # CAPA ADAPTADORES EXTERNOS
    │   ├── api/                    # fetchWithAuth.ts, authApi.ts, syncApi.ts, config.ts, abortManager.ts
    │   ├── analytics/              # posthog.native.ts / .web.ts
    │   ├── config/                 # maptiler.config.ts
    │   ├── connectivity/           # connectivityService.native.ts / .web.ts
    │   ├── logging/                # authDebug.ts (sanitización/masking)
    │   ├── security/               # tokenStorage.native.ts / .web.ts (keychain / storage)
    │   ├── sync/                   # syncService.ts, mockSyncApi.ts
    │   ├── locationService.ts      # Servicio de ubicación
    │   └── telemetry.ts            # Telemetría
    ├── state/                      # ESTADO GLOBAL (Zustand) — destino de migración
    │   ├── authStore.ts · sessionStore.ts · navigationStore.ts
    │   ├── nfcStore.ts · offlineStore.ts · settingsStore.ts · syncStore.ts
    ├── stores/                     # [LEGACY] Stores antiguos, emigrando a state/
    ├── utils/                      # Utilidades (dbInspector.ts)
    ├── web-shims/                  # [CROSS-PLATFORM] Shims de módulos nativos para web
    │   ├── react-native-maps.js · react-native-nfc-manager.js · react-native-quick-sqlite.js
    │   ├── react-native-keychain.js · react-native-safe-area-context.js
    │   ├── react-native-vector-icons/MaterialCommunityIcons.js
    │   └── codegenNativeComponent.js · posthog-react-native.js
    ├── __mocks__/                  # Mocks internos (react-native-keychain.ts)
    └── __tests__/                  # [TESTS] unit, integration, por capa (domain/, state/, components/, screens/)
```

### Índice de búsqueda por intención

| Quiero encontrar... | Ve a... |
|---------------------|---------|
| Un componente de UI reutilizable | `src/presentation/components/` |
| Una pantalla | `src/presentation/screens/` |
| Un hook de presentación | `src/presentation/hooks/` |
| Rutas / navegación / deep links | `src/presentation/navigation/AppNavigator.tsx` |
| Colores, tipografía, espaciados, breakpoint | `src/presentation/themes/theme.ts` |
| Modelo de dominio / interfaz (sin impl.) | `src/domain/<feature>/` |
| Casos de uso (sync, pull, push) | `src/domain/sync/` |
| Implementación de repositorio por plataforma | `src/data/<feature>/*.native.ts` / `*.web.ts` |
| Acceso a SQLite | `src/data/sqlite/` |
| Llamadas HTTP / fetch con auth | `src/infrastructure/api/fetchWithAuth.ts` |
| Almacenamiento seguro de tokens | `src/infrastructure/security/tokenStorage.*.ts` |
| Estado global (login, sync, NFC, settings) | `src/state/<nombre>Store.ts` |
| Adaptador para web de un módulo nativo | `src/web-shims/` |
| Mock de un módulo en tests | `__mocks__/` |
| Especificaciones Gherkin de un cambio | `../gherkin/frontend/` (nuevas specs) |
| Specs históricas (legacy) | `specs/features/`, `specs/api/`, `specs/ui/` |
| Alias entre Metro y Vite | `vite.config.ts` (bloque `resolve.alias`) |

---

## Convenciones de código (TypeScript / React clean code)

### Naming

- **Idioma**: todos los identificadores, nombres de funciones, componentes, tipos, comentarios y commits en **inglés**.
- **Componentes y pantallas**: `PascalCase` (`AuditScreen.tsx`, `MapCanvas.tsx`, `Button.tsx`).
- **Hooks**: `camelCase` con prefijo `use` (`useAudit.ts`, `useNfc.ts`).
- **Stores Zustand**: `camelCase` terminado en `Store` (`authStore.ts`, `syncStore.ts`).
- **Modelos / entidades de dominio**: `PascalCase` sustantivo (`Farm.ts`, `User.ts`, `AuditRecord.ts`).
- **Interfaces de repositorio** (en `domain/`): sustantivo sin prefijo `I` (`AuthRepository.ts`); las **implementaciones** en `data/` se nombran `AuthRepositoryImpl`.
- **Casos de uso**: `PascalCase` terminado en `UseCase` (`PullUseCase.ts`, `PushUseCase.ts`).
- **Utilidades puras**: `camelCase` (`geoUtils.ts`, `tagGenerator.ts`).
- **Constantes**: `UPPER_SNAKE_CASE` para valores; los archivos de tokens/temas en `camelCase` (`theme.ts`).
- **Archivos de test**: `*.test.ts` / `*.test.tsx` dentro de `__tests__/`.
- **Barrel exports**: cada feature de `domain/` expone su API pública desde `index.ts`; importar desde el barrel, no desde el archivo interno.

### Cross-platform (multiplataforma)

- Implementaciones específicas de plataforma usan sufijo `.native.ts(x)` / `.web.ts(x)`; **Vite/Metro resuelven automáticamente** según entorno (orden de extensión en `vite.config.ts`: `.web.*` antes de genéricos).
- Cuando una API nativa no existe en web, **no** condicionar con `Platform.OS` en la UI: crear/actualizar un shim en `src/web-shims/` y registrar el alias en `vite.config.ts`.
- Mantener paridad de firma pública entre `.native` y `.web` para que el resto del código sea agnóstico de plataforma.

### Arquitectura de capas (regla de dependencias)

```
presentation → domain ← data
        ↘      infrastructure      ↗
              state (conecta presentation con domain/data)
```

- `domain/` **no** importa de `presentation/`, `data/` ni `infrastructure/` (es puro).
- `data/` implementa las interfaces definidas en `domain/`.
- `infrastructure/` provee adaptadores (HTTP, storage, analytics, seguridad).
- `state/` orquesta casos de uso; la UI consume estado vía hooks, nunca llama a la API directamente.
- **No mezclar** código de una capa dentro de otra.

### Estilo general

- TypeScript estricto: evitar `any` (usar `unknown` + narrowing). Si se justifica un `as any` (carga dinámica multiplataforma), añadir `eslint-disable` con comentario explicando el porqué.
- Funciones pequeñas y puras cuando sea posible; extraer lógica repetida a `utils/` o al dominio.
- Sin efectos secundarios en render; usar hooks de Zustand/React correctamente.
- Accesibilidad: todo componente interactivo con `accessibilityLabel`/rol cuando aplique (WCAG 2.1).
- `prettier` formatea automáticamente; no pelear con el formatter.

### Ejemplo de estructura de una feature (auth)

```
src/presentation/components/AuthButton.tsx
src/presentation/screens/LoginScreen.tsx
src/presentation/navigation/AuthNavigator.tsx
src/domain/auth/AuthRepository.ts          (interfaz)
src/domain/auth/AuthSession.ts             (modelo)
src/data/auth/AuthRepository.native.ts     (impl nativa)
src/data/auth/AuthRepository.web.ts        (impl web)
src/infrastructure/security/tokenStorage.ts
src/state/authStore.ts
src/__tests__/authStore.test.tsx
```

---

## Comandos

```bash
npm install            # Instalar dependencias (Node >=22.11.0)
npm start              # Metro (RN dev server, puerto 8081)
npm run android        # Build/run Android
npm run ios            # Build/run iOS (1er clone: bundle install && bundle exec pod install)
npm run web            # Vite web dev server (puerto 3100)
npm run build          # Build web (vite build)
npm run preview        # Preview del build web
npm run lint           # ESLint
npm test               # Jest
npm test -- --coverage # Con cobertura
npm test -- LoginScreen.test.tsx   # Test específico
```

---

## Stack

- **Language**: TypeScript 5.8.x · **Node**: >= 22.11.0
- **Framework**: React Native 0.85.2 + React 19.2.3
- **Web**: Vite 8.0.10 + react-native-web 0.21.2
- **State**: Zustand 5.0.12
- **Navigation**: React Navigation 6.x (native-stack + bottom-tabs)
- **Maps**: MapLibre (native), Leaflet + MapTiler (web), react-native-maps
- **DB**: react-native-quick-sqlite (native), sql.js (web)
- **NFC**: react-native-nfc-manager
- **Analytics**: PostHog
- **Tests**: Jest 29.x + @testing-library/react-native
- **Lint/Format**: ESLint (@react-native) + Prettier 2.8.8

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `POSTHOG_API_KEY` / `VITE_POSTHOG_API_KEY` | API key PostHog (native/web) |
| `POSTHOG_HOST` / `VITE_POSTHOG_HOST` | Host PostHog (default http://localhost:8000) |
| `MAPTILER_API_KEY` / `VITE_MAPTILER_API_KEY` | API key MapTiler (native/web) |
| `AUTH_BASE_URL` | Base URL de auth (default http://localhost:3000) |
| `AUTH_USE_COOKIES` | Usar cookies para auth (default true) |
| `TOKEN_REFRESH_WINDOW_MS` | Ventana de refresh de token (default 30000) |

## Notas de configuración

- Alias web: `react-native` → `react-native-web` (en `vite.config.ts`).
- Extensión de resolución: `.web.tsx → .web.ts → .web.jsx → .web.js → .tsx → .ts → .jsx → .js`.
- Metro usa config por defecto (`metro.config.js`).
- No hay otros archivos de instrucción (`CLAUDE.md`, `.cursorrules`, etc.).
- WASM de sql.js se copia a `public/` vía `postinstall`.

---

## Conducta del Agente ante la Incertidumbre

**OBLIGATORIO**: Todo agente debe eliminar la ambigüedad a cero antes de proceder con cualquier implementación, auditoría o análisis.

Cuando no haya claridad sobre un pathway, se detecten puntos ambiguos o falte contexto, el agente debe:

1. **Identificar específicamente** los puntos de incertidumbre o ambigüedad.
2. **Formular preguntas interactivas** con la herramienta `question` en la TUI:
   - Opciones claras cuando sea posible ("¿Prefieres A, B o C?").
   - Campo de texto libre para respuestas abiertas.
   - Agrupar preguntas relacionadas en una sola interacción.
   - Ser específico y conciso.
3. **Esperar aclaraciones** antes de implementar, auditar o analizar.
4. **No asumir** decisiones técnicas, arquitectónicas o de diseño no definidas explícitamente.
5. **Usar `/prompt`** o la skill `reformulacion-prompt` para optimizar preguntas según las mejores prácticas de OpenCode.

**Cuándo preguntar**: alcance no definido, múltiples opciones viables sin preferencia explícita, dependencias no especificadas, comportamiento ambiguo, contexto insuficiente, riesgos no evaluados.

**Cuándo NO preguntar**: decisiones ya definidas en la arquitectura, convenciones establecidas en el código base, tareas triviales con una sola opción obvia, información disponible en documentación del proyecto.

---

## OpenCode agents and prompts integration

- **Comando `/prompt`**: refinar cualquier solicitud del usuario antes de actuar, eliminando ambigüedades. Ej: `/prompt "¿Cómo crear un botón reutilizable?"` → versión optimizada especificando plataforma, estilo y comportamiento.
- **Skills relevantes**: `auditoria-codigo-react-native-vite`, `verificador-config-multiplataforma`, `ui-assistant`, `testing-automatizado`.
- **Integración con `opencode.json`**: referencia configuraciones en `.opencode/agents/`. Consultar para ajustar rutas de agentes/skills, permisos de herramientas o MCP servers de React Native.
- **Flujo recomendado al usar skills**: (1) identificar skill apropiada, (2) ejecutarla con contexto del proyecto, (3) aplicar recomendaciones respetando las capas, (4) documentar cambios significativos.

## Agentes OpenCode

| Agente | Modo | Foco |
|---|---|---|
| `frontend-agent` | `all` | Implementación general React/React Native (default) |
| `frontend-ui-agent` | `subagent` | Diseño visual: tokens, tema, íconos, responsividad |
| `frontend-ux-agent` | `subagent` | Flujos, feedback, microcopy, estados de interfaz |
| `frontend-accessibility-agent` | `subagent` | WCAG 2.1, ARIA, foco, teclado, lector |
| `frontend-state-agent` | `subagent` | Zustand, stores, selectores, persistencia |
| `frontend-architecture-agent` | `subagent` | Capas, separación, deuda arquitectónica |
| `frontend-performance-agent` | `subagent` | Renders, bundle, lazy, listas, mapas |
| `frontend-navigation-agent` | `subagent` | Navegación custom, deep links |
| `frontend-cross-platform-agent` | `subagent` | .native/.web, shims, alias |
| `frontend-testing-agent` | `subagent` | Jest, mocks, cobertura, snapshots |
| `frontend-documentation-agent` | `subagent` | JSDoc, README, changelogs |
| `frontend-security-agent` | `subagent` | Auth, sesión, storage, APIs, datos sensibles |
| `plan-builder` | `all` | Orquestador de planes multi-capa |
| `orquestador-tareas` | `primary` | Orquesta tareas individuales o simultáneas |
| `skills-agent` | `subagent` | Crea, audita y mantiene agentes y skills |

### Optimización de Agentes Auditores (2026-06-15)

Los 11 agentes auditores `frontend-*` fueron optimizados para reducir consumo de tokens y mejorar consistencia:

**Cambios realizados:**
- Reducción promedio de 42% en líneas de prompts (de ~145 a ~85 líneas)
- Extracción de protocolo SDD común a skill compartida `sdd-audit-protocol`
- Estandarización de contratos de entrada/salida
- Eliminación de secciones duplicadas (Manejo de dudas, Directorio de trabajo)
- Simplificación de formato de idioma obligatorio

**Total: ~580 líneas de duplicación eliminadas**

**Beneficios:** menor consumo de tokens por interacción, mejor consistencia en protocolo de auditoría SDD, prompts más claros y accionables, mantenimiento simplificado.

### Skills especializadas (2026-06-15)

Ubicadas en `.opencode/skills/<nombre>/SKILL.md`:

| Skill | Propósito | Agentes que la usan |
|---|---|---|
| `sdd-audit-protocol` | Protocolo estandarizado de auditoría bidireccional para SDD | Todos los auditores |
| `code-generation-templates` | Plantillas para componentes, screens, hooks, stores | `frontend-agent` |
| `debugging-workflow` | Flujo estructurado de diagnóstico y resolución | `frontend-agent` |
| `test-coverage-reporter` | Reportes de cobertura con Jest | `frontend-testing-agent` |
| `design-tokens-validator` | Validación de uso correcto de tokens del theme | `frontend-ui-agent` |
| `platform-compatibility-matrix` | Matriz de compatibilidad para APIs multiplataforma | `frontend-cross-platform-agent` |
| `state-migration-helper` | Migración de stores de `src/stores/` a `src/state/` | `frontend-state-agent` |
| `mermaid-diagram-templates` | Plantillas para diagramas de arquitectura en Mermaid | `frontend-documentation-agent` |

### Protocolo de delegación a la familia `frontend-*`

`frontend-agent` y `plan-builder` deben invocar a los subagentes según esta matriz. Cada subagente entrega auditoría con severidad y veredicto (`approve` / `adjust` / `require_validation`).

| Necesidad | Subagente |
|---|---|
| Tokens, color, tipografía, íconos, responsividad visual | `frontend-ui-agent` |
| Flujos, feedback, microcopy, estados | `frontend-ux-agent` |
| WCAG, ARIA, foco, teclado, touch targets | `frontend-accessibility-agent` |
| Zustand, stores, persistencia, dev-bypass | `frontend-state-agent` |
| Capas, separación, deuda arquitectónica | `frontend-architecture-agent` |
| Renders, bundle, lazy, listas, mapas | `frontend-performance-agent` |
| Navegación, AppNavigator, deep links | `frontend-navigation-agent` |
| .native/.web, shims, alias Vite/Metro | `frontend-cross-platform-agent` |
| Tests, mocks, cobertura, snapshot serializer | `frontend-testing-agent` |
| JSDoc, README, changelogs, diagramas | `frontend-documentation-agent` |
| Auth, sesión, storage, APIs, datos sensibles | `frontend-security-agent` |

## Instrucciones Permitidas
- Crear, modificar o eliminar componentes bajo `src/presentation/`.
- Implementar lógica de negocio en `src/domain/`.
- Modificar acceso a datos en `src/data/`.
- Actualizar adaptadores y configuraciones en `src/infrastructure/`.
- Gestionar estado global en `src/state/`.
- Ejecutar pruebas y validar cobertura.
- Utilizar los comandos de desarrollo definidos en este archivo.
- Aplicar skills de OpenCode relevantes al proyecto.
- Optimizar prompts usando `/prompt` o `reformulacion-prompt`.
- Consultar y modificar `opencode.json` cuando sea necesario.

## Metodología de Trabajo (SDD)
- **SDD (Spec → Design → Development)** obligatorio para todo cambio, mejora, corrección o nueva funcionalidad:
  1. **Spec**: definir qué se va a hacer, alcance, criterios de aceptación y restricciones ANTES de escribir código. **En formato Gherkin** (Feature → Scenario → Given/When/Then), con **happy path** y **sad path** obligatorios. Las nuevas specs se crean en `../gherkin/frontend/{change_request_name_or_description}_{systimestam}.gherkin.md`. Plantilla y reglas de naming en `../AGENTS.md` (sección "Metodología de trabajo (SDD)").
  2. **Design**: planificar arquitectura, archivos a modificar/crear, dependencias y estrategia alineada con las capas.
  3. **Development**: implementar siguiendo el diseño, ejecutando `npm run lint` y `npm test` para validar. Bajo el ciclo obligatorio `generate → guide → verify → solve` (autoridad en `../AGENTS.md`):
     - **generate**: generar el código TS/React.
     - **guide**: aplicar naming, capas, cross-platform (`.native`/`.web` + shims) y clean code de este archivo.
     - **verify**: `npm run lint` + `npm test` + revisión de separación de capas y compatibilidad multiplataforma.
     - **solve**: corregir incumplimientos y repetir el ciclo hasta que `verify` pase sin errores. No se entrega código sin completar el ciclo.
- **Reporte de flujo**: al finalizar, mostrar resumen: spec definida, decisiones de diseño, archivos modificados/creados y resultado de validaciones.
- **Nota (legacy)**: las specs históricas en `specs/` (`api/`, `features/`, `ui/`, `_templates/`, `PROGRESS.md`) quedan como archivo legado; toda spec nueva sigue el formato Gherkin en `../gherkin/frontend/`.

## Instrucciones Restringidas (reglas NO negociables, sin excepción)
El agente **NUNCA** podrá, bajo ninguna circunstancia, hacer lo siguiente. Si una tarea lo exige, debe detenerse y pedir autorización explícita del usuario.
- **No** modificar archivos de entorno (`.env`) ni secretos sin autorización.
- **No** hardcodear tokens, secretos ni API keys en el código.
- **No** almacenar tokens en `localStorage` sin cifrado (usar `src/infrastructure/security/tokenStorage`).
- **No** alterar la estructura de capas definida sin justificación documentada y aprobación.
- **No** crear componentes, hooks o archivos fuera de las capas definidas sin autorización explícita.
- **No** introducir dependencias no aprobadas o con conflicto de licencia.
- **No** ignorar errores de linting ni pruebas fallidas sin resolverlos.
- **No** modificar configuraciones de Metro o Vite sin validar impacto multiplataforma.
- **No** ejecutar comandos que comprometan la integridad del repo (ej. `git push --force`) sin revisión.
- **No** escribir identificadores, comentarios ni commits en un idioma distinto a **inglés**.
- **No** asumir decisiones técnicas, arquitectónicas o de diseño no definidas explícitamente: **PREGUNTAR**.

## Mantenimiento y Evolución del Documento
- Revisado cada trimestre por el equipo de arquitectura.
- Cambios vía pull request y aprobados por al menos dos miembros senior.
- Toda desviación temporal se documenta con justificación técnica y fecha de revisión.
- Cuando sea necesario modificar la estructura: (1) documentar la limitación que motiva el cambio, (2) proponer la nueva estructura con beneficios, (3) evaluar impacto en módulos existentes, (4) implementar de forma incremental, (5) actualizar este documento.
