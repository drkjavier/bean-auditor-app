# Plan de tareas: Cierre de gaps en skills

**Agente ejecutor**: `skills-agent`
**Fecha**: 2026-06-11
**Contexto**: Análisis de cobertura de skills vs patrones del proyecto BeanAuditorApp (React Native + Vite). Se identificaron 8 gaps que deben cerrarse.

---

## Tarea 1 — Crear skill `environment-config` (GAP G01, severidad ALTA)

**Acción**: Crear nuevo skill en `.opencode/skills/environment-config/SKILL.md`

**Contexto del proyecto**:
- Archivo clave: `src/infrastructure/api/config.ts`
- Variables: `AUTH_BASE_URL`, `AUTH_USE_API`, `AUTH_USE_COOKIES`, `TOKEN_REFRESH_WINDOW_MS`
- Patrón: `getEnv()` con guards `typeof process !== 'undefined'` para compatibilidad Vite/Metro
- Vite usa `import.meta.env.VITE_*`, Metro usa `process.env`
- `.env` nunca debe contener secretos reales

**Estructura del skill**:
- Propósito: Gestionar variables de entorno de forma segura y consistente entre Metro (native) y Vite (web)
- Cuándo usarlo: Al agregar, modificar o auditar variables de entorno
- Alcance: Lectura segura de envs, patron `getEnv()`, prefijos `VITE_` vs `REACT_APP_`, validación de tipos
- Patrón principal: Mostrar el patron `getEnv()` de config.ts como referencia, explicar por qué se necesitan guards, mostrar como leer envs en Vite vs Metro
- Restricciones: Nunca exponer secretos, nunca hardcodear valores por defecto sensibles, siempre usar guards typeof

**Referencia**: `src/infrastructure/api/config.ts` (42 líneas)

---

## Tarea 2 — Crear skill `local-database` (GAP G02, severidad MEDIA)

**Acción**: Crear nuevo skill en `.opencode/skills/local-database/SKILL.md`

**Contexto del proyecto**:
- Archivos clave: `src/data/sqlite/db.native.ts`, `src/data/sqlite/migrations.native.ts`
- Librería: `react-native-quick-sqlite` (solo native, sin equivalente web)
- Web shim: `src/web-shims/react-native-quick-sqlite.js` (stub vacío)
- Patrón: `open()` → `execute()` → `queryRows()` con normalización de resultados
- Migraciones: `runMigrations()` idempotente con `CREATE TABLE IF NOT EXISTS`

**Estructura del skill**:
- Propósito: Guiar la creación y mantenimiento de base de datos local SQLite en native
- Cuándo usarlo: Al crear tablas, migraciones, queries o servicios que usen SQLite
- Alcance: Solo native (`.native.ts`), requiere web shim, migraciones idempotentes
- Patrón principal: Mostrar patron de db.native.ts (open, execute, queryRows, normalizeRows), patron de migraciones
- Restricciones: Solo en `src/data/sqlite/`, nunca en web sin shim, migraciones siempre idempotentes, nunca exponer datos sensibles en logs

**Referencia**: `src/data/sqlite/db.native.ts` (42 líneas), `src/data/sqlite/migrations.native.ts` (31 líneas)

---

## Tarea 3 — Crear skill `nfc-integration` (GAP G03, severidad MEDIA)

**Acción**: Crear nuevo skill en `.opencode/skills/nfc-integration/SKILL.md`

**Contexto del proyecto**:
- Roadmap NFC: lectura → escritura → bloqueo por PIN → bloqueo definitivo
- No hay código NFC implementado aún (es roadmap futuro)
- Stack: React Native, librería NFC por definir (probablemente `react-native-nfc-manager`)

**Estructura del skill**:
- Propósito: Guiar la integración de funcionalidades NFC en la app
- Cuándo usarlo: Al implementar lectura, escritura, bloqueo por PIN o bloqueo definitivo de NFC cards
- Alcance: Flujos NFC, permisos, manejo de errores NFC, integración con UI
- Patrón principal: Framework de alto nivel para cada operación NFC (leer, escribir, bloquear), con manejo de errores y estados de UI
- Restricciones: Solo native (NFC no funciona en web), permisos explícitos, manejo de errores NFC específicos, nunca bloquear UI durante operación NFC

