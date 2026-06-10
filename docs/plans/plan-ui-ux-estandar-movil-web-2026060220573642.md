# Plan de implementación

## Control del plan
- Estado: Draft listo para ejecución
- Fecha: 2026-06-02
- Versión: v1.0
- Owner: plan-builder

## Contexto
- Proyecto: BeanAuditorApp (React Native + Vite web)
- Módulo/componente: `src/presentation/*` (Login, Main, navegación), soporte en `src/state/authStore.ts` y validaciones CI
- Objetivo: Estandarizar UI/UX móvil-web con patrones móviles (header, layout, menú, componentes base), manteniendo accesibilidad, seguridad y compatibilidad multiplataforma.
- Resumen del contexto: La app ya tiene Login/Main/Audit/Settings funcionales con estilos inline por pantalla, sin design system central y con navegación simple. Existe bypass `admin/admin` y logging de debug que requiere hardening antes de release. CI usa Node 18/20 aunque el proyecto exige Node >=22.11.0.

## Alcance
- Dentro del alcance: Theme tokens, componentes UI base (Button/Input/ErrorBanner/Header/AppLayout/DrawerMenu), refactor de Login/Main/AppNavigator para usar layout estándar, checklist de accesibilidad, hardening mínimo auth debug/bypass, ajustes de CI para validar cambios.
- Fuera del alcance: Reescritura total de navegación con librerías nuevas, rediseño completo de AuditScreen, cambios profundos de dominio de negocio, cambios productivos en API de autenticación.
- Restricciones: No exponer contraseñas/tokens en logs/UI, respetar arquitectura por capas, mantener compatibilidad Android/iOS/web, evitar dependencias no aprobadas.

## Criterios de éxito
- UI consistente con tokens de tema y layout reutilizable en Login/Main.
- Flujo de login usable y accesible en Android/iOS/web, con errores visibles y seguros.

## Definición de listo
- Baseline levantada (`npm run lint`, `npm test`, `npm run web`) y estado actual documentado.
- Aprobación del scope por producto/UX y seguridad para el bypass dev.

## Definición de hecho
- Componentes base implementados, integrados y cubiertos por tests mínimos.
- CI verde (lint/test) + validación manual en Android/iOS/web + checklist de seguridad completado.

## Supuestos
- Se mantiene enfoque incremental: Phase 0 primero (fundaciones UI/UX), luego fases siguientes.
- El bypass `admin/admin` es temporal para entorno local de pruebas y se gatea explícitamente.

## Dependencias
- Bloqueos previos: Alineación sobre gating final de bypass dev y criterio de release.
- Dependencias internas/externas: Zustand, React Native, react-native-web, react-native-safe-area-context, Keychain/tokenStorage.
- Riesgo de cambio: Medio (toca login/layout y navegación visual, pero no altera lógica de negocio core).

## Handoff
- Entrada requerida: Este plan + baseline actual de código.
- Salida esperada: PR incremental con tareas atómicas completadas, evidencia visual y checklist de validación.
- Agente responsable: `frontend-agent` (implementación) + `frontend-security-agent` (auditoría obligatoria).

## Orden de análisis
1. Base de datos
2. Backend
3. Frontend
4. CI/CD

## Base de datos
- Motor: SQLite nativo (`react-native-quick-sqlite`), tabla `user_session`; web sin DB relacional.
- Impacto: Bajo para UI/UX. No se requieren cambios de esquema para header/menu/estilos.
- Cambios requeridos: Ninguno en esquema. Solo verificar que refactor UI no rompa `restoreSession`/`clearSession`.
- Script/migración:
```sql
-- Sin cambios de esquema para este alcance UI/UX.
-- Mantener migración actual:
-- CREATE TABLE IF NOT EXISTS user_session (id INTEGER PRIMARY KEY NOT NULL, username TEXT NOT NULL, updated_at INTEGER NOT NULL);
```
- Validación previa: Ejecutar login/logout/restore en Android e iOS tras cambios visuales.
- Rollback: Revertir commit de UI (sin rollback de DB requerido).

## Backend
- Tecnologías/arquitectura: Capa local de auth via `AuthRepository.*` + `authApi` (refresh/introspect), sin backend server in-repo.
- Áreas afectadas: Integración login/logout/restore desde UI; contrato de error seguro para usuario final.
- Cambios requeridos: Hardening de bypass dev y sanitización de debug para no exponer datos.
- Tareas atómicas:
  - [B-01] Inventariar puntos auth impactados por UI (`LoginScreen`, `authStore`, `AuthRepository.native/web`).
  - [B-02] Definir helper `isDevBypassAllowed()` (flag `AUTH_BYPASS` + entorno local/dev) y usarlo en `authStore.login`.
  - [B-03] Mantener bypass exclusivo a `admin/admin` y bloquear bypass genérico para otros usuarios.
  - [B-04] Asegurar que password no se loguea en ningún `console.*`; mantener `maskUsername`/`sanitizeError`.
  - [B-05] En éxito de login, limpiar password en UI state inmediatamente.
  - [B-06] Verificar que `logout` limpia estado y sesión persistida sin errores visibles.
  - [B-07] Auditar `restoreSession` para no mostrar trazas sensibles en UI.
