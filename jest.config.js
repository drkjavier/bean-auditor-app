module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-vector-icons/MaterialCommunityIcons$': '<rootDir>/__mocks__/MaterialCommunityIcons.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^react-native-geolocation-service$': '<rootDir>/__mocks__/geolocation.js',
    '^@react-native-community/geolocation$': '<rootDir>/__mocks__/geolocation.js',
    '^react-native-permissions$': '<rootDir>/__mocks__/react-native-permissions.js',
  },
  snapshotSerializers: ['<rootDir>/jest.token-serializer.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|react-navigation' +
      '|@react-native-community' +
      '|@react-native-picker' +
      '|@react-native/async-storage' +
      '|react-native-safe-area-context' +
      '|@react-native-masked-view' +
      '|@react-native-segmented-control' +
      '|react-clone-referenced-element' +
      ')/)'
  ],
};
