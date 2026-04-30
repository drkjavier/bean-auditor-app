module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-vector-icons/MaterialCommunityIcons$': '<rootDir>/__mocks__/MaterialCommunityIcons.js',
  },
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
