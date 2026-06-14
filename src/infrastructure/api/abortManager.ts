// Lightweight AbortManager to register AbortControllers and abort them globally
// Used to cancel in-flight requests on logout or app-wide cleanup.
// This file intentionally keeps a minimal API to avoid coupling.
type AbortControllerLike = AbortController | { signal: { aborted: boolean }; abort: () => void };

const controllers = new Set<AbortControllerLike>();

export function createAndRegisterAbortController(): AbortControllerLike {
  let ctrl: AbortControllerLike;
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).AbortController === 'function') {
    // @ts-ignore - platform AbortController
    ctrl = new (globalThis as any).AbortController();
  } else {
    // Fallback lightweight implementation (signal only) - best-effort cancellation
    ctrl = {
      signal: { aborted: false },
      abort() {
        try {
          (this.signal as any).aborted = true;
        } catch {
          // ignore — best-effort abort
        }
      },
    } as AbortControllerLike;
  }

  controllers.add(ctrl);
  return ctrl;
}

export function registerAbortController(ctrl: AbortControllerLike) {
  try {
    controllers.add(ctrl);
  } catch {
    // noop — best-effort register
  }
}

export function unregisterAbortController(ctrl: AbortControllerLike) {
  try {
    controllers.delete(ctrl);
  } catch {
    // noop — best-effort unregister
  }
}

// If callers pass an external signal and want it to be aborted on logout,
// this helper creates a proxy controller that is registered and will abort
// when the external signal fires or when abortAllControllers is invoked.
export function registerSignalAsController(signal: AbortSignal) {
  const proxy = createAndRegisterAbortController();
  // hook external signal to abort the proxy so that logout also stops it
  try {
    signal.addEventListener('abort', () => {
      try { (proxy as any).abort(); } catch {
        // noop
      }
    }, { once: true });
  } catch {
    // noop — signal.addEventListener may not be available
  }
  return proxy;
}

export function abortAllControllers() {
  for (const c of Array.from(controllers)) {
    try {
      c.abort();
    } catch {
      // noop — best-effort abort
    }
  }
  // Clear set after attempting aborts to avoid leaking references.
  try {
    controllers.clear();
  } catch {
    // noop — best-effort cleanup
  }
}

export default {
  createAndRegisterAbortController,
  registerAbortController,
  unregisterAbortController,
  abortAllControllers,
};
