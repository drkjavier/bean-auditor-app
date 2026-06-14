/**
 * Database Inspector - Debug utility for viewing SQLite data in browser.
 *
 * Uses sql.js for real SQLite queries in DevTools.
 *
 * Usage in browser console:
 * ```js
 * // Access via window.__sqlDb (direct sql.js Database)
 * window.__sqlDb.exec("SELECT * FROM tags");
 * window.__sqlDb.exec("SELECT * FROM audit_records");
 *
 * // Or use the inspector
 * __dbInspector.inspect();           // List all tables
 * __dbInspector.table('tags');       // View table data
 * __dbInspector.query('SELECT ...'); // Run custom SQL
 * __dbInspector.schema();            // Show table schemas
 * __dbInspector.clear();             // Clear all data
 * ```
 */

class DatabaseInspector {
  /**
   * Get the sql.js database instance.
   */
  getDb() {
    if (typeof window !== 'undefined' && window.__sqlDb) {
      return window.__sqlDb;
    }
    return null;
  }

  /**
   * Execute a SQL query and return results.
   */
  query(sql) {
    const db = this.getDb();
    if (!db) {
      console.error('Database not initialized. Wait for app to load.');
      return [];
    }

    try {
      const result = db.exec(sql);
      return result;
    } catch (err) {
      console.error('Query error:', err.message);
      return [];
    }
  }

  /**
   * Inspect all tables and their row counts.
   */
  inspect() {
    const db = this.getDb();
    if (!db) {
      console.error('Database not initialized.');
      return;
    }

    console.group('📊 Database Inspector (SQLite)');

    // Get all tables
    const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");

    if (tablesResult.length === 0) {
      console.log('  (empty - no tables created yet)');
    } else {
      const tables = tablesResult[0].values.map(row => row[0]);

      tables.forEach(tableName => {
        if (tableName === 'sqlite_sequence') return; // Skip internal table

        const countResult = db.exec(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = countResult.length > 0 ? countResult[0].values[0][0] : 0;
        console.log(`  📋 ${tableName}: ${count} rows`);
      });
    }

    console.groupEnd();
  }

  /**
   * View table schema (CREATE TABLE statement).
   */
  schema(tableName) {
    const db = this.getDb();
    if (!db) {
      console.error('Database not initialized.');
      return;
    }

    console.group(`📋 Schema: ${tableName || 'all tables'}`);

    let sql;
    if (tableName) {
      sql = `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`;
    } else {
      sql = `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
    }

    const result = db.exec(sql);
    if (result.length > 0) {
      result[0].values.forEach(row => {
        console.log(row[1] || row[0]);
      });
    } else {
      console.log('  (no schema found)');
    }

    console.groupEnd();
  }

  /**
   * View table data.
   */
  table(tableName) {
    const db = this.getDb();
    if (!db) {
      console.error('Database not initialized.');
      return;
    }

    console.group(`📋 Table: ${tableName}`);

    try {
      const result = db.exec(`SELECT * FROM "${tableName}"`);

      if (result.length === 0) {
        console.log('  (empty)');
      } else {
        // Convert to array of objects for console.table
        const columns = result[0].columns;
        const rows = result[0].values.map(values => {
          const obj = {};
          columns.forEach((col, i) => {
            obj[col] = values[i];
          });
          return obj;
        });

        console.table(rows);
      }
    } catch (err) {
      console.error('  Error:', err.message);
    }

    console.groupEnd();
  }

  /**
   * Run a custom SQL query.
   */
  sql(query) {
    console.group(`🔍 SQL Query`);
    console.log('Query:', query);

    const result = this.query(query);

    if (result.length === 0) {
      console.log('  (no results)');
    } else {
      result.forEach(r => {
        if (r.columns && r.values) {
          const columns = r.columns;
          const rows = r.values.map(values => {
            const obj = {};
            columns.forEach((col, i) => {
              obj[col] = values[i];
            });
            return obj;
          });
          console.table(rows);
        }
      });
    }

    console.groupEnd();
  }

  /**
   * View sync status (pending records).
   */
  syncStatus() {
    console.group('🔄 Sync Status');

    try {
      // Tags pending
      const tagsResult = this.query("SELECT COUNT(*) as count FROM tags WHERE sync_pending = 1");
      const tagsPending = tagsResult.length > 0 ? tagsResult[0].values[0][0] : 0;
      console.log(`  Tags pending sync: ${tagsPending}`);

      // Audits pending
      const auditsResult = this.query("SELECT COUNT(*) as count FROM audit_records WHERE sync_pending = 1");
      const auditsPending = auditsResult.length > 0 ? auditsResult[0].values[0][0] : 0;
      console.log(`  Audits pending sync: ${auditsPending}`);
    } catch {
      console.log('  (tables not created yet)');
    }

    console.groupEnd();
  }

  /**
   * Clear all data from database.
   */
  clear() {
    const db = this.getDb();
    if (!db) {
      console.error('Database not initialized.');
      return;
    }

    try {
      // Get all tables
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

      if (result.length > 0) {
        result[0].values.forEach(row => {
          db.run(`DELETE FROM "${row[0]}"`);
        });
      }

      console.log('🗑️ Database cleared');
    } catch (err) {
      console.error('Clear failed:', err instanceof Error ? err.message : err);
    }
  }

  /**
   * Export database as Uint8Array.
   */
  export() {
    const db = this.getDb();
    if (!db) {
      console.error('Database not initialized.');
      return null;
    }

    return db.export();
  }
}

// Singleton instance
export const dbInspector = new DatabaseInspector();

// Expose globally for console access
if (typeof window !== 'undefined') {
  window.__dbInspector = dbInspector;
}

export default dbInspector;
