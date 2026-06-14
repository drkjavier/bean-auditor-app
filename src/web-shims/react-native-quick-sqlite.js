/**
 * sql.js SQLite Web Shim for React Native Quick SQLite.
 *
 * This shim uses sql.js (SQLite compiled to WebAssembly) to provide
 * real SQLite functionality in the browser.
 *
 * Features:
 * - Real SQL queries (CREATE, INSERT, SELECT, UPDATE, DELETE)
 * - Persistent storage via localStorage
 * - Visible in DevTools → Console (use window.__sqlDb)
 *
 * Usage in DevTools:
 * ```js
 * // Direct access to sql.js Database
 * window.__sqlDb.exec("SELECT * FROM tags");
 * window.__sqlDb.exec("SELECT * FROM audit_records");
 *
 * // List all tables
 * window.__sqlDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
 *
 * // Export database
 * window.__sqlDb.export(); // returns Uint8Array
 * ```
 */

let dbInstance = null;
let dbReady = null;

const STORAGE_KEY = 'bean_auditor_sqlite';

// Eagerly start DB initialization when module loads
if (typeof window !== 'undefined') {
  // Set a placeholder so DevTools knows the shim is loaded
  window.__sqlDbStatus = 'initializing';

  getDb().then(db => {
    window.__sqlDb = db;
    window.__sqlDbStatus = 'ready';
    console.log('[sql.js shim] Database ready. Use window.__sqlDb or helpers: __sqlQuery, __sqlTables, __sqlExport');
  }).catch(err => {
    window.__sqlDbStatus = 'failed';
    console.error('[sql.js shim] Init failed:', err);
  });
}

/**
 * Initialize sql.js database.
 */
