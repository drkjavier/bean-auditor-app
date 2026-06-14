/**
 * PostHog Analytics - Wrapper multiplataforma
 *
 * Resuelve automáticamente la implementación correcta según plataforma:
 * - Native (Metro): posthog.react-native.ts
 * - Web (Vite): posthog.web.ts
 *
 * Uso:
 *   import { posthog } from '../analytics/posthog';
 *   posthog.capture('evento', { prop: 'valor' });
 */

// La resolución de plataforma la maneja el bundler:
// - Metro resuelve posthog.native.ts
// - Vite resuelve posthog.web.ts
export { posthog } from './posthog';
