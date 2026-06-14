import posthog from 'posthog-js';

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

// Inicializar PostHog solo si hay API key configurada
if (POSTHOG_API_KEY) {
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    // Deshabilitar en desarrollo
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.opt_out_capturing();
      }
    },
    // Capturar clicks y inputs automáticamente (no scroll — puede ser ruidoso)
    autocapture: {
      dom_event_allowlist: ['click', 'change', 'submit'],
    },
    // Capturar errores de consola
    capture_console: true,
    // Capturar errores de performance
    capture_performance: true,
  });
}

export { posthog };