async function initSqlJs() {
  const mod = await import('sql.js');
  const initSqlJs = typeof mod === 'function' ? mod : mod.default;
  if (typeof initSqlJs !== 'function') {
    throw new Error('[sql.js shim] Could not resolve initSqlJs function from sql.js module');
  }
  const SQL = await initSqlJs({
    locateFile: file => `/sql-wasm.wasm`
  });

  // Try to load existing database from localStorage
  let db = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const buf = new Uint8Array(JSON.parse(saved));
      db = new SQL.Database(buf);
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }

  // Expose globally for DevTools access
  if (typeof window !== 'undefined') {
    window.__sqlDb = db;

    // ── Helper: format query results as array of objects ────────────────
    const formatResult = (sql) => {
      const result = db.exec(sql);
      if (!result || result.length === 0) return [];
      return result[0].values.map(row => {
        const obj = {};
        result[0].columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    };

    // ── Basic helpers ──────────────────────────────────────────────────
    window.__sqlQuery = (sql) => {
      const rows = formatResult(sql);
      if (rows.length > 0) {
        console.table(rows);
      } else {
        console.log('[sql.js] No results');
      }
      return rows;
    };

    window.__sqlTables = () => {
      const rows = formatResult("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
      const tables = rows.map(r => r.name);
      console.log('[sql.js] Tables:', tables.length > 0 ? tables.join(', ') : '(none)');
      return tables;
    };

    window.__sqlExport = () => {
      const data = db.export();
      console.log(`[sql.js] Database size: ${data.length} bytes`);
      return data;
    };

    // ── Schema helpers ─────────────────────────────────────────────────
    window.__sqlDescribe = (table) => {
      const rows = formatResult(`PRAGMA table_info("${table}")`);
      if (rows.length === 0) {
        console.warn(`[sql.js] Table "${table}" not found or empty`);
        return [];
      }
      console.log(`[sql.js] Schema of "${table}":`);
      console.table(rows);
      return rows;
    };

    window.__sqlIndexes = (table) => {
      const whereClause = table ? `WHERE tbl_name = "${table}"` : '';
      const rows = formatResult(`SELECT * FROM sqlite_master WHERE type = 'index' ${whereClause} ORDER BY name`);
      console.log(`[sql.js] Indexes${table ? ` of "${table}"` : ''}:`);
      if (rows.length > 0) {
        console.table(rows);
      } else {
        console.log('(none)');
      }
      return rows;
    };

    // ── Data helpers ───────────────────────────────────────────────────
    window.__sqlCount = (table) => {
      const rows = formatResult(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = rows[0]?.count ?? 0;
      console.log(`[sql.js] "${table}" has ${count} rows`);
      return count;
    };

    window.__sqlSample = (table, limit = 5) => {
      const rows = formatResult(`SELECT * FROM "${table}" LIMIT ${limit}`);
      console.log(`[sql.js] Sample of "${table}" (max ${limit}):`);
      if (rows.length > 0) {
        console.table(rows);
      } else {
        console.log('(empty)');
      }
      return rows;
    };

    window.__sqlDistinct = (table, column) => {
      const rows = formatResult(`SELECT DISTINCT "${column}" FROM "${table}" ORDER BY "${column}"`);
      const values = rows.map(r => r[column]);
      console.log(`[sql.js] Distinct values in "${table}.${column}":`);
      console.log(values);
      return values;
    };

    // ── Mutation helpers ───────────────────────────────────────────────
    window.__sqlClear = (table) => {
      db.run(`DELETE FROM "${table}"`);
      saveToStorage();
      console.log(`[sql.js] Cleared all rows from "${table}"`);
    };

    window.__sqlDrop = (table) => {
      db.run(`DROP TABLE IF EXISTS "${table}"`);
      saveToStorage();
      console.log(`[sql.js] Dropped table "${table}"`);
    };

    window.__sqlInsert = (table, obj) => {
      const columns = Object.keys(obj);
      const values = Object.values(obj);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO "${table}" (${columns.join(', ')}) VALUES (${placeholders})`;
      db.run(sql, values);
      saveToStorage();
      console.log(`[sql.js] Inserted into "${table}":`, obj);
    };

    window.__sqlUpdate = (table, setObj, whereClause, whereParams = []) => {
      const setParts = Object.keys(setObj).map(k => `${k} = ?`);
      const setValues = Object.values(setObj);
      const sql = `UPDATE "${table}" SET ${setParts.join(', ')} WHERE ${whereClause}`;
      db.run(sql, [...setValues, ...whereParams]);
      saveToStorage();
      console.log(`[sql.js] Updated "${table}" where ${whereClause}`);
    };

    window.__sqlDelete = (table, whereClause, whereParams = []) => {
      const sql = `DELETE FROM "${table}" WHERE ${whereClause}`;
      db.run(sql, whereParams);
      saveToStorage();
      console.log(`[sql.js] Deleted from "${table}" where ${whereClause}`);
    };

    // ── Sync helpers ───────────────────────────────────────────────────
    window.__sqlPending = () => {
      const tags = formatResult("SELECT uuid, unique_id, colorHex FROM tags WHERE sync_pending = 1");
      const audits = formatResult("SELECT uuid_tag, status, timestamp FROM audit_records WHERE sync_pending = 1");
      console.log(`[sql.js] Pending sync: ${tags.length} tags, ${audits.length} audits`);
      if (tags.length > 0) console.table(tags);
      if (audits.length > 0) console.table(audits);
      return { tags, audits };
    };

    window.__sqlMarkSynced = (table, uuid) => {
      const idColumn = table === 'tags' ? 'uuid' : 'uuid_tag';
      db.run(`UPDATE "${table}" SET sync_pending = 0 WHERE ${idColumn} = ?`, [uuid]);
      saveToStorage();
      console.log(`[sql.js] Marked as synced: ${table}.${uuid}`);
    };

    window.__sqlResetSync = () => {
      db.run("UPDATE tags SET sync_pending = 1");
      db.run("UPDATE audit_records SET sync_pending = 1");
      saveToStorage();
      console.log('[sql.js] All records marked as pending sync');
    };

    // ── Utilities ──────────────────────────────────────────────────────
    window.__sqlSchema = () => {
      const rows = formatResult(`
        SELECT 
          m.name as table_name,
          GROUP_CONCAT(p.name, ', ') as columns,
          COUNT(*) as column_count
        FROM sqlite_master m
        JOIN pragma_table_info(m.name) p
        WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'
        GROUP BY m.name
        ORDER BY m.name
      `);
      console.log('[sql.js] Database schema:');
      console.table(rows);
      return rows;
    };

    window.__sqlReset = () => {
      const tables = formatResult("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      tables.forEach(t => {
        db.run(`DELETE FROM "${t.name}"`);
      });
      saveToStorage();
      console.log('[sql.js] All user tables cleared');
    };

    window.__sqlHelp = () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║           sql.js DevTools Helper — BeanAuditorApp           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📊 QUERIES                                                  ║
║  __sqlQuery(sql)         — Execute SQL, show table           ║
║  __sqlTables()           — List all tables                   ║
║  __sqlDescribe(table)    — Show table schema                 ║
║  __sqlIndexes(table)     — Show table indexes                ║
║  __sqlSchema()           — Show all tables with columns      ║
║                                                              ║
║  📈 DATA INSPECTION                                          ║
║  __sqlCount(table)       — Count rows in table               ║
║  __sqlSample(table, n)   — Show first N rows (default: 5)    ║
║  __sqlDistinct(table, c) — Distinct values in column         ║
║  __sqlPending()          — Show pending sync records          ║
║                                                              ║
║  ✏️  MUTATIONS                                                ║
║  __sqlInsert(table, obj) — Insert a row                      ║
║  __sqlUpdate(table, set, where, params) — Update rows        ║
║  __sqlDelete(table, where, params) — Delete rows             ║
║  __sqlClear(table)       — Delete all rows from table         ║
║  __sqlDrop(table)        — Drop table                         ║
║                                                              ║
║  🔄 SYNC                                                     ║
║  __sqlMarkSynced(table, uuid) — Mark record as synced        ║
║  __sqlResetSync()        — Mark all records as pending        ║
║                                                              ║
║  💾 DATABASE                                                 ║
║  __sqlExport()           — Export DB as Uint8Array            ║
║  __sqlReset()            — Clear all user tables              ║
║  __sqlDb                 — Raw sql.js Database instance       ║
║                                                              ║
║  HELP                                                        ║
║  __sqlHelp()             — Show this help                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
      `);
    };

    // Auto-show help on load
    console.log('[sql.js shim] Database ready. Type __sqlHelp() for available commands');
  }

  return db;
}

/**
 * Save database to localStorage.
 */
function saveToStorage() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const arr = Array.from(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('[sql.js shim] Failed to save:', err);
  }
}

/**
 * Get or initialize database.
 */
async function getDb() {
  if (dbInstance) return dbInstance;
  if (dbReady) return dbReady;

  dbReady = initSqlJs().then(db => {
    dbInstance = db;
    return db;
  });

  return dbReady;
}

/**
 * Execute SQL and return results in react-native-quick-sqlite format.
 */
async function executeAsync(sql, params) {
  const db = await getDb();

  try {
    // For INSERT/UPDATE/DELETE, run and return empty result
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)) {
      db.run(sql, params || []);
      saveToStorage();
      return { rows: { _array: [] } };
    }

    // For SELECT, execute and return results
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    return { rows: { _array: rows } };
  } catch (err) {
    console.error('[sql.js shim] Execute error:', err.message, '\nSQL:', sql);
    throw err;
  }
}

