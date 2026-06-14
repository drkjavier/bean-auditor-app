---
name: local-database
description: >
  Guía la creación y mantenimiento de base de datos local SQLite en React Native.
  Trigger: Al crear tablas, migraciones, queries o servicios que usen SQLite en native.
license: MIT
compatibility: opencode
---
# Local Database (SQLite Native)

## Propósito
Guiar la implementación y mantenimiento de base de datos local SQLite usando `react-native-quick-sqlite`, exclusivamente en la plataforma native, con web-shims para compatibilidad en Vite.

## Cuándo usarlo
- Al crear nuevas tablas en la base de datos local.
- Al escribir o modificar migraciones de SQLite.
- Al implementar queries o servicios que lean/escriban en SQLite.
- Al auditar el patrón de acceso a datos local en native.
- Cuando se requiere normalizar resultados de queries SQLite.

## Alcance
- **Solo native**: los archivos SQLite usan extensión `.native.ts`.
- **Web shim obligatorio**: toda implementación SQLite requiere un shim en `src/web-shims/` para que Vite no crashee.
- Migraciones siempre idempotentes (`CREATE TABLE IF NOT EXISTS`).
- Solo en `src/data/sqlite/`.
- No cubre bases de datos remotas ni ORM.

## Patrón principal

### Apertura de base de datos (`src/data/sqlite/db.native.ts`)

```typescript
import { open } from 'react-native-quick-sqlite';

const database = open({ name: 'bean_auditor.db', location: 'default' });
```

### Normalización de resultados

```typescript
type AnyRow = Record<string, unknown>;

const normalizeRows = (rows: unknown): AnyRow[] => {
  if (!rows) return [];
  if (Array.isArray(rows)) return rows as AnyRow[];

  const candidate = rows as { _array?: unknown; item?: (index: number) => AnyRow; length?: number };
  if (Array.isArray(candidate._array)) return candidate._array as AnyRow[];
  if (typeof candidate.item === 'function' && typeof candidate.length === 'number') {
    const values: AnyRow[] = [];
    for (let index = 0; index < candidate.length; index += 1) {
      values.push(candidate.item(index));
    }
    return values;
  }

  return [];
};
```

**Por qué `normalizeRows`**: `react-native-quick-sqlite` puede devolver resultados como array plano, como objeto con `_array`, o como cursor con `.item()`. La normalización unifica todos los casos.

### Funciones de acceso

```typescript
export const execute = (sql: string, params: (string | number | null)[] = []): ExecuteResult => {
  if (typeof (database as any).execute === 'function') {
    return (database as any).execute(sql, params) as ExecuteResult;
  }
  if (typeof (database as any).executeSql === 'function') {
    return (database as any).executeSql(sql, params) as ExecuteResult;
  }
  throw new Error('SQLite driver does not expose execute/executeSql');
};

export const queryRows = (sql: string, params: (string | number | null)[] = []): AnyRow[] => {
  const result = execute(sql, params);
  return normalizeRows(result.rows);
};
```

### Migraciones idempotentes (`src/data/sqlite/migrations.native.ts`)

```typescript
import { execute } from './db.native';

export async function runMigrations(): Promise<void> {
  const createSessionTable = `
    CREATE TABLE IF NOT EXISTS user_session (
      id INTEGER PRIMARY KEY NOT NULL,
      username TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;

  try {
    const result = execute(createSessionTable);
    if (result && typeof (result as any).then === 'function') {
      await result;
    }
  } catch (err) {
    console.error('runMigrations failed', err);
    throw err;
  }
}
```

**Reglas de migraciones**:
- Siempre `CREATE TABLE IF NOT EXISTS` — nunca `CREATE TABLE` simple.
- Ejecutar `runMigrations()` en cada inicio de app (idempotente).
- Los errores de migración NO se silencian — se propagan al caller.

### Web shim (`src/web-shims/react-native-quick-sqlite.js`)

```javascript
export function open(_opts) {
  const db = {
    execute(sql, _params) {
      return { rows: { _array: [] } };
    },
    executeSql(sql, _params) {
      return { rows: { _array: [] } };
    },
  };
  return db;
}
```

El shim debe exponer la misma API que el módulo real pero con resultados vacíos. Se mapea en `vite.config.ts` via `resolve.alias`.

## Restricciones
- **Solo** en `src/data/sqlite/` — no crear queries SQLite en presentation o domain.
- **Nunca** en web sin shim — verificar que `src/web-shims/` tenga el módulo correspondiente.
- Migraciones **siempre** idempotentes (`IF NOT EXISTS`).
- **Nunca** exponer datos sensibles en logs de SQLite.
- Los archivos SQLite son `.native.ts` — nunca `.web.ts` ni genéricos.
- Mantener `normalizeRows` sincronizado con la API del driver.
