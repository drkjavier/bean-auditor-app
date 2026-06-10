// Minimal shim for react-native-quick-sqlite to allow web builds.
export function open(_opts) {
  // Return a lightweight fake database with execute/executeSql methods
  const db = {
    execute(sql, _params) {
      // For safety, return a shape compatible with normalizeRows used in the app.
      return { rows: { _array: [] } };
    },
    executeSql(sql, _params) {
      return { rows: { _array: [] } };
    },
  };

  return db;
}
