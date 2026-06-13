import { execute } from './db.native';

/**
 * Run initial migrations for the native SQLite database.
 * The function is idempotent and safe to call on every app start.
 */
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
    // Some SQLite drivers return a Promise, others are synchronous
    if (result && typeof (result as any).then === 'function') {
      await result;
    }
  } catch (err) {
    // Surface the error but keep it explicit for callers to decide recovery
    // Do not silently swallow migration errors.
    console.error('runMigrations failed', err);
    throw err;
  }
}

export default runMigrations;
