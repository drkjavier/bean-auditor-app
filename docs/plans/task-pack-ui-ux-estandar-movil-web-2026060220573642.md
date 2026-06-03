# Task Pack de ejecución (para `@.opencode/agents/orquestador-tareas.md`)

## Control
- Plan origen: `docs/plans/plan-ui-ux-estandar-movil-web-2026060220573642.md`
- Objetivo: Ejecutar Phase 0 UI/UX estándar móvil-web con control de dependencias, pausa y reintento.
- Modo recomendado: híbrido (paralelo por lotes + secuencial por dependencias).
- Política: **no alterar el plan sin autorización explícita del usuario**.

---

## 1) Registro inmutable inicial de tareas

> Este bloque debe copiarse tal cual como estado inicial del orquestador.

```yaml
plan_id: ui-ux-phase0-2026060220573642
status: pending
tasks:
  - id: T00
    name: Baseline técnica
    status: pending
    depends_on: []
    agent: general
  - id: T01
    name: Auditoría de seguridad previa (auth/login/session)
    status: pending
    depends_on: [T00]
    agent: frontend-security-agent
  - id: T02
    name: Theme tokens foundation
    status: pending
    depends_on: [T00]
    agent: frontend-agent
  - id: T03
    name: Componente Button
    status: pending
    depends_on: [T02]
    agent: frontend-agent
  - id: T04
    name: Componente Input
    status: pending
    depends_on: [T02]
    agent: frontend-agent
  - id: T05
    name: Componente ErrorBanner
    status: pending
    depends_on: [T02]
    agent: frontend-agent
  - id: T06
    name: Header + AppLayout + DrawerMenu
    status: pending
    depends_on: [T02]
    agent: frontend-agent
  - id: T07
    name: Refactor LoginScreen con nuevos componentes
    status: pending
    depends_on: [T01, T03, T04, T05, T06]
    agent: frontend-agent
  - id: T08
    name: Hardening authStore (bypass/attemptId/logs)
    status: pending
    depends_on: [T01]
    agent: frontend-agent
  - id: T09
    name: Integración MainScreen/AppNavigator con layout estándar
    status: pending
    depends_on: [T06]
    agent: frontend-agent
  - id: T10
    name: Tests unitarios componentes base
    status: pending
    depends_on: [T03, T04, T05]
    agent: frontend-agent
  - id: T11
    name: Tests LoginScreen e integración mínima
    status: pending
    depends_on: [T07, T08]
    agent: frontend-agent
  - id: T12
    name: Ajustes CI/CD (Node 22 + gates)
    status: pending
    depends_on: [T00]
    agent: general
  - id: T13
    name: QA manual multiplataforma + evidencia
    status: pending
    depends_on: [T09, T10, T11, T12]
    agent: frontend-uiux-agent
  - id: T14
    name: Documentación y handoff final
    status: pending
    depends_on: [T13]
    agent: general
```

---

## 2) Lotes de ejecución (dependencias + paralelismo)

### Lote A (secuencial)
1. T00
2. T01

### Lote B (paralelo)
- T02

### Lote C (paralelo, tras T02)
- T03, T04, T05, T06

### Lote D (paralelo controlado)
- T08 (tras T01)
- T09 (tras T06)
- T07 (tras T01+T03+T04+T05+T06)

### Lote E
- T10 (tras T03+T04+T05)
- T11 (tras T07+T08)
- T12 (tras T00)

### Lote F
- T13 (tras T09+T10+T11+T12)

### Lote G
- T14 (tras T13)

---

## 3) Prompts listos por tarea (copiar/pegar en subagentes)

## T00 — Baseline técnica
**Agente:** `general`

**Prompt:**
```
Objetivo: levantar baseline y contexto previo de ejecución para plan UI/UX.
Acciones:
1) Ejecutar en repo raíz: npm run lint, npm test, npm run web (smoke/arranque).
2) Reportar estado inicial (errores, warnings, bloqueos).
3) Confirmar archivos afectados por el plan:
   - src/presentation/screens/LoginScreen.tsx
   - src/presentation/screens/MainScreen.tsx
   - src/presentation/navigation/AppNavigator.tsx
   - src/state/authStore.ts
   - .github/workflows/ci.yml
Salida esperada:
- Resumen baseline y lista de bloqueos.
- Recomendaciones para no romper flujo actual.
No implementar cambios todavía.
```

