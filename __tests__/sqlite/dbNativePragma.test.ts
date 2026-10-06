/**
 * db.native connection pragma tests.
 *
 * The real db.native module runs against the react-native-quick-sqlite root
 * mock (open() returns __mockDB); we assert the foreign_keys pragma is
 * executed on the connection and that a driver rejection is non-fatal.
 */

jest.mock('react-native-quick-sqlite', () =>
  jest.requireActual('../../__mocks__/react-native-quick-sqlite'),
);

describe('db.native connection pragmas', () => {
  test('enables foreign_keys on the connection at module load', () => {
    let executed: unknown[] = [];

    jest.isolateModules(() => {
      jest.requireActual('../../src/data/sqlite/db.native');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const quickSqlite = require('react-native-quick-sqlite');
      executed = quickSqlite.__mockDB.execute.mock.calls.map((call: unknown[]) => call[0]);
    });

    expect(executed).toContain('PRAGMA foreign_keys = ON;');
  });

  test('does not crash when the driver rejects the pragma', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const quickSqlite = require('react-native-quick-sqlite');
      quickSqlite.__mockDB.execute.mockImplementationOnce(() => {
        throw new Error('driver rejected pragma');
      });

      expect(() => jest.requireActual('../../src/data/sqlite/db.native')).not.toThrow();
    });
  });
});
