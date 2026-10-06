/**
 * Mock SQLite for testing.
 *
 * This mock simulates SQLite behavior in-memory for unit tests.
 * It registers table schemas on CREATE TABLE and validates INSERT/UPDATE
 * statements against those schemas, mirroring real SQLite error behavior
 * so schema mismatches (e.g. missing columns) are caught in tests instead
 * of being silently swallowed.
 */

type Row = Record<string, unknown>;

class MockDatabase {
  private tables: Map<string, Row[]> = new Map();
  private schemas: Map<string, string[]> = new Map();
  private autoIncrement: Map<string, number> = new Map();
  private indexes: Set<string> = new Set();

  execute(sql: string, params: (string | number | null)[] = []): { rows: { _array: Row[] } } {
    const trimmed = sql.trim();

    // PRAGMA table_info(table)
    const pragmaMatch = trimmed.match(/^PRAGMA\s+table_info\((\w+)\)\s*;?\s*$/i);
    if (pragmaMatch) {
      const tableName = pragmaMatch[1];
      const columns = this.schemas.get(tableName) || [];
      return {
        rows: {
          _array: columns.map(name => ({ name, type: 'TEXT' })),
        },
      };
    }

    // CREATE TABLE [IF NOT EXISTS] name (...)
    if (/CREATE TABLE/i.test(trimmed)) {
      const match = trimmed.match(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(/i);
      if (match) {
        const tableName = match[1];
        if (!this.tables.has(tableName)) {
          const openParenIndex = match.index! + match[0].length - 1;
          const body = this.extractParenBody(trimmed, openParenIndex);
          const columns = this.parseColumnDefs(body);
          this.tables.set(tableName, []);
          this.schemas.set(tableName, columns);
          this.autoIncrement.set(tableName, 1);
        }
      }
      return { rows: { _array: [] } };
    }

    // ALTER TABLE name ADD COLUMN def
    const alterMatch = trimmed.match(/^ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
    if (alterMatch) {
      const tableName = alterMatch[1];
      const column = alterMatch[2];
      if (!this.tables.has(tableName)) {
        throw new Error(`no such table: ${tableName}`);
      }
      const columns = this.schemas.get(tableName) || [];
      if (!columns.includes(column)) {
        columns.push(column);
        this.schemas.set(tableName, columns);
      }
      return { rows: { _array: [] } };
    }

    // INSERT [OR IGNORE | OR REPLACE] INTO name (cols) VALUES (...)
    const insertMatch = trimmed.match(
      /^INSERT\s+(?:OR\s+(IGNORE|REPLACE)\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i,
    );
    if (insertMatch) {
      const orMode = insertMatch[1] ? insertMatch[1].toUpperCase() : null;
      const tableName = insertMatch[2];
      const columns = insertMatch[3].split(',').map(c => c.trim());
      const valueParts = insertMatch[4].split(',').map(v => v.trim());

      const schema = this.schemas.get(tableName);
      if (!schema) {
        throw new Error(`no such table: ${tableName}`);
      }

      for (const col of columns) {
        if (!schema.includes(col)) {
          throw new Error(`table ${tableName} has no column named ${col}`);
        }
      }

      const row: Row = {};
      let paramIndex = 0;
      columns.forEach((col, i) => {
        const valuePart = valueParts[i];
        if (valuePart === '?') {
          row[col] = params[paramIndex] !== undefined ? params[paramIndex] : null;
          paramIndex++;
        } else if (valuePart === 'NULL' || valuePart === 'null') {
          row[col] = null;
        } else if (/^-?\d+(\.\d+)?$/.test(valuePart)) {
          row[col] = parseFloat(valuePart);
        } else if (/^'.*'$/.test(valuePart)) {
          row[col] = valuePart.slice(1, -1);
        } else {
          row[col] = valuePart;
        }
      });

      const upsertMatch = trimmed.match(/ON\s+CONFLICT\s*\(\s*(\w+)\s*\)\s*DO\s+UPDATE\s+SET/i);
      const conflictPk = upsertMatch ? upsertMatch[1] : null;
      const pk = row.uuid !== undefined ? 'uuid' : row.id !== undefined ? 'id' : conflictPk;
      const tableRows = this.tables.get(tableName)!;

      // INSERT OR IGNORE: skip when the primary key already exists
      if (orMode === 'IGNORE' && pk && tableRows.some(r => r[pk] === row[pk])) {
        return { rows: { _array: [] } };
      }

      // INSERT OR REPLACE: replace the row with the same primary key
      if (orMode === 'REPLACE' && pk) {
        const idx = tableRows.findIndex(r => r[pk] === row[pk]);
        if (idx >= 0) {
          tableRows[idx] = row;
          return { rows: { _array: [] } };
        }
      }

      // INSERT ... ON CONFLICT(pk) DO UPDATE SET: upsert semantics.
      // Applies the SET assignments over the existing row (excluded.* refers
      // to the VALUES-built row; "col + 1" bumps the existing value).
      if (conflictPk && pk) {
        const idx = tableRows.findIndex(r => r[pk] === row[pk]);
        if (idx >= 0) {
          const existing = { ...tableRows[idx] };
          const setClauseMatch = trimmed.match(/DO\s+UPDATE\s+SET\s+([\s\S]+?);?\s*$/i);
          const setPairs = setClauseMatch ? this.parseSetClause(setClauseMatch[1]) : [];
          for (const { col, val } of setPairs) {
            const excludedMatch = val.match(/^excluded\.(\w+)$/i);
            if (excludedMatch) {
              existing[col] = row[excludedMatch[1]] !== undefined ? row[excludedMatch[1]] : null;
              continue;
            }
            const bumpMatch = val.match(/^\w+\.(\w+)\s*\+\s*1$/i);
            if (bumpMatch) {
              existing[col] = (Number(existing[bumpMatch[1]]) || 0) + 1;
              continue;
            }
            existing[col] = this.parseLiteralValue(val);
          }
          tableRows[idx] = existing;
          return { rows: { _array: [] } };
        }
        // No conflicting row: fall through to a plain insert
      } else if (!orMode && pk && tableRows.some(r => r[pk] === row[pk])) {
        // Plain INSERT: duplicate primary keys violate the UNIQUE constraint
        throw new Error(`UNIQUE constraint failed: ${tableName}.${pk}`);
      }

      // Handle autoincrement
      if (row.id === undefined && this.autoIncrement.has(tableName)) {
        row.id = this.autoIncrement.get(tableName);
        this.autoIncrement.set(tableName, (this.autoIncrement.get(tableName) || 0) + 1);
      }

      tableRows.push(row);
      return { rows: { _array: [] } };
    }

    // SELECT COUNT(*) [WHERE ...]
    if (/SELECT COUNT/i.test(trimmed)) {
      const match = trimmed.match(/FROM (\w+)/i);
      if (match) {
        const tableName = match[1];
        let rows = this.tables.get(tableName) || [];

        const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+(?:ORDER\s+BY|LIMIT|GROUP\s+BY)[\s\S]*|;?\s*$)/i);
        if (whereMatch) {
          rows = this.applyWhere(rows, whereMatch[1], params);
        }

        return { rows: { _array: [{ count: rows.length }] } };
      }
    }

    // SELECT
    if (/SELECT/i.test(trimmed)) {
      const match = trimmed.match(/FROM (\w+)/i);
      if (match) {
        const tableName = match[1];
        let rows = this.tables.get(tableName) || [];

        // WHERE
        const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+(?:ORDER\s+BY|LIMIT|GROUP\s+BY)[\s\S]*|;?\s*$)/i);
        if (whereMatch) {
          const whereClause = whereMatch[1];
          rows = this.applyWhere(rows, whereClause, params);
        }

        // ORDER BY
        const orderMatch = trimmed.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
        if (orderMatch) {
          const col = orderMatch[1];
          const dir = orderMatch[2];
          rows = [...rows].sort((a, b) => {
            const aVal = a[col];
            const bVal = b[col];
            if (aVal === bVal) return 0;
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            const cmp = aVal < bVal ? -1 : 1;
            return dir === 'DESC' ? -cmp : cmp;
          });
        }

        // LIMIT
        const limitMatch = trimmed.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          rows = rows.slice(0, parseInt(limitMatch[1], 10));
        }

        return { rows: { _array: rows } };
      }
    }

    // UPDATE (anchored: avoid matching "updated_at"/column names in other statements)
    if (/^UPDATE\s/i.test(trimmed)) {
      const match = trimmed.match(/UPDATE (\w+)\s*SET\s+(.+?)(?:\s*WHERE\s+(.+))?$/i);
      if (match) {
        const tableName = match[1];
        const setClause = match[2];
        const whereClause = match[3];

        if (!this.tables.has(tableName)) {
          throw new Error(`no such table: ${tableName}`);
        }
        const rows = this.tables.get(tableName)!;
        const setPairs = this.parseSetClause(setClause);

        // Validate SET columns against the schema
        const schema = this.schemas.get(tableName) || [];
        for (const { col } of setPairs) {
          if (schema.length > 0 && !schema.includes(col)) {
            throw new Error(`table ${tableName} has no column named ${col}`);
          }
        }

        // Count ? in SET clause to know where WHERE params start
        const setParamCount = (setClause.match(/\?/g) || []).length;

        this.tables.set(tableName, rows.map(row => {
          if (!whereClause || this.applyWhere([row], whereClause, params.slice(setParamCount)).length > 0) {
            const newRow = { ...row };
            setPairs.forEach(({ col, val }, idx) => {
              if (val === '?') {
                newRow[col] = params[idx] !== undefined ? params[idx] : null;
              } else if (val === 'NULL' || val === 'null') {
                newRow[col] = null;
              } else if (/^-?\d+(\.\d+)?$/.test(val)) {
                newRow[col] = parseFloat(val);
              } else {
                newRow[col] = val;
              }
            });
            return newRow;
          }
          return row;
        }));
      }
      return { rows: { _array: [] } };
    }

    // DELETE (anchored to the start of the statement)
    if (/^DELETE\s/i.test(trimmed)) {
      const match = trimmed.match(/DELETE FROM (\w+)(?:\s*WHERE\s+(.+))?/i);
      if (match) {
        const tableName = match[1];
        const whereClause = match[2];
        if (!this.tables.has(tableName)) {
          throw new Error(`no such table: ${tableName}`);
        }
        const rows = this.tables.get(tableName)!;

        if (whereClause) {
          this.tables.set(tableName, rows.filter(row => this.applyWhere([row], whereClause, params).length === 0));
        } else {
          this.tables.set(tableName, []);
        }
      }
      return { rows: { _array: [] } };
    }

    // CREATE INDEX [IF NOT EXISTS] name ON table (...) — multi-statement safe
    if (/CREATE\s+INDEX/i.test(trimmed)) {
      const matches = trimmed.matchAll(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi);
      for (const match of matches) {
        this.indexes.add(match[1]);
      }
      return { rows: { _array: [] } };
    }

    return { rows: { _array: [] } };
  }

  executeSql(sql: string, params?: (string | number | null)[]): { rows: { _array: Row[] } } {
    return this.execute(sql, params);
  }

  /**
   * Extract the text between the parenthesis at `openIndex` and its match.
   */
  private extractParenBody(sql: string, openIndex: number): string {
    let depth = 0;
    for (let i = openIndex; i < sql.length; i++) {
      if (sql[i] === '(') depth++;
      else if (sql[i] === ')') {
        depth--;
        if (depth === 0) return sql.slice(openIndex + 1, i);
      }
    }
    return sql.slice(openIndex + 1);
  }

  /**
   * Parse column definitions from a CREATE TABLE body.
   * Handles nested parentheses (e.g. DEFAULT (strftime(...))).
   */
  private parseColumnDefs(body: string): string[] {
    const defs: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of body) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        defs.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) defs.push(current);

    return defs
      .map(def => {
        const m = def.trim().match(/^["'[]?(\w+)/);
        return m ? m[1] : null;
      })
      .filter((col): col is string => col !== null);
  }

  private applyWhere(rows: Row[], whereClause: string, params: (string | number | null)[]): Row[] {
    // Handle multiple conditions with AND
    const conditions = whereClause.split(/\s+AND\s+/i);

    return rows.filter(row => {
      return conditions.every(condition => {
        const trimmed = condition.trim();

        // Handle IN clause: "column IN (?, ?, ?)"
        const inMatch = trimmed.match(/(\w+)\s+IN\s*\(([^)]+)\)/i);
        if (inMatch) {
          const col = inMatch[1];
          const placeholders = inMatch[2].split(',').length;
          const values = params.slice(0, placeholders);
          return values.includes(row[col]);
        }

        // Handle IS NULL
        const isNullMatch = trimmed.match(/(\w+)\s+IS\s+NULL/i);
        if (isNullMatch) {
          return row[isNullMatch[1]] === null;
        }

        // Handle IS NOT NULL
        const isNotNullMatch = trimmed.match(/(\w+)\s+IS\s+NOT\s+NULL/i);
        if (isNotNullMatch) {
          return row[isNotNullMatch[1]] !== null;
        }

        // Handle equality with parameter: "column = ?"
        const eqParamMatch = trimmed.match(/(\w+)\s*=\s*\?/);
        if (eqParamMatch) {
          const col = eqParamMatch[1];
          // Find which parameter index this ? corresponds to
          const beforeThisCondition = whereClause.substring(0, whereClause.indexOf(trimmed));
          const questionMarksBefore = (beforeThisCondition.match(/\?/g) || []).length;
          const val = params[questionMarksBefore];
          return row[col] === val;
        }

        // Handle equality with value: "column = 'value'" or "column = value"
        const eqValMatch = trimmed.match(/(\w+)\s*=\s*'?([^']+)'?/);
        if (eqValMatch) {
          const col = eqValMatch[1];
          const val = eqValMatch[2];
          // Compare as string or number
          const rowVal = row[col];
          if (typeof rowVal === 'number') {
            return rowVal === parseFloat(val);
          }
          return String(rowVal) === val;
        }

        return true;
      });
    });
  }

  private parseSetClause(setClause: string): { col: string; val: string }[] {
    return setClause.split(',').map(pair => {
      const [col, val] = pair.split('=').map(s => s.trim());
      return { col, val };
    });
  }

  /**
   * Parse a SQL literal used in SET clauses (NULL, numbers, quoted strings).
   */
  private parseLiteralValue(val: string): unknown {
    if (val === 'NULL' || val === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(val)) return parseFloat(val);
    if (/^'.*'$/.test(val)) return val.slice(1, -1);
    return val;
  }

  getTable(name: string): Row[] {
    return this.tables.get(name) || [];
  }

  getSchema(name: string): string[] {
    return [...(this.schemas.get(name) || [])];
  }

  getIndexes(): string[] {
    return [...this.indexes];
  }

  clear(): void {
    this.tables.clear();
    this.schemas.clear();
    this.autoIncrement.clear();
    this.indexes.clear();
  }
}

// Singleton mock database for tests
export const mockDb = new MockDatabase();

// Mock the db.native module
jest.mock('../../src/data/sqlite/db.native', () => ({
  execute: (sql: string, params?: (string | number | null)[]) => mockDb.execute(sql, params),
  queryRows: (sql: string, params?: (string | number | null)[]) => {
    const result = mockDb.execute(sql, params);
    return result.rows._array;
  },
}));

// Mock migrations to be no-op (we create tables manually in tests)
jest.mock('../../src/data/sqlite/migrations.native', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  runMigrations: jest.fn().mockResolvedValue(undefined),
}));