## T01 — Auditoría de seguridad previa
**Agente:** `frontend-security-agent`

**Prompt:**
```
Audita riesgos de seguridad para el plan UI/UX Phase 0 sobre auth/login/session.
Enfócate en:
1) bypass admin/admin (debe quedar gateado por AUTH_BYPASS + entorno local/dev)
2) exposición de attemptId/debug en UI/logs
3) no loguear password/token
4) restoreSession/logout seguros

Archivos foco:
- src/state/authStore.ts
- src/presentation/screens/LoginScreen.tsx
- src/infrastructure/logging/authDebug.ts
- src/data/auth/AuthRepository.native.ts
- src/data/auth/AuthRepository.web.ts

Devuelve:
- hallazgos (critico/alto/medio/bajo)
- snippets concretos para remediación
- checklist de aprobación previa a merge
```

## T02 — Theme foundation
**Agente:** `frontend-agent`

**Prompt:**
```
Implementa src/presentation/themes/theme.ts con tokens reutilizables:
- colors, spacing, typography, radii, breakpoints.
Mantener naming consistente y uso sencillo en StyleSheet.
No introducir nuevas dependencias.
Salida: archivo creado + breve guía de uso en comentario/doc.
```

## T03 — Button
**Agente:** `frontend-agent`

**Prompt:**
```
Implementa src/presentation/components/Button.tsx.
Requisitos:
- variants: primary, secondary, ghost
- states: loading, disabled, pressed
- accesibilidad: accessibilityRole=button, labels correctos
- hitSlop para touch móvil
Usar tokens de theme.ts.
Incluye test unitario en __tests__/presentation/components/Button.test.tsx.
```

## T04 — Input
**Agente:** `frontend-agent`

**Prompt:**
```
Implementa src/presentation/components/Input.tsx.
Requisitos:
- label + helper/error text
- secureTextEntry opcional + toggle mostrar/ocultar
- props de accesibilidad y retorno teclado
- soporte web autocomplete (username/current-password)
Usar tokens de theme.ts.
Incluye test unitario en __tests__/presentation/components/Input.test.tsx.
```

## T05 — ErrorBanner
**Agente:** `frontend-agent`

**Prompt:**
```
Implementa src/presentation/components/ErrorBanner.tsx.
Requisitos:
- mensaje visible y reusable
- accessibilityRole='status'
- estilo de error consistente con tokens.
Agregar test básico de render condicional.
```

## T06 — Header + AppLayout + DrawerMenu
**Agente:** `frontend-agent`

**Prompt:**
```
Implementa:
- src/presentation/components/Header.tsx
- src/presentation/components/AppLayout.tsx
- src/presentation/components/DrawerMenu.tsx

Requisitos:
- patrón mobile-first (header superior + acción menú)
- soporte web responsive (sidebar/drawer según ancho)
- safe-area compatible
- accesibilidad: roles, foco, navegación teclado en web
- sin librerías nuevas.
```

## T07 — Refactor LoginScreen
**Agente:** `frontend-agent`

**Prompt:**
```
Refactoriza src/presentation/screens/LoginScreen.tsx para usar:
- AppLayout/Header
- Input
- Button
- ErrorBanner

Requisitos funcionales:
- mantener flujo actual de login
- limpiar password en éxito
- toggle mostrar/ocultar contraseña
- validaciones y foco al primer error
- NO loguear password
- debug attemptId solo en dev y enmascarado
```

## T08 — Hardening authStore
**Agente:** `frontend-agent`

**Prompt:**
```
Ajusta src/state/authStore.ts según auditoría T01:
- Implementar helper isDevBypassAllowed() con AUTH_BYPASS + entorno local/dev
- Permitir admin/admin solo cuando bypass permitido
- eliminar bypass genérico para credenciales no válidas
- asegurar logs seguros (maskUsername/sanitizeError)
- mantener compatibilidad con restoreSession/logout
Agregar comentarios mínimos de seguridad.
```

## T09 — Integración Main/AppNavigator
**Agente:** `frontend-agent`

