# AGENTS.md

## Propósito del Proyecto
React Native app with Vite-powered web support que proporciona una aplicación multiplataforma (móvil y web) con un código base compartido. El proyecto busca mantener una arquitectura limpia y escalable siguiendo principios de separación de responsabilidades.

## Propósito de este Archivo
Establecer las directrices de configuración, arquitectura y comportamiento para todos los agentes OpenCode que interactúen con este proyecto, asegurando consistencia, calidad y mantenibilidad en el desarrollo.

## Project
React Native app with Vite-powered web support. Requires Node >=22.11.0.

## Commands
- `npm start` — Start Metro (React Native dev server, default port 8081)
- `npm run android` — Build/run Android
- `npm run ios` — Build/run iOS (first clone/update deps: `bundle install && bundle exec pod install`)
- `npm run web` — Start Vite web dev server (port 3100, config: `vite.config.ts`)
- `npm run lint` — ESLint
- `npm test` — Jest (config: `jest.config.js`, tests in `__tests__/`)

## Config Notes
- Web aliases: `react-native` → `react-native-web` (set in `vite.config.ts`)
- Metro uses default config (`metro.config.js`)
- No other instruction files (`CLAUDE.md`, `.cursorrules`, etc.) present

## Conducta del Agente ante la Incertidumbre
Siempre que el agente no tenga claro un pathway para completar una tarea, debe:
1. Identificar específicamente los puntos de incertidumbre
2. Formular las preguntas mínimas y necesarias para cerrar el gap de conocimiento a cero
3. Esperar aclaraciones antes de proceder con cualquier implementación
4. Utilizar el comando `/prompt` o la skill `reformulacion-prompt` para optimizar sus preguntas siguiendo las mejores prácticas de OpenCode

## OpenCode agents and prompts integration

Este proyecto integra específicamente con las siguientes capacidades de OpenCode:

- **Comando `/prompt`**: Utilícelo para refinar cualquier solicitud del usuario antes de actuar, eliminando ambigüedades y enfocándose en el contexto necesario. Ejemplo: `/prompt "¿Cómo crear un botón reutilizable?"` producirá una versión optimizada que especifica plataforma, estilo y comportamiento esperado.

- **Skills relevantes para este proyecto**:
  - `auditoria-codigo-react-native-vite`: Para revisiones de calidad de código
  - `verificador-config-multiplataforma`: Para asegurar consistencia entre Metro y Vite
  - `ui-assistant`: Para validaciones de accesibilidad y diseño
  - `testing-automatizado`: Para configurar y ejecutar pruebas

- **Integración con opencode.json**: Este archivo referencia configuraciones de agentes en `.opencode/agents/` y debe consultarse cuando se necesite:
  - Ajustar rutas personalizadas de agentes o skills
  - Modificar permisos de acceso a herramientas
  - Configurar MCP servers específicos para React Native

- **Flujo recomendado al usar skills**:
  1. Identificar la skill apropiada para la tarea
  2. Ejecutar la skill con el contexto específico del proyecto
  3. Aplicar las recomendaciones respetando la arquitectura de capas definida
  4. Documentar cambios significativos en el código base

## Agentes OpenCode

| Agente | Modo | Foco |
|---|---|---|
| `frontend-agent` | `all` | Implementación general React/React Native (default). |
| `frontend-ui-agent` | `subagent` | Diseño visual: tokens, tema, íconos, responsividad. |
| `frontend-ux-agent` | `subagent` | Flujos, feedback, microcopy, estados de interfaz. |
| `frontend-accessibility-agent` | `subagent` | WCAG 2.1, ARIA, foco, teclado, lector. |
| `frontend-state-agent` | `subagent` | Zustand, stores, selectores, persistencia. |
| `frontend-architecture-agent` | `subagent` | Capas, separación, deuda arquitectónica. |
| `frontend-performance-agent` | `subagent` | Renders, bundle, lazy, listas, mapas. |
| `frontend-navigation-agent` | `subagent` | Navegación custom, deep links. |
| `frontend-cross-platform-agent` | `subagent` | .native/.web, shims, alias. |
| `frontend-testing-agent` | `subagent` | Jest, mocks, cobertura, snapshots. |
| `frontend-documentation-agent` | `subagent` | JSDoc, README, changelogs. |
| `frontend-security-agent` | `subagent` | Auth, sesión, storage, APIs, datos sensibles. |
| `frontend-uiux-agent` | `subagent` | ⚠️ DEPRECATED — usar triada ui+ux+a11y. |
| `plan-builder` | `all` | Orquestador de planes multi-capa. |
| `orquestador-tareas` | `primary` | Orquesta tareas individuales o simultáneas. |
| `skills-agent` | `subagent` | Crea, audita y mantiene agentes y skills. |

### Protocolo de delegación a la familia `frontend-*`

`frontend-agent` y `plan-builder` deben invocar a los subagentes `frontend-*` según esta matriz. Cada subagente entrega auditoría con severidad y veredicto (`approve` / `adjust` / `require_validation`).

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
- Crear, modificar o eliminar componentes bajo `src/presentation/`
- Implementar lógica de negocio en `src/domain/`
- Modificar acceso a datos en `src/data/`
- Actualizar adaptadores y configuraciones en `src/infrastructure/`
- Gestionar estado global en `src/state/`
- Ejecutar pruebas y validar cobertura
- Utilizar comandos de desarrollo definidos en este archivo
- Aplicar habilidades (skills) de OpenCode relevantes al proyecto
- Optimizar prompts usando `/prompt` o `reformulacion-prompt`
- Consultar y modificar configuraciones en `opencode.json` cuando sea necesario

