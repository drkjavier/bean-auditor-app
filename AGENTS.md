# AGENTS.md

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

## OpenCode agents and prompts integration

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
