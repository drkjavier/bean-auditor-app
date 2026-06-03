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
        } catch (_) {}
      },
    } as AbortControllerLike;
  }

  controllers.add(ctrl);
  return ctrl;
}

export function registerAbortController(ctrl: AbortControllerLike) {
  controllers.add(ctrl);
}

export function unregisterAbortController(ctrl: AbortControllerLike) {
  controllers.delete(ctrl);
}

export function abortAllControllers() {
  for (const c of Array.from(controllers)) {
    try {
      c.abort();
    } catch (_) {}
  }
  controllers.clear();
}

export default {
  createAndRegisterAbortController,
  registerAbortController,
  unregisterAbortController,
  abortAllControllers,
};
