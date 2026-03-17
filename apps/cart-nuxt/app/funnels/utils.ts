// -----------------------------------------------------------------------------
/**
 * @module funnels/utils
 * @description Chunk error recovery utilities for handling Vite preload failures.
 *
 * When a deployment replaces hashed chunk files, users with stale bundles
 * will trigger `vite:preloadError` on lazy route navigation. These utilities
 * provide a one-shot page reload with loop prevention via sessionStorage.
 */

// -----------------------------------------------------------------------------

const CHUNK_RETRY_KEY = "vite-chunk-retry";

// -----------------------------------------------------------------------------

/**
 * Register a handler for Vite chunk preload errors.
 * Reloads the page once on failure; prevents infinite reload loops
 * via a sessionStorage flag.
 *
 * Call this before router creation so the listener is active
 * when the first lazy route resolves.
 */
export function registerChunkErrorRecovery(): void {
  window.addEventListener("vite:preloadError", (event: Event) => {
    event.preventDefault();

    const url = (event as CustomEvent)?.detail?.url ?? "unknown";

    if (!sessionStorage.getItem(CHUNK_RETRY_KEY)) {
      sessionStorage.setItem(CHUNK_RETRY_KEY, "true");
      console.warn("[Vite] Chunk load failed, reloading:", url);
      window.location.reload();
    } else {
      console.error("[Vite] Chunk load failed after retry:", url);
    }
  });
}

/**
 * Clear the chunk retry flag after a successful navigation.
 * Call this in a Nuxt `page:finish` hook to reset the retry mechanism
 * so future deployments can trigger a fresh reload.
 */
export function clearChunkRetryFlag(): void {
  sessionStorage.removeItem(CHUNK_RETRY_KEY);
}
