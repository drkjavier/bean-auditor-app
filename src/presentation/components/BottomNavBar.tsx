import React, { memo } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_BAR_HEIGHT } from '../themes/layout';
import { useTheme } from '../themes/ThemeContext';

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
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          height: NAV_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {routes.map((route, i) => (
        <Pressable
          key={route.key}
          style={[
            styles.tabItem,
            activeIndex === i ? { backgroundColor: colors.primaryTonal } : null,
          ]}
          onPress={() => onTabPress(i)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeIndex === i }}
          accessibilityLabel={route.title}
        >
          <Text
            style={[
              styles.tabTitle,
              activeIndex === i
                ? { color: colors.primary }
                : { color: colors.textSecondary },
            ]}
          >
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
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabTitle: {
    fontWeight: '600',
  },
});

export default memo(BottomNavBar);