- Criterios de aceptación: Sin leaks de password/token en logs, bypass controlado por env local, login/logout/restore funcional.

## Integración backend/frontend
- Puntos de integración: `LoginScreen -> useAuthStore.login`, `AppNavigator -> restoreSession`, `SettingsScreen -> logout`.
- Contratos/APIs afectados: `AuthRepository.signIn/restoreSession/clearSession`, `authDebug` helpers.
- Compatibilidad hacia atrás: Mantener firmas públicas actuales y flujo de navegación (`isLoggedIn` decide Login/Main).

## Frontend
- Tecnologías/arquitectura: React Native + RN Web, Zustand, componentes por capas en `src/presentation`.
- Áreas afectadas: `LoginScreen`, `MainScreen`, `AppNavigator`, nuevos componentes y tema.
- Cambios requeridos: Estandarización visual y estructural con componentes reutilizables + patrón móvil.
- Tareas atómicas:
  - [F-01] Crear `src/presentation/themes/theme.ts` con tokens (color, spacing, typo, radius, breakpoints).
  - [F-02] Crear `src/presentation/components/Button.tsx` (variants, loading, disabled, hitSlop).
  - [F-03] Crear `src/presentation/components/Input.tsx` (label, error, secure toggle, autocomplete web).
  - [F-04] Crear `src/presentation/components/ErrorBanner.tsx` accesible (`accessibilityRole="status"`).
  - [F-05] Crear `src/presentation/components/Header.tsx` con título y acción menú.
  - [F-06] Crear `src/presentation/components/AppLayout.tsx` (SafeArea, header slot, content wrapper).
  - [F-07] Crear `src/presentation/components/DrawerMenu.tsx` (mobile modal/drawer + desktop sidebar simple).
  - [F-08] Refactor `LoginScreen` para usar `Input/Button/ErrorBanner/AppLayout`.
  - [F-09] Agregar visibilidad de contraseña (toggle) en login respetando accesibilidad.
  - [F-10] Mask de `attemptId` en UI debug; mostrar solo en dev (`AUTH_DEBUG && !production`).
  - [F-11] Refactor `MainScreen` para usar `Header` y menú consistente + bottom nav estandarizado.
  - [F-12] Ajustar `AppNavigator` para layout uniforme entre Login/Main y estado restoring.
  - [F-13] Aplicar estados visuales estándar (pressed/disabled/loading/error/success) en componentes nuevos.
  - [F-14] Unificar espaciados/tipografías por tokens y retirar estilos hardcodeados repetidos.
  - [F-15] Validar accesibilidad: foco primer error, labels, hints, roles tab/menu/button correctos.
  - [F-16] Crear documentación breve de uso de componentes (`docs/ui-components-phase0.md`).
- Criterios de aceptación: Consistencia visual entre pantallas, interacción móvil natural (header + menú + bottom nav), accesibilidad base validada, sin regresión funcional.

## CI/CD
- Flujos/reglas: GitHub Actions (`ci.yml` + `security-agent-simulation.yml`), lint + test con cobertura.
- Impacto: Alto para confiabilidad del cambio (UI grande + auth touchpoints).
- Cambios requeridos: Alinear versión Node de CI a requerimiento del proyecto, agregar validaciones de smoke UI.
- Tareas atómicas:
  - [C-01] Actualizar CI principal a Node `22.11.x` (o `22`) en `.github/workflows/ci.yml`.
  - [C-02] Alinear workflow de simulación de seguridad a Node 22.
  - [C-03] Añadir paso de smoke web build/test rápido (si aplica script de build).
  - [C-04] Exigir lint + tests antes de merge (branch protection/manual gate).
  - [C-05] Adjuntar checklist de QA manual (Android/iOS/web) como artefacto en PR template.

## Pruebas
- Estrategia: Unitarias para componentes base + integración básica login + smoke manual multiplataforma.
- Casos críticos:
  - Login vacío -> mensajes de validación + foco correcto.
  - Login `admin/admin` con bypass permitido -> acceso exitoso local.
  - Login no válido sin repo -> mensaje seguro y visible.
  - Toggle password funciona sin exponer valor en logs.
  - Drawer/menu accesible por teclado (web) y touch (mobile).
- Validación manual: Android emulator, iOS simulator, web responsive (mobile/tablet/desktop).
- Automatización: Jest + @testing-library/react-native, lint CI obligatorio.

## Despliegue y rollback
- Plan de despliegue: Merge incremental por fases (Foundation UI -> Integración Login/Main -> Hardening/QA).
- Ventana/orden de release: Primero entorno de pruebas internas, luego release candidate.
- Rollback: Revert por commits atómicos (componentes/layout/auth-hardening separados).
- Señales de verificación post-deploy: tasa de login exitoso en QA, ausencia de errores de sesión, sin alertas de seguridad en logs.

