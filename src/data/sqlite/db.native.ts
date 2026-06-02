import { open } from 'react-native-quick-sqlite';

type AnyRow = Record<string, unknown>;
type ExecuteResult = {
  rows?: unknown;
};

const database = open({ name: 'bean_auditor.db', location: 'default' });

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
