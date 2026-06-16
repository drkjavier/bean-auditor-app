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

**OBLIGATORIO**: Todo agente debe eliminar la ambigüedad al cero antes de proceder con cualquier implementación, auditoría o análisis.

Siempre que el agente no tenga claro un pathway para completar una tarea, detecte puntos ambiguos, o necesite contexto adicional, debe:

1. **Identificar específicamente** los puntos de incertidumbre o ambigüedad
2. **Formular preguntas interactivas** usando la herramienta `question` en la TUI:
   - Presenta opciones claras cuando sea posible (ej: "¿Prefieres A, B o C?")
   - Usa campo de texto libre cuando la respuesta sea abierta
   - Agrupa preguntas relacionadas en una sola interacción
   - Sé específico y conciso en cada pregunta
3. **Esperar aclaraciones** antes de proceder con cualquier implementación, auditoría o análisis
4. **No asumir** decisiones técnicas, arquitectónicas o de diseño que no estén explícitamente definidas
5. **Utilizar el comando `/prompt`** o la skill `reformulacion-prompt` para optimizar sus preguntas siguiendo las mejores prácticas de OpenCode

**Ejemplos de cuándo preguntar:**
- Alcance no está claramente definido
- Múltiples opciones técnicas viables sin preferencia explícita
- Dependencias o requisitos no especificados
- Comportamiento esperado ambiguo
- Contexto técnico insuficiente para tomar decisiones
- Riesgos potenciales no evaluados

**Ejemplos de cuándo NO preguntar:**
- Decisiones ya definidas en la arquitectura del proyecto
- Convenciones establecidas en el código base
- Tareas triviales con una sola opción obvia
- Información disponible en documentación del proyecto

Objetivo: cerrar el gap de conocimiento a cero antes de escribir cualquier código o emitir cualquier recomendación.

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

| Agente | Modo | Foco | Líneas |
|---|---|---|---|
| `frontend-agent` | `all` | Implementación general React/React Native (default). | 119 |
| `frontend-ui-agent` | `subagent` | Diseño visual: tokens, tema, íconos, responsividad. | 83 |
| `frontend-ux-agent` | `subagent` | Flujos, feedback, microcopy, estados de interfaz. | 86 |
| `frontend-accessibility-agent` | `subagent` | WCAG 2.1, ARIA, foco, teclado, lector. | 85 |
| `frontend-state-agent` | `subagent` | Zustand, stores, selectores, persistencia. | 81 |
| `frontend-architecture-agent` | `subagent` | Capas, separación, deuda arquitectónica. | 89 |
| `frontend-performance-agent` | `subagent` | Renders, bundle, lazy, listas, mapas. | 85 |
| `frontend-navigation-agent` | `subagent` | Navegación custom, deep links. | 83 |
| `frontend-cross-platform-agent` | `subagent` | .native/.web, shims, alias. | 83 |
| `frontend-testing-agent` | `subagent` | Jest, mocks, cobertura, snapshots. | 82 |
| `frontend-documentation-agent` | `subagent` | JSDoc, README, changelogs. | 93 |
| `frontend-security-agent` | `subagent` | Auth, sesión, storage, APIs, datos sensibles. | 90 |
| `plan-builder` | `all` | Orquestador de planes multi-capa. | 145 |
| `orquestador-tareas` | `primary` | Orquesta tareas individuales o simultáneas. | 159 |
| `skills-agent` | `subagent` | Crea, audita y mantiene agentes y skills. | 212 |

### Optimización de Agentes Auditores (2026-06-15)

Los 11 agentes auditores `frontend-*` fueron optimizados para reducir consumo de tokens y mejorar consistencia:

**Cambios realizados:**
- Reducción promedio de 42% en líneas de prompts (de ~145 a ~85 líneas)
- Extracción de protocolo SDD común a skill compartida `sdd-audit-protocol`
- Estandarización de contratos de entrada/salida
- Eliminación de secciones duplicadas (Manejo de dudas, Directorio de trabajo)
- Simplificación de formato de idioma obligatorio

**Total: ~580 líneas de duplicación eliminadas**

**Beneficios:**
- Menor consumo de tokens por interacción
- Mejor consistencia en protocolo de auditoría SDD
- Prompts más claros y accionables
- Mantenimiento simplificado

### Skills Nuevas Creadas (2026-06-15)

Se crearon 8 skills especializadas para mejorar productividad y consistencia:

| Skill | Propósito | Agentes que la usan |
|---|---|---|
| `sdd-audit-protocol` | Protocolo estandarizado de auditoría bidireccional para SDD | Todos los auditores |
| `code-generation-templates` | Plantillas para generación de componentes, screens, hooks, stores | `frontend-agent` |
| `debugging-workflow` | Flujo estructurado de diagnóstico y resolución de problemas | `frontend-agent` |
| `test-coverage-reporter` | Generación de reportes de cobertura con Jest | `frontend-testing-agent` |
| `design-tokens-validator` | Validación de uso correcto de tokens del theme | `frontend-ui-agent` |
| `platform-compatibility-matrix` | Matriz de compatibilidad para APIs multiplataforma | `frontend-cross-platform-agent` |
| `state-migration-helper` | Guía para migración de stores de `src/stores/` a `src/state/` | `frontend-state-agent` |
| `mermaid-diagram-templates` | Plantillas para diagramas de arquitectura en Mermaid | `frontend-documentation-agent` |

**Ubicación:** Todas las skills están en `.opencode/skills/<nombre>/SKILL.md`

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
