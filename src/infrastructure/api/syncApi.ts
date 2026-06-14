/**
 * Real Sync API Implementation
 *
 * Implements ISyncApi interface using fetchWithAuth for authenticated requests.
 * Handles:
 * - Pull: Download all data from server
 * - Push: Upload local changes to server
 * - Health check: Verify server connectivity
 *
 * Configuration:
 * - Uses AUTH_BASE_URL from config
 * - Auth handled by fetchWithAuth (bearer token or cookies)
 * - Timeout: 30 seconds for pull/push, 5 seconds for health
 */

import { ISyncApi, ApiError } from '../../domain/sync/ISyncApi';
import {
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  SyncHealthResponse,
} from '../../domain/sync/SyncContracts';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { AUTH_BASE_URL } from '../api/config';

// ── Configuration ──────────────────────────────────────────────────────────

const SYNC_ENDPOINTS = {
  pull: '/api/sync/pull',
  push: '/api/sync/push',
  health: '/api/sync/health',
};

const TIMEOUTS = {
  pull: 30_000,    // 30 seconds for data download
  push: 30_000,    // 30 seconds for data upload
  health: 5_000,   // 5 seconds for health check
};

// ── Helper Functions ───────────────────────────────────────────────────────

/**
 * Create an AbortSignal with timeout.
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Parse JSON response and handle errors.
 */
async function parseResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // Use default error message
    }

    throw new ApiError(
      errorMessage,
      response.status,
      endpoint,
      response.status >= 500 || response.status === 429 // Retryable on server errors or rate limit
    );
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError(
      'Failed to parse response',
      response.status,
      endpoint,
      false
    );
  }
}

// ── SyncApi Implementation ─────────────────────────────────────────────────

class SyncApi implements ISyncApi {
  private baseUrl: string;

  constructor(baseUrl: string = AUTH_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch data from server for offline operation.
   */
  async pull(request?: PullRequest): Promise<PullResponse> {
    const endpoint = SYNC_ENDPOINTS.pull;
    const url = new URL(endpoint, this.baseUrl);

    // Add query parameters
    if (request?.lastSync) {
      url.searchParams.set('lastSync', String(request.lastSync));
    }
    if (request?.cursor) {
      url.searchParams.set('cursor', request.cursor);
    }
    if (request?.limit) {
      url.searchParams.set('limit', String(request.limit));
    }

    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(TIMEOUTS.pull),
    });

    return parseResponse<PullResponse>(response, endpoint);
  }

  /**
   * Send local changes to server.
   */
  async push(request: PushRequest): Promise<PushResponse> {
    const endpoint = SYNC_ENDPOINTS.push;
    const url = new URL(endpoint, this.baseUrl);

    const response = await fetchWithAuth(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
      signal: createTimeoutSignal(TIMEOUTS.push),
    });

    return parseResponse<PushResponse>(response, endpoint);
  }

  /**
   * Check server health and connectivity.
   */
  async healthCheck(): Promise<SyncHealthResponse> {
    const endpoint = SYNC_ENDPOINTS.health;
    const url = new URL(endpoint, this.baseUrl);

    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: createTimeoutSignal(TIMEOUTS.health),
    });

    return parseResponse<SyncHealthResponse>(response, endpoint);
  }

  /**
   * Quick connectivity check (no auth required).
   * Tries to reach the server's health endpoint.
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const url = new URL(SYNC_ENDPOINTS.health, this.baseUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        // No auth needed for health check
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Update base URL (useful for environment changes).
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Create a SyncApi instance.
 * Uses the configured AUTH_BASE_URL by default.
 */
export function createSyncApi(baseUrl?: string): ISyncApi {
  return new SyncApi(baseUrl);
}

// ── Singleton Export ────────────────────────────────────────────────────────

export const syncApi: ISyncApi = new SyncApi();
export default syncApi;
