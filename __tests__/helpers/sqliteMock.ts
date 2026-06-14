/**
 * Mock SQLite for testing.
 *
 * This mock simulates SQLite behavior in-memory for unit tests.
 * Used by Jest tests to verify database operations without native modules.
 */

type Row = Record<string, unknown>;

class MockDatabase {
  private tables: Map<string, Row[]> = new Map();
  private autoIncrement: Map<string, number> = new Map();

  execute(sql: string, params: (string | number | null)[] = []): { rows: { _array: Row[] } } {
    const trimmed = sql.trim();

    // CREATE TABLE
    if (/CREATE TABLE/i.test(trimmed)) {
      const match = trimmed.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match) {
        const tableName = match[1];
        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, []);
          this.autoIncrement.set(tableName, 1);
        }
      }
      return { rows: { _array: [] } };
    }

    // INSERT
    if (/INSERT/i.test(trimmed)) {
      const match = trimmed.match(/INSERT (?:OR IGNORE )?INTO (\w+)\s*\(([^)]+)\)/i);
      if (match) {
        const tableName = match[1];
        const columns = match[2].split(',').map(c => c.trim());

        if (!this.tables.has(tableName)) {
          this.tables.set(tableName, []);
          this.autoIncrement.set(tableName, 1);
        }

        // Parse VALUES to get both ? placeholders and literal values
        const valuesMatch = trimmed.match(/VALUES\s*\(([^)]+)\)/i);
        const valueParts = valuesMatch ? valuesMatch[1].split(',').map(v => v.trim()) : [];

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
            // Number literal
            row[col] = parseFloat(valuePart);
          } else if (/^'.*'$/.test(valuePart)) {
            // String literal
            row[col] = valuePart.slice(1, -1);
          } else {
            row[col] = valuePart;
          }
        });

        // Handle autoincrement
        if (row.id === undefined && this.autoIncrement.has(tableName)) {
          row.id = this.autoIncrement.get(tableName);
          this.autoIncrement.set(tableName, (this.autoIncrement.get(tableName) || 0) + 1);
        }

        // Handle INSERT OR IGNORE - skip if primary key exists
        const isIgnore = /INSERT\s+OR\s+IGNORE/i.test(trimmed);
        if (isIgnore && row.uuid) {
          const existing = this.tables.get(tableName) || [];
          const pk = Object.keys(row).find(k => k === 'uuid' || k === 'id');
          if (pk && existing.some(r => r[pk] === row[pk])) {
            return { rows: { _array: [] } };
          }
        }

        this.tables.get(tableName)!.push(row);
      }
      return { rows: { _array: [] } };
    }

    // SELECT COUNT
    if (/SELECT COUNT/i.test(trimmed)) {
      const match = trimmed.match(/FROM (\w+)/i);
      if (match) {
        const tableName = match[1];
        const rows = this.tables.get(tableName) || [];
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
        const whereMatch = trimmed.match(/WHERE\s+(.+?)(?:\s+(?:ORDER|LIMIT|GROUP|$))/i);
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

    // UPDATE
    if (/UPDATE/i.test(trimmed)) {
      const match = trimmed.match(/UPDATE (\w+)\s*SET\s+(.+?)(?:\s*WHERE\s+(.+))?$/i);
      if (match) {
        const tableName = match[1];
        const setClause = match[2];
        const whereClause = match[3];

        const rows = this.tables.get(tableName) || [];
        const setPairs = this.parseSetClause(setClause);

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

    // DELETE
    if (/DELETE/i.test(trimmed)) {
      const match = trimmed.match(/DELETE FROM (\w+)(?:\s*WHERE\s+(.+))?/i);
      if (match) {
        const tableName = match[1];
        const whereClause = match[2];
        const rows = this.tables.get(tableName) || [];

        if (whereClause) {
          this.tables.set(tableName, rows.filter(row => this.applyWhere([row], whereClause, params).length === 0));
        } else {
          this.tables.set(tableName, []);
        }
      }
      return { rows: { _array: [] } };
    }

    // CREATE INDEX
    if (/CREATE INDEX/i.test(trimmed)) {
      return { rows: { _array: [] } };
    }

    return { rows: { _array: [] } };
  }

  executeSql(sql: string, params?: (string | number | null)[]): { rows: { _array: Row[] } } {
    return this.execute(sql, params);
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

  getTable(name: string): Row[] {
    return this.tables.get(name) || [];
  }

  clear(): void {
    this.tables.clear();
    this.autoIncrement.clear();
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
