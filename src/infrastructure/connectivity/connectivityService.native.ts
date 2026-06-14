/**
 * Connectivity Service - Native implementation
 *
 * Uses NetInfo from react-native for accurate connectivity detection.
 * Supports both cellular and WiFi connections.
 */

import { AppState, AppStateStatus, NetInfo, NetInfoState } from 'react-native';

export type ConnectivityListener = (isConnected: boolean) => void;

class ConnectivityServiceNative {
  private isConnected: boolean = true;
  private listeners: Set<ConnectivityListener> = new Set();
  private netInfoUnsubscribe: (() => void) | null = null;
  private appStateSubscription: any = null;

  /**
   * Initialize connectivity monitoring.
   * Call this once when the app starts.
   */
  async initialize(): Promise<void> {
    // Get initial state
    const state = await NetInfo.fetch();
    this.isConnected = this.evaluateConnectivity(state);

    // Subscribe to network changes
    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isConnected;
      this.isConnected = this.evaluateConnectivity(state);

      // Notify listeners only if connectivity changed
      if (wasConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });

    // Also listen to app state changes to re-check when app comes to foreground
    this.appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          this.recheckConnectivity();
        }
      }
    );
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if device is currently connected.
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isConnected = this.evaluateConnectivity(state);
      return this.isConnected;
    } catch {
      // If we can't check, assume disconnected
      return false;
    }
  }

  /**
   * Get cached connectivity status (no network call).
   */
  getCachedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Subscribe to connectivity changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Force re-check of connectivity.
   */
  private async recheckConnectivity(): Promise<void> {
    const wasConnected = this.isConnected;
    this.isConnected = await this.checkConnectivity();

    if (wasConnected !== this.isConnected) {
      this.notifyListeners();
    }
  }

  /**
   * Evaluate connectivity from NetInfo state.
   */
  private evaluateConnectivity(state: NetInfoState): boolean {
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  /**
   * Notify all listeners of connectivity change.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isConnected);
      } catch {
        // Ignore listener errors
      }
    });
  }
}

// Singleton instance
export const connectivityService = new ConnectivityServiceNative();
export default connectivityService;