**Prompt:**
```
Integra layout estándar en:
- src/presentation/screens/MainScreen.tsx
- src/presentation/navigation/AppNavigator.tsx

Requisitos:
- mantener guard por isLoggedIn
- mostrar estado restoring consistente
- menú/header/bottom navigation coherentes
- sin romper Home/Audit/Settings.
```

## T10 — Tests componentes base
**Agente:** `frontend-agent`

**Prompt:**
```
Completa pruebas unitarias de componentes base:
- Button
- Input
- ErrorBanner

Cubre estados loading/disabled/error y accesibilidad básica.
Ejecuta npm test y reporta resultados.
```

## T11 — Tests Login e integración auth mínima
**Agente:** `frontend-agent`

**Prompt:**
```
Crear/ajustar tests para LoginScreen y flujo auth mínimo:
- validaciones de campos vacíos
- credenciales inválidas
- éxito con bypass permitido (controlado)
- no exposición de password en logs mockeados
Ejecutar tests y reportar cobertura afectada.
```

## T12 — CI/CD
**Agente:** `general`

**Prompt:**
```
Ajusta workflows:
- .github/workflows/ci.yml
- .github/workflows/security-agent-simulation.yml

Objetivo:
1) alinear Node a >=22.11 (usar 22)
2) mantener lint + test obligatorios
3) agregar validación smoke de web si existe script estable.

Entrega diff y riesgos de compatibilidad.
```

## T13 — QA UI/UX multiplataforma
**Agente:** `frontend-uiux-agent`

**Prompt:**
```
Realiza QA funcional y UI/UX sobre cambios ya integrados:
- Android, iOS, Web responsive
- accesibilidad (roles, foco, contraste, tamaño touch)
- consistencia visual (header, menú, botones, formularios)

Devuelve:
- hallazgos priorizados
- checklists pass/fail
- recomendaciones de pulido final.
```

## T14 — Documentación y cierre
**Agente:** `general`

**Prompt:**
```
Genera cierre de ejecución:
1) actualizar/crear doc breve de componentes en docs/ui-components-phase0.md
2) registrar tareas completadas con evidencia
3) preparar resumen final para PR/handoff

Formato de salida:
- tareas completadas
- pendientes (si aplica)
- riesgos residuales
- próximos pasos.
```

---

## 4) Política de pausa, reintento y recuperación

- Pausar automáticamente si:
  - falla T01 con hallazgo crítico no mitigado,
  - falla T08 (hardening auth),
  - lint/test quedan en rojo tras T10/T11.
- Reintento:
  - máximo 2 reintentos por tarea.
  - reanudar desde la última tarea `completed` del lote.
- Regla de integridad:
  - no avanzar a T13/T14 si T08, T10, T11 o T12 están incompletas.

---

## 5) Criterios de salida del orquestador

El plan se considera ejecutado solo si:
1) Todas las tareas T00..T14 están en `completed`.
2) `npm run lint` y `npm test` pasan.
3) Validación manual Android/iOS/web completada con evidencia.
4) Seguridad aprobada (T01) y hardening aplicado (T08).
5) Se entrega resumen final con diff de archivos y riesgos residuales.

---

## 6) Prompt maestro para `orquestador-tareas`

> Copiar y ejecutar este bloque en `@.opencode/agents/orquestador-tareas.md`.

```md
Ejecuta el plan `ui-ux-phase0-2026060220573642` usando el Task Pack:
`docs/plans/task-pack-ui-ux-estandar-movil-web-2026060220573642.md`

Instrucciones obligatorias:
1. Inicializa registro inmutable con el bloque YAML del Task Pack.
2. Ejecuta por lotes respetando dependencias y paralelismo definido.
3. No modifiques el plan sin autorización explícita.
4. Pausa automática en fallos críticos de seguridad/lint/tests.
5. Reintenta desde la última tarea exitosa (máximo 2 reintentos por tarea).
6. Reporta progreso tras cada lote con: tareas completadas, bloqueadas, siguiente lote.
7. Cierre solo cuando se cumplan criterios de salida (sección 5).

Salida esperada en cada checkpoint:
- Estado del plan
- Tabla de tareas (id, estado, agente, evidencia)
- Riesgos y decisiones
```
