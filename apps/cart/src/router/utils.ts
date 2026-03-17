// -----------------------------------------------------------------------------
/**
 * @module router/utils
 * @description Chunk error recovery utilities for handling Vite preload failures.
 *
 * When a deployment replaces hashed chunk files, users with stale bundles
 * will trigger `vite:preloadError` on lazy route navigation. These utilities
 * expose a reactive flag that triggers a modal interstitial (eager-loaded in
 * App.vue) instead of auto-reloading — giving the user control.
 */
import { ref } from "vue";

// -----------------------------------------------------------------------------

const CHUNK_RETRY_KEY = "vite-chunk-retry";

// --- state

/** Reactive flag indicating a chunk load error has occurred. */
export const chunkErrorOccurred = ref(false);

// -----------------------------------------------------------------------------

/**
 * Register a handler for Vite chunk preload errors.
 * Sets `chunkErrorOccurred` to show the interstitial modal.
 * Does NOT auto-reload — the user clicks a button instead.
 *
 * Call this before router creation so the listener is active
 * when the first lazy route resolves.
 */
export function registerChunkErrorRecovery(): void {
  window.addEventListener("vite:preloadError", (event: Event) => {
    event.preventDefault();

    const url = (event as CustomEvent)?.detail?.url ?? "unknown";
    console.warn("[Vite] Chunk load failed:", url);

    chunkErrorOccurred.value = true;
    sessionStorage.setItem(CHUNK_RETRY_KEY, "true");
  });
}

/**
 * Clear the chunk retry flag after a successful navigation.
 * Call this in `router.afterEach()` to reset the retry mechanism
 * so future deployments can trigger a fresh notification.
 */
export function clearChunkRetryFlag(): void {
  sessionStorage.removeItem(CHUNK_RETRY_KEY);
  chunkErrorOccurred.value = false;
}

/**
 * Reload the page to fetch fresh assets.
 * Called from the interstitial modal's action button.
 */
export function reloadPage(): void {
  window.location.reload();
}
