// -----------------------------------------------------------------------------
/**
 * @module system/useAssetRecovery
 * @description Composable for handling Vite chunk load failures.
 *
 * Provides a shared, module-level reactive flag (`isOpen`) that both the router
 * and the AssetUnavailable component consume. The router registers the listener
 * and clears the flag; the component reads it to show/hide the interstitial.
 */
import { ref } from "vue";

// -----------------------------------------------------------------------------

const CHUNK_RETRY_KEY = "vite-chunk-retry";

// --- state (module-level singleton — shared across all consumers)

/** Reactive flag indicating a chunk load error has occurred. */
const isOpen = ref(false);

// -----------------------------------------------------------------------------

export function useAssetRecovery() {
  /**
   * Register a handler for Vite chunk preload errors.
   * Call this early (e.g. in router setup) so the listener is active
   * when the first lazy route resolves.
   */
  function register(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("vite:preloadError", (event: Event) => {
      event.preventDefault();

      const url = (event as CustomEvent)?.detail?.url ?? "unknown";

      if (!sessionStorage.getItem(CHUNK_RETRY_KEY)) {
        sessionStorage.setItem(CHUNK_RETRY_KEY, "true");
        console.warn("[Vite] Chunk load failed:", url);
        isOpen.value = true;
      } else {
        console.error("[Vite] Chunk load failed after retry:", url);
      }
    });
  }

  /**
   * Clear the chunk retry flag after a successful navigation.
   * Call this in `router.afterEach()` or Nuxt's `page:finish` hook.
   */
  function clear(): void {
    sessionStorage.removeItem(CHUNK_RETRY_KEY);
    isOpen.value = false;
  }

  /**
   * Reload the page to fetch fresh assets.
   * Called from the interstitial modal's action button.
   */
  function reload(): void {
    window.location.reload();
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** Whether the interstitial modal should be shown. */
    isOpen,
    // --- methods
    /** Clear the retry flag (call on successful navigation). */
    clear,
    /** Register the vite:preloadError handler. */
    register,
    /** Reload the page. */
    reload
  };
}

export type UseAssetRecovery = ReturnType<typeof useAssetRecovery>;
