/**
 * Connectivity Service - Barrel export
 *
 * Platform-specific implementations resolved at build time:
 * - Native: Uses NetInfo from react-native
 * - Web: Uses navigator.onLine + fetch check
 */

export { connectivityService as default } from './connectivityService';
