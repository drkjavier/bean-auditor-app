// Mock para react-native-quick-sqlite
const mockDB = {
  execute: jest.fn(() => ({ rowsAffected: 0 })),
  executeAsync: jest.fn(() => Promise.resolve({ rowsAffected: 0 })),
  executeBatch: jest.fn(() => ({ rowsAffected: 0 })),
  executeBatchAsync: jest.fn(() => Promise.resolve({ rowsAffected: 0 })),
  close: jest.fn(),
  delete: jest.fn(),
};

module.exports = {
  open: jest.fn(() => mockDB),
  QuickSQLite: {
    open: jest.fn(() => mockDB),
    close: jest.fn(),
    delete: jest.fn(),
    executeSql: jest.fn(() => ({ rows: { _array: [] } })),
  },
  __mockDB: mockDB,
};
