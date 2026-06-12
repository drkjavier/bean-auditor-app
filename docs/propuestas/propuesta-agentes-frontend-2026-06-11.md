# Propuesta: Agentes Frontend Especializados (2026-06-11)

> **Origen:** Generada por `agents-maintainer` el 2026-06-11.
> **Estado:** Aprobada para ejecución por `skills-agent`.
> **Plan de ejecución:** `docs/plans/plan-skills-agent-tasks-20260611222114.md`.

---

## Diagnóstico

El `frontend-agent` actual delega en muy pocos subagentes (`frontend-uiux-agent` que mezcla UI+UX, y `frontend-security-agent`). Esto provoca:

- **UI y UX fusionadas**: revisiones superficiales porque el agente cubre 3 disciplinas en 12 steps.
- **Sin agentes de state, architecture, performance, testing, navigation, cross-platform, accessibility dedicada, documentation**.
- **`plan-builder` no tiene auditores técnicos frontend** a quién consultar durante su análisis (paso 3 de DB→backend→frontend→CI/CD).
- **Roadmap NFC** (lectura, escritura, bloqueo por PIN, bloqueo definitivo) exige mayor granularidad.

## Filosofía

- Separación de responsabilidades.
- Permisos mínimos.
- Contratos E/S explícitos.
- Modo `subagent` por defecto con excepciones.
- Idioma español.
- Respeto estricto de capas.

## Matriz propuesta (10 agentes)

| # | Agente | Modo | Color | Cuándo |
|---|---|---|---|---|
| 1 | `frontend-ui-agent` | subagent | `#7C3AED` | Diseño visual, tokens, tema |
| 2 | `frontend-ux-agent` | subagent | `#EC4899` | Flujos, feedback, microcopy |
| 3 | `frontend-accessibility-agent` | subagent | `#0EA5E9` | WCAG 2.1, ARIA, foco |
| 4 | `frontend-state-agent` | subagent | `#F59E0B` | Zustand, stores, persistencia |
| 5 | `frontend-architecture-agent` | subagent | `#10B981` | Capas, separación, deuda |
| 6 | `frontend-performance-agent` | subagent | `#EF4444` | Renders, bundle, lazy |
| 7 | `frontend-navigation-agent` | subagent | `#6366F1` | AppNavigator, deep links |
| 8 | `frontend-cross-platform-agent` | subagent | `#14B8A6` | .native/.web, shims |
| 9 | `frontend-testing-agent` | subagent | `#22C55E` | Jest, mocks, cobertura |
| 10 | `frontend-documentation-agent` | subagent (edit .md) | `#64748B` | JSDoc, README, changelogs |

## Decisión sobre `frontend-uiux-agent`

- Marcar como **deprecated** en AGENTS.md y opencode.json.
- Mantener el archivo 1 sprint para no romper auditoría de planes antiguos.
- Eliminar en el próximo sprint.

## Orden de implementación

- **Fase 1 (MVP, 5 agentes):** ui, ux, accessibility, state, architecture.
- **Fase 2 (refuerzo, 5 agentes):** performance, navigation, cross-platform, testing, documentation.

Cada fase se cierra con un commit separado (sin push). Validación YAML + JSON entre fases.