## Arquitectura / diagramas
```text
[AppNavigator]
   ├─(isRestoring)→ [RestoringView]
   └─(isLoggedIn ? Main : Login)
       ├─ [LoginScreen]
       │    ├─ Input(username/password)
       │    ├─ Button(Entrar)
       │    ├─ ErrorBanner
       │    └─ useAuthStore.login(password)
       └─ [MainScreen]
            ├─ Header + DrawerMenu
            ├─ Content(Home/Audit/Settings)
            └─ BottomNav

Auth flow:
LoginScreen -> authStore.login
  -> (dev bypass gateado) OR AuthRepository.signIn
  -> set isLoggedIn
  -> AppNavigator render Main
```

## Plan de ejecución
1) Preparación técnica
   - [E-01] Crear rama `feat/ui-ux-foundation-phase0`.
   - [E-02] Ejecutar baseline (`npm run lint`, `npm test`, `npm run web`).
2) Fundaciones UI
   - [E-03] Implementar `theme.ts`.
   - [E-04] Implementar Button/Input/ErrorBanner.
3) Layout y navegación visual
   - [E-05] Implementar Header/AppLayout/DrawerMenu.
   - [E-06] Integrar en MainScreen/AppNavigator.
4) Login UX + seguridad
   - [E-07] Refactor LoginScreen a componentes nuevos.
   - [E-08] Aplicar hardening bypass/attemptId/password logs.
5) Calidad y entrega
   - [E-09] Añadir/ajustar tests de componentes + login.
   - [E-10] Actualizar workflows CI Node 22.
   - [E-11] QA manual multiplataforma + evidencia visual.
   - [E-12] PR con checklist completo y handoff a revisor.

## Secuencia de trabajo
`F-01 -> (F-02,F-03,F-04) -> (F-05,F-06,F-07) -> (F-08,F-09,F-10) -> (F-11,F-12) -> (B-02,B-03,B-04,B-05) -> (C-01,C-02) -> (Pruebas + QA + PR)`

## Priorización
- Prioridad general: Alta
- Urgencia: Alta (solicitado para pruebas UI inmediatas en móvil/web)
- Estimación: 2 a 4 días hábiles (1 agente), 1.5 a 2.5 días (2 agentes en paralelo)

## Responsables / subagentes
- `frontend-agent`: implementación de componentes/layout/refactors frontend.
- `frontend-security-agent`: auditoría obligatoria de auth/debug/session y recomendaciones de hardening.
- `frontend-uiux-agent`: revisión de accesibilidad, jerarquía visual, responsividad y microinteracciones.

## Riesgos y bloqueos
- R1: Bypass dev accidentalmente activo fuera de local (alto).
- R2: Inconsistencia visual parcial durante migración de componentes (medio).
- R3: Regresión de navegación al introducir DrawerMenu (medio).
- R4: CI con Node desalineado puede dar falsos negativos/positivos (medio).
- Mitigación: commits atómicos, feature flags, auditoría de seguridad previa a merge, QA por plataforma.

## Validaciones
- [V-01] `npm run lint` sin errores.
- [V-02] `npm test` sin regresiones críticas.
- [V-03] Login/logout/restore ok en Android/iOS/web.
- [V-04] `admin/admin` solo funciona con bypass explícitamente habilitado.
- [V-05] No hay logs con password/token ni debug sensible en producción.
- [V-06] Header/menú/tab navigation accesibles por teclado/touch.

## Estado por bloque
- Base de datos: Analizado (sin cambios requeridos)
- Backend: Analizado (hardening puntual requerido)
- Frontend: Analizado (alto impacto, principal foco)
- CI/CD: Analizado (ajustes de Node y gates requeridos)

## Observabilidad
- Métricas/señales: éxito de login, errores de autenticación, tasa de restoreSession exitoso.
- Logs/eventos a revisar: `[auth] LoginScreen onSubmit:*`, `[auth][repo:*] signIn/restore`, eventos de menú/header en telemetry.
- Alertas esperadas: incremento anómalo de errores login, fallos restore en arranque, excepciones de navegación.

## Preguntas pendientes
- ¿Se requiere mantener `admin/admin` también en staging o solo local/dev?
- ¿Se habilita build web formal en CI (script de build) o solo `vite` dev smoke?

## Checklist de ejecución
- [x] Contexto validado
- [x] Dependencias revisadas
- [x] Scripts/listos para aplicar
- [x] Pruebas definidas
- [ ] Despliegue aprobado
- [ ] Rollback preparado

## Entregables
- Plan técnico atómico para UI/UX estándar móvil-web (`docs/plans/plan-ui-ux-estandar-movil-web-2026060220573642.md`).
- Backlog ejecutable por subtareas (DB/Backend/Frontend/CI-CD) con criterios de aceptación y validación.

_Completar con la salida generada por `plan-builder` antes de ejecutar el plan._
