import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Synchronizes navigation state with browser history on web.
 *
 * - Updates the URL bar when the active tab changes (pushState).
 * - Handles browser back/forward buttons (popstate).
 * - No-op on native platforms (iOS/Android).
 *
 * @param activeKey - The current route key (e.g., 'home', 'audit', 'settings')
 * @param onNavigate - Callback invoked when the user presses back/forward
 */
export function useWebHistory(
  activeKey: string,
  onNavigate: (key: string) => void,
) {
  // Push a new history entry when the active tab changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const path = activeKey === 'home' ? '/' : `/${activeKey}`;
    const currentPath = window.location.pathname;

    // Only push if the path actually changed (avoid duplicate entries)
    if (path !== currentPath) {
      window.history.pushState({ route: activeKey }, '', path);
    }
  }, [activeKey]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { route?: string } | null;
      if (state?.route) {
        onNavigate(state.route);
      } else {
        // Fallback: derive route from URL path
        const path = window.location.pathname;
        const route = path === '/' ? 'home' : path.replace('/', '');
        onNavigate(route);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onNavigate]);

  // On mount, read the initial URL and sync state if needed
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const path = window.location.pathname;
    if (path && path !== '/') {
      const initialRoute = path.replace('/', '');
      if (initialRoute !== activeKey) {
        onNavigate(initialRoute);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Returns the initial route key derived from the current URL path.
 * Used to initialize navigation state from a deep link / bookmarked URL.
 */
export function getInitialRouteFromURL(validKeys: readonly string[]): string {
  if (Platform.OS !== 'web') return validKeys[0];

  const path = window.location.pathname;
  if (!path || path === '/') return validKeys[0];

  const route = path.replace('/', '');
  return validKeys.includes(route) ? route : validKeys[0];
}
