import React from 'react';

/**
 * Web shim for react-native-safe-area-context.
 *
 * On web there is no device notch or home indicator, so safe area insets are
 * always zero. This module replaces the native implementation via a Vite alias
 * so that `useSafeAreaInsets()` can be called safely without a
 * `<SafeAreaProvider>` in the tree.
 */

const ZERO_INSETS = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

/**
 * Returns zero insets on web (no notch / home indicator).
 */
export function useSafeAreaInsets() {
  return ZERO_INSETS;
}

/**
 * Passthrough provider – on web it simply renders its children.
 */
export function SafeAreaProvider({ children }) {
  return children ?? null;
}

/**
 * SafeAreaView is just a View on web.
 */
export const SafeAreaView = 'div';

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
};
