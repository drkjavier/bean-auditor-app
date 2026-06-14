/**
 * Infrastructure - Barrel export
 *
 * All infrastructure services: API, connectivity, security, sync, etc.
 */

// API
export { fetchWithAuth } from './api/fetchWithAuth';
export { syncApi, createSyncApi } from './api/syncApi';
export {
  AUTH_BASE_URL,
  SYNC_BASE_URL,
  SYNC_ENDPOINTS,
  SYNC_CONFIG,
} from './api/config';

// Connectivity
export { connectivityService } from './connectivity';

// Security
export * as tokenStorage from './security/tokenStorage';
