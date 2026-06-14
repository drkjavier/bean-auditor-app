import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  flushAt: 20,
  flushInterval: 10000,
  // Deshabilitar en desarrollo para no enviar eventos de test
  disabled: __DEV__,
  // Capturar eventos de ciclo de vida de la app
  captureAppLifecycleEvents: true,
  // No capturar touches automáticamente (usar logEvent manual)
  captureLifecycleEvents: true,
});
