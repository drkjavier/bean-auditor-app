// Web shim for posthog-react-native
// Redirects to posthog-js for web platform
// This allows using the same import in both native and web

import posthog from 'posthog-js';

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

// Inicializar solo si hay API key
if (POSTHOG_API_KEY && !posthog.__loaded) {
  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.opt_out_capturing();
      }
    },
  });
}

// Wrapper que expone la misma API que posthog-react-native
class PostHogWeb {
  capture(event: string, properties?: Record<string, any>) {
    return posthog.capture(event, properties);
  }

  identify(distinctId: string, properties?: Record<string, any>) {
    return posthog.identify(distinctId, properties);
  }

  reset() {
    return posthog.reset();
  }

  register(properties: Record<string, any>) {
    return posthog.register(properties);
  }

  unregister(key: string) {
    return posthog.unregister(key);
  }

  async flush() {
    return posthog.flush();
  }

  optIn() {
    return posthog.opt_in_capturing();
  }

  optOut() {
    return posthog.opt_out_capturing();
  }

  get isFeatureEnabled() {
    return posthog.isFeatureEnabled.bind(posthog);
  }

  get getFeatureFlag() {
    return posthog.getFeatureFlag.bind(posthog);
  }

  get onFeatureFlags() {
    return posthog.onFeatureFlags.bind(posthog);
  }

  get debug() {
    return posthog.debug.bind(posthog);
  }
}

const posthogInstance = new PostHogWeb();
export default posthogInstance;
export { posthogInstance as PostHog };