**Nota**: Este skill es preventivo. Se creará con la estructura base para cuando inicie la fase NFC.

---

## Tarea 4 — Actualizar skill `autenticacion-segura` (GAP G04, severidad MEDIA)

**Acción**: Agregar sección sobre Dev Bypass al skill existente en `.opencode/skills/autenticacion-segura/SKILL.md`

**Contexto del proyecto**:
- Dev bypass: credenciales `admin`/`admin` hacen login sin llamada remota
- `isDevBypass=true` se almacena en authStore
- Marcado con `⚠️ eliminar antes de producción`
- Buscar `dev-bypass` en `authStore.ts` para localizar

**Cambios a realizar**:
- Agregar subsección "Dev Bypass" dentro de "Cuándo usarlo"
- Documentar: qué es, por qué existe, cómo detectarlo, cómo eliminarlo de forma segura
- Agregar checklist de eliminación: buscar `dev-bypass` en authStore, eliminar credenciales hardcodeadas, eliminar flag `isDevBypass`, verificar que no queden referencias

**Referencia**: `src/state/authStore.ts` (181 líneas), buscar patron `dev-bypass`

---

## Tarea 5 — Actualizar skill `gestion-mocks-testing` (GAP G07, severidad BAJA)

**Acción**: Agregar sección sobre snapshot serializer de seguridad al skill existente en `.opencode/skills/gestion-mocks-testing/SKILL.md`

**Contexto del proyecto**:
- Archivo: `jest.token-serializer.js` (referenciado en jest.config.js)
- Función: redacta tokens Bearer en snapshots para evitar exposición en CI logs
- Configuración: `snapshotSerializers` en jest.config.js

**Cambios a realizar**:
- Agregar subsección "Snapshot serializer" dentro de "Patrones de testing"
- Documentar: por qué es necesario (seguridad en CI), cómo funciona, cómo configurarlo
- Ejemplo de serializer que redacta tokens
- Restricciones: nunca exponer tokens reales en snapshots o logs de CI

---

## Tarea 6 — Actualizar skill `mobile-ux-patterns` (GAP G08, severidad BAJA)

**Acción**: Agregar sección sobre ErrorBoundary al skill existente en `.opencode/skills/mobile-ux-patterns/SKILL.md`

**Contexto del proyecto**:
- Archivo: `src/presentation/components/ErrorBoundary.tsx`
- Patrón: React ErrorBoundary para capturar errores de render
- Uso: envolver pantallas o secciones críticas

**Cambios a realizar**:
- Agregar subsección "ErrorBoundary" dentro de "Patrones de manejo de errores"
- Documentar: cuándo usarlo, dónde colocarlo (pantallas, secciones críticas), qué UI mostrar, cómo recuperarse
- Ejemplo de ErrorBoundary con fallback UI
- Restricciones: no usar para errores de lógica (usar try/catch), no anidar excesivamente, siempre ofrecer acción de recuperación

---

## Tarea 7 — Actualizar AGENTS.md y catálogo

**Acción**: Después de crear/actualizar los skills, sincronizar el catálogo en AGENTS.md

**Cambios**:
- Agregar `environment-config`, `local-database`, `nfc-integration` a la tabla de skills
- Eliminar la entrada `~~react-navigation-patterns~~` (ya fue eliminado del filesystem)
- Verificar que todas las referencias en la sección "Skills del Proyecto" sean consistentes

---

## Orden de ejecución

1. Tarea 1 (environment-config) — Prioridad alta
2. Tarea 2 (local-database) — Prioridad media
3. Tarea 3 (nfc-integration) — Prioridad media
4. Tarea 4 (autenticacion-segura) — Prioridad media
5. Tarea 5 (gestion-mocks-testing) — Prioridad baja
6. Tarea 6 (mobile-ux-patterns) — Prioridad baja
7. Tarea 7 (AGENTS.md sync) — Después de las 6 anteriores

## Criterios de éxito

- Cada skill creado/actualizado tiene frontmatter válido (name, description, license, compatibility)
- Cada skill tiene: Propósito, Cuándo usarlo, Alcance, Patrón principal, Restricciones
- Los ejemplos de código son reales y provienen del proyecto (no inventados)
- AGENTS.md refleja el catálogo actualizado
- No se modifican archivos .env ni secretos
