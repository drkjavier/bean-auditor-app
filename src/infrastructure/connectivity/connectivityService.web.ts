/**
 * Connectivity Service - Web implementation
 *
 * Uses browser's navigator.onLine and online/offline events.
 * Note: navigator.onLine can be unreliable, so we also try to fetch a small resource.
 */

export type ConnectivityListener = (isConnected: boolean) => void;

class ConnectivityServiceWeb {
  private isConnected: boolean = navigator.onLine;
  private listeners: Set<ConnectivityListener> = new Set();
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize connectivity monitoring.
   * Call this once when the app starts.
   */
  async initialize(): Promise<void> {
    // Get initial state
    this.isConnected = await this.checkConnectivity();

    // Listen to browser online/offline events
    this.onlineHandler = () => {
      if (!this.isConnected) {
        this.isConnected = true;
        this.notifyListeners();
      }
    };

    this.offlineHandler = () => {
      if (this.isConnected) {
        this.isConnected = false;
        this.notifyListeners();
      }
    };

    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    // Periodic check every 30 seconds to catch cases where browser reports online but server is unreachable
    this.checkInterval = setInterval(() => {
      this.recheckConnectivity();
    }, 30_000);
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
      this.offlineHandler = null;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if device is connected to the internet.
   * Uses both navigator.onLine and a quick fetch attempt.
   */
  async checkConnectivity(): Promise<boolean> {
    // Quick check: if browser says offline, trust it
    if (!navigator.onLine) {
      this.isConnected = false;
      return false;
    }

    try {
      // Try to fetch a small resource to verify actual connectivity
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeout);
      this.isConnected = response.ok;
      return this.isConnected;
    } catch {
      // Network error means no connectivity
      this.isConnected = false;
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
export const connectivityService = new ConnectivityServiceWeb();
export default connectivityService;