## Metodología de Trabajo
- **SDD (Spec Design Development)**: Todo cambio, mejora, corrección o nueva funcionalidad debe seguir el flujo SDD:
  1. **Spec (Especificación)**: Definir claramente qué se va a hacer, alcance, criterios de aceptación y restricciones antes de escribir código.
  2. **Design (Diseño)**: Planificar la arquitectura, archivos a modificar/crear, dependencias y estrategia de implementación alineada con las capas del proyecto.
  3. **Development (Desarrollo)**: Implementar los cambios siguiendo el diseño aprobado, ejecutando lint y tests para validar.
- **Reporte de flujo**: Al finalizar cada ajuste o tarea, mostrar un resumen del flujo realizado indicando: spec definida, decisiones de diseño tomadas, archivos modificados/creados, y resultado de validaciones (lint/tests).

## Instrucciones Restringidas
- Modificar archivos de configuración de entorno (.env) o secretos
- Alterar la estructura de capas definida sin justificación documentada
- Introducir dependencias no aprobadas o que generen conflictos de licencia
- Comprometer la seguridad de la aplicación (ej. almacenar tokens en localStorage sin cifrado)
- Ignorar resultados de linting o pruebas fallidas sin resolución
- Crear componentes fuera de las capas definidas sin autorización explícita
- Modificar configuraciones de Metro o Vite sin validar impacto multiplataforma
- Ejecutar comandos que puedan comprometer la integridad del repositorio (ej. git push --force sin revisión)

## Mantenimiento y Evolución del Documento
Este documento será revisado y actualizado cada trimestre por el equipo de arquitectura. Los cambios deben ser propuestos mediante pull request y aprobados por al menos dos miembros senior del equipo. Cualquier desviación temporal de las reglas establecidas debe documentarse claramente con justificación técnica y fecha de revisión.

## Información de Entorno Detallada
- Node.js: >=22.11.0 (requisito mínimo)
- React Native: 0.74.x
- Vite: 5.2.x
- Dependencias críticas: react, react-navigation, zustand, axios
- Variables de entorno requeridas: API_URL, AUTH_TOKEN (en .env.example)

## Ejemplos Concretos
### Estructura de archivos para una feature típica de autenticación:
```
src/
├── presentation/
│   ├── components/
│   │   └── AuthButton.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── navigation/
│   │   └── AuthNavigator.tsx
│   └── themes/
│       └── auth.theme.ts
├── domain/
│   ├── models/
│   │   └── User.model.ts
│   ├── usecases/
│   │   └── LoginUseCase.ts
│   └── services/
│       └── AuthService.ts
├── data/
│   ├── repositories/
│   │   └── AuthRepository.ts
│   └── sources/
│       └── api.auth.source.ts
├── infrastructure/
│   ├── adapters/
│   │   └── api.adapter.ts
│   └── config/
│       └── api.config.ts
├── state/
│   └── auth.store.ts
└── __tests__/
    └── presentation/screens/LoginScreen.test.tsx
```

### Ejemplo de uso de `/prompt`:
En lugar de: "¿Cómo hago un botón?"
Usar: `/prompt "Crear un botón reutilizable en React Native con variante primaria y secundaria, que tenga estados de loading y disabled, siguiendo las guías de accesibilidad WCAG 2.1"`

## Guía para Evolución Arquitectónica
Cuando sea necesario modificar esta estructura:
1. Documentar claramente la limitación actual que motiva el cambio
2. Proponer la nueva estructura con beneficios específicos
3. Evaluar impacto en módulos existentes
4. Implementar cambios de forma incremental
5. Actualizar este documento como parte del proceso de cambio
Las excepciones justificadas deben ser aprobadas por el equipo de arquitectura y documentadas en este archivo con fecha de revisión.

## Composición y ubicación de componentes por el agente

Para toda tarea de creación, refactorización o integración de componentes, el agente debe seguir la siguiente estrategia obligatoria:

- Los componentes, pantallas, hooks, navegación y temas de UI se ubicarán bajo `src/presentation/` en sus respectivas subcarpetas:
  - Reutilizables en `src/presentation/components/`.
  - Pantallas principales en `src/presentation/screens/`.
  - Configuración de navegación en `src/presentation/navigation/`.
  - Estilos y temas globales en `src/presentation/themes/`.
- La lógica de negocio (modelos, casos de uso, servicios) irá bajo `src/domain/`, estrictamente separada de detalles de UI y frameworks.
- Implementaciones concretas de acceso a datos y persistencia en `src/data/`.
- Adaptadores, utilidades, helpers y configuraciones externas en `src/infrastructure/`.
- El manejo de estado global estará en `src/state/`, integrando la gestión según la librería empleada (Redux, Zustand, Context, etc).
- No mezclar código de presentación, dominio o datos fuera de su respectiva capa.
- Las pruebas deberán ubicarse en `__tests__/` o junto al código, bajo políticas del repositorio.

Toda nueva funcionalidad, modificación o refactor asegurará el respeto a esta estructura, fundamentando una arquitectura escalable y mantenible conforme a buenas prácticas de "layered structure".


- El comando `/prompt` replantea cualquier prompt de usuario con estructura optimizada, siguiendo las mejores prácticas de OpenCode.
- El agente `skills-agent` es responsable de crear, auditar y mantener configuraciones de agentes y skills. Todas sus directivas y prácticas se encuentran en `.opencode/agents/skills-agent.md` y requieren respuestas sólo en español, siguiendo las reglas y ejemplos de dicho archivo.
- Consultar `opencode.json` si se desea ajustar las rutas de agentes, skills o comandos personalizados.
