import {
  sessionStore as store,
  hydrateFromStorage
} from "./session-store.store";
import {
  initCookieSync,
  isCookieSyncActive,
  sessionChannel,
  stopCookieSync
} from "./session-store.sync";
// -----------------------------------------------------------------------------
// Session Store Internals (Story 1.4 / 1.5)
// Sub-composable for advanced debugging and internal access

/**
 * @internal
 * Sub-composable for accessing session store internals.
 * Use for debugging, testing, or advanced integrations.
 *
 * @example
 * ```ts
 * import { useSessionStoreInternals } from '@upmind/headless'
 *
 * const { channel, store, initCookieSync } = useSessionStoreInternals()
 *
 * // initialise cookie sync on app startup
 * initCookieSync()
 *
 * // Check if cross-tab sync is available
 * console.log('Channel available:', channel !== null)
 * ```
 *
 * @returns Internal store components for debugging
 */
export function useSessionStoreInternals() {
  return {
    /**
     * BroadcastChannel for cross-tab session sync.
     * Null in SSR or environments without BroadcastChannel support.
     */
    channel: sessionChannel,

    /**
     * initialise cookie change listener for external sync.
     * Call this once on app startup.
     */
    initCookieSync,

    /**
     * Check if cookie sync is currently active.
     */
    isCookieSyncActive,

    /**
     * Manually re-hydrate session store from sessionStorage + cookies.
     */
    refresh: hydrateFromStorage,

    /**
     * Stop cookie change sync.
     */
    stopCookieSync,

    /** Direct access to the raw session store (TanStack Vue Store). */
    store
  };
}
// -----------------------------------------------------------------------------
// Type export for consumers
export type UseSessionStoreInternals = ReturnType<
  typeof useSessionStoreInternals
>;
