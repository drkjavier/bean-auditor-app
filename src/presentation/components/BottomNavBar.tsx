import React, { memo } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_BAR_HEIGHT } from '../themes/layout';

export interface TabRoute {
  key: string;
  title: string;
}

interface BottomNavBarProps {
  routes: TabRoute[];
  activeIndex: number;
  onTabPress: (index: number) => void;
  accessibilityLabel?: string;
}

/**
 * Bottom navigation bar component that remains fixed (static) at the bottom
 * of the screen across all tabs. Uses absolute positioning with proper
 * safe area insets to stay visible above content.
 *
 * This component is intentionally pure (no navigation dependencies) so it
 * can be used in any context that needs a fixed bottom tab bar.
 */
function BottomNavBar({ routes, activeIndex, onTabPress, accessibilityLabel = 'Navegación inferior' }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          height: NAV_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {routes.map((route, i) => (
        <Pressable
          key={route.key}
          style={[styles.tabItem, activeIndex === i ? styles.tabItemActive : null]}
          onPress={() => onTabPress(i)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeIndex === i }}
          accessibilityLabel={route.title}
        >
          <Text style={[styles.tabTitle, activeIndex === i ? styles.tabTitleActive : null]}>
            {route.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Returns the total height the bottom bar occupies (NAV_BAR_HEIGHT + safe area insets).
 * Use this value to add paddingBottom to content containers so content is not
 * obscured by the fixed bottom bar.
 */
export function useBottomBarOffset(): number {
  const insets = useSafeAreaInsets();
  return NAV_BAR_HEIGHT + insets.bottom;
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    zIndex: 20,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabItemActive: {
    backgroundColor: '#eef2ff',
  },
  tabTitle: {
    fontWeight: '600',
    color: '#475569',
  },
  tabTitleActive: {
    color: '#2563eb',
  },
});

export default memo(BottomNavBar);