/**
 * Execute SQL synchronously (for migrations that expect sync behavior).
 */
function executeSync(sql, params) {
  if (!dbInstance) {
    throw new Error('[sql.js shim] Database not initialized. Call getDb() first.');
  }

  try {
    // For INSERT/UPDATE/DELETE, run and return empty result
    if (/^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql)) {
      dbInstance.run(sql, params || []);
      saveToStorage();
      return { rows: { _array: [] } };
    }

    // For SELECT, execute and return results
    const stmt = dbInstance.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    return { rows: { _array: rows } };
  } catch (err) {
    console.error('[sql.js shim] Execute error:', err.message, '\nSQL:', sql);
    throw err;
  }
}

/**
 * Synchronous execution wrapper (returns thenable for compatibility).
 */
function execute(sql, params) {
  // If db is ready, execute synchronously
  if (dbInstance) {
    return executeSync(sql, params);
  }

  // Otherwise, queue for async execution
  let result = null;
  let error = null;
  let pending = true;

  executeAsync(sql, params)
    .then(r => { result = r; pending = false; })
    .catch(e => { error = e; pending = false; });

  const thenable = {
    then: (resolve, reject) => {
      const check = () => {
        if (!pending) {
          if (error) reject(error);
          else resolve(result);
        } else {
          setTimeout(check, 10);
        }
      };
      check();
      return thenable;
    }
  };

  return thenable;
}

/**
 * Open database (compatible with react-native-quick-sqlite API).
 */
export function open(_opts) {
  // Initialize database asynchronously
  getDb().catch(err => {
    console.error('[sql.js shim] Init failed:', err);
  });

  return {
    execute: execute,
    executeSql: execute,
  };
}

/**
 * Get database instance for direct access in DevTools.
 */
export async function getDatabase() {
  return getDb();
}

/**
 * Clear all data (drop all user tables and recreate them empty).
 */
export async function clearDatabase() {
  const db = await getDb();
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (tables.length > 0) {
    for (const row of tables[0].values) {
      db.run(`DROP TABLE IF EXISTS "${row[0]}"`);
    }
  }
  saveToStorage();
}

export default { open, getDatabase, clearDatabase };
