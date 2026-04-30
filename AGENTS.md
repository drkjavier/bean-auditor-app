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

- El comando `/prompt` replantea cualquier prompt de usuario con estructura optimizada, siguiendo las mejores prácticas de OpenCode.
- El agente `skills-agent` es responsable de crear, auditar y mantener configuraciones de agentes y skills. Todas sus directivas y prácticas se encuentran en `.opencode/agents/skills-agent.md` y requieren respuestas sólo en español, siguiendo las reglas y ejemplos de dicho archivo.
- Consultar `opencode.json` si se desea ajustar las rutas de agentes, skills o comandos personalizados.
